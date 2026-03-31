import { BeeRole, BeeContext } from './types.js';
import { Logger } from 'tslog';
import { LLMClient } from '../infra/llm.js';

const logger = new Logger({ name: 'Bee' });

/**
 * BaseBee class represents a specialized agent in the Hive.
 * Every bee has a specific role and capacity.
 */
export abstract class BaseBee {
  protected role: BeeRole;
  protected context: BeeContext;
  protected llm: LLMClient;

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
   * Get the role of the bee
   */
  getRole(): BeeRole {
    return this.role;
  }

  /**
   * Main interaction point for the bee
   */
  async think(input: string): Promise<string> {
    logger.info(`Bee ${this.role.name} is thinking about: ${input}`);
    this.context.history.push({ role: 'user', content: input });
    
    // Perform actual LLM interaction
    const response = await this.llm.chat(this.context.history);
    
    this.context.history.push({ role: 'assistant', content: response });
    return response;
  }

  /**
   * Add a skill to the bee's capacity
   */
  addSkill(skill: any) {
    this.context.skills.push(skill);
  }
}
