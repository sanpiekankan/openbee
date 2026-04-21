import fs from 'fs-extra';
import path from 'path';
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
  filePath: string;
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
  static async load(filePath: string): Promise<Skill | undefined> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tokens = md.parse(content, {});
      const skill: Skill = {
        id: path.basename(filePath, '.md'),
        name: '',
        description: '',
        commands: [],
        systemPrompt: '',
        filePath,
      };

      let inSystemPrompt = false;
      const systemPromptParts: string[] = [];
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === 'heading_open' && tokens[i].tag === 'h1' && tokens[i + 1]) {
          skill.name = tokens[i + 1].content;
          continue;
        }
        if (tokens[i].type === 'paragraph_open' && skill.name && !skill.description && tokens[i + 1]) {
          skill.description = tokens[i + 1].content;
          continue;
        }
        if (tokens[i].type === 'heading_open' && tokens[i].tag === 'h2' && tokens[i + 1]) {
          const h2 = tokens[i + 1].content.trim().toLowerCase();
          inSystemPrompt = h2 === 'system prompt';
          continue;
        }
        if (inSystemPrompt && tokens[i].type === 'inline' && tokens[i].content.trim()) {
          systemPromptParts.push(tokens[i].content.trim());
        }
      }
      skill.systemPrompt = systemPromptParts.join('\n').trim();
      if (!skill.name) {
        skill.name = skill.id;
      }
      if (!skill.description) {
        skill.description = `${skill.name} skill`;
      }

      logger.info(`Loaded skill: ${skill.name} (${skill.id})`);
      return skill;
    } catch (error) {
      logger.error(`Failed to load skill from ${filePath}`, error);
      return undefined;
    }
  }

  static async loadAll(skillsDir: string): Promise<Skill[]> {
    if (!(await fs.pathExists(skillsDir))) {
      return [];
    }
    const files = await fs.readdir(skillsDir);
    const markdownFiles = files.filter((file) => file.endsWith('.md'));
    const loaded = await Promise.all(
      markdownFiles.map((file) => SkillLoader.load(path.join(skillsDir, file))),
    );
    return loaded.filter((skill): skill is Skill => Boolean(skill));
  }

  static async loadForRole(rootDir: string, roleSkills: string[]): Promise<Skill[]> {
    const skillsDir = path.join(rootDir, 'skills');
    const allSkills = await SkillLoader.loadAll(skillsDir);
    if (!roleSkills || roleSkills.length === 0) {
      return allSkills;
    }
    const allowSet = new Set(roleSkills.map((item) => item.trim().toLowerCase()).filter(Boolean));
    return allSkills.filter((skill) => allowSet.has(skill.id.toLowerCase()));
  }
}
