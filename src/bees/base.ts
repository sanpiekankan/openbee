import { BeeRole, BeeContext } from './types.js';
import { Logger } from 'tslog';

const logger = new Logger({ name: 'Bee' });

/**
 * BaseBee class represents a specialized agent in the Hive.
 * Every bee has a specific role and capacity.
 */
export abstract class BaseBee {
  protected role: BeeRole;
  protected context: BeeContext;

  constructor(role: BeeRole) {
    this.role = role;
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
    
    // Implementation for LLM interaction would go here
    const response = `Bee [${this.role.name}]: I am working on "${input}" using my ${this.role.description} capacities.`;
    
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
