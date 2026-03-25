import fs from 'fs-extra';
import MarkdownIt from 'markdown-it';
import { Logger } from 'tslog';

const logger = new Logger({ name: 'SkillLoader' });
const md = new MarkdownIt();

export interface Skill {
  id: string;
  name: string;
  description: string;
  commands: Command[];
  systemPrompt: string;
}

export interface Command {
  name: string;
  description: string;
  parameters: any;
}

/**
 * SkillLoader reads skill definitions from Markdown files.
 * This allows defining capabilities in a human-readable format.
 */
export class SkillLoader {
  /**
   * Load a skill from a Markdown file
   */
  static async load(filePath: string): Promise<Skill | undefined> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tokens = md.parse(content, {});
      
      // Basic parsing logic (simplified version of OpenClaw's)
      let skill: Skill = {
        id: filePath.split('/').pop()?.replace('.md', '') || 'unknown',
        name: '',
        description: '',
        commands: [],
        systemPrompt: ''
      };

      // Extract title and description from Markdown
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === 'heading_open' && tokens[i].tag === 'h1') {
          skill.name = tokens[i + 1].content;
        }
        if (tokens[i].type === 'paragraph_open' && skill.name && !skill.description) {
          skill.description = tokens[i + 1].content;
        }
      }

      logger.info(`Loaded skill: ${skill.name} (${skill.id})`);
      return skill;
    } catch (error) {
      logger.error(`Failed to load skill from ${filePath}`, error);
      return undefined;
    }
  }
}
