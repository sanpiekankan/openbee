import { BeeRole, BeeContext, BeeTool } from './types.js';
import { Logger } from 'tslog';
import { LLMClient } from '../infra/llm.js';
import { Skill, SkillLoader } from '../skills/loader.js';
import { resolveToolsForSkills } from './tools.js';

const logger = new Logger({ name: 'Bee' });

/**
 * BaseBee class represents a specialized agent in the Hive.
 * Every bee has a specific role and capacity.
 */
export abstract class BaseBee {
  protected role: BeeRole;
  protected context: BeeContext;
  protected llm: LLMClient;
  protected tools: Map<string, BeeTool> = new Map();
  private runtimeReady = false;

  constructor(role: BeeRole, llm: LLMClient) {
    this.role = role;
    this.llm = llm;
    this.context = {
      role,
      history: [{ role: 'system', content: role.systemPrompt }],
      skills: []
    };
  }

  /**
   * Main interaction point for the bee
   */
  async think(input: string): Promise<string> {
    await this.ensureRuntimeReady();
    logger.info(`Bee ${this.role.name} is thinking about: ${input}`);
    this.context.history.push({ role: 'user', content: input });

    // Format tools for LLM
    const availableTools = Array.from(this.tools.values()).map(tool => ({
      type: 'function',
      function: tool.definition
    }));

    let loopCount = 0;
    const MAX_LOOPS = 5;

    while (loopCount < MAX_LOOPS) {
      loopCount++;
      
      const message = await this.llm.chat(this.context.history as any, availableTools.length > 0 ? availableTools : undefined);
      
      // Add assistant response to history
      this.context.history.push(message as any);

      if (message.tool_calls && message.tool_calls.length > 0) {
        logger.info(`Bee ${this.role.name} decided to use tools: ${message.tool_calls.length} calls.`);
        
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = this.safeParseToolArguments(toolCall.function.arguments);
          const tool = this.tools.get(toolName);

          if (tool) {
            try {
              const result = await tool.execute(toolArgs);
              this.context.history.push({
                role: 'tool' as any,
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
              });
            } catch (error: any) {
              this.context.history.push({
                role: 'tool' as any,
                tool_call_id: toolCall.id,
                content: `Error executing tool: ${error.message}`
              });
            }
          } else {
            this.context.history.push({
              role: 'tool' as any,
              tool_call_id: toolCall.id,
              content: `Error: Tool ${toolName} not found.`
            });
          }
        }
        // Continue loop to get next LLM response after tool results
        continue;
      }

      // No more tool calls, return final content
      return message.content || '';
    }

    return "I've reached my maximum reasoning steps. Please try rephrasing your request.";
  }

  /**
   * Add a tool to the bee's capacity
   */
  addTool(tool: BeeTool) {
    this.tools.set(tool.definition.name, tool);
  }

  private async ensureRuntimeReady(): Promise<void> {
    if (this.runtimeReady) {
      return;
    }
    const loadedSkills = await SkillLoader.loadForRole(process.cwd(), this.role.skills);
    this.context.skills = loadedSkills;
    const skillSection = this.buildAvailableSkillsPrompt(loadedSkills);
    this.context.history[0] = {
      role: 'system',
      content: `${this.role.systemPrompt}\n\n${skillSection}`,
    };
    const roleTools = resolveToolsForSkills(this.role.skills);
    for (const tool of roleTools) {
      this.addTool(tool);
    }
    this.runtimeReady = true;
  }

  private buildAvailableSkillsPrompt(skills: Skill[]): string {
    if (skills.length === 0) {
      return '<available_skills>\n</available_skills>';
    }
    const lines = skills.map((skill) => {
      return `- ${skill.id}: ${skill.description} (${skill.filePath})`;
    });
    return [
      'You must review available skills before deciding whether to use tools.',
      'Pick one most relevant skill when there is a clear match.',
      'If no skill clearly matches, continue without reading a skill file.',
      '<available_skills>',
      ...lines,
      '</available_skills>',
    ].join('\n');
  }

  private safeParseToolArguments(raw: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
}
