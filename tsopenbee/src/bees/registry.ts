import { BeeRole } from './types.js';

/**
 * Registry for all available Bee roles in the Hive.
 */
export class BeeRegistry {
  private static roles: Map<string, BeeRole> = new Map();

  /**
   * Register a new Bee role
   */
  static register(role: BeeRole) {
    this.roles.set(role.id, role);
  }

  /**
   * Get a Bee role by ID
   */
  static get(id: string): BeeRole | undefined {
    return this.roles.get(id);
  }

  /**
   * List all available Bee roles
   */
  static list(): BeeRole[] {
    return Array.from(this.roles.values());
  }

  /**
   * Initialize with default roles
   */
  static initDefaults() {
    this.register({
      id: 'worker',
      name: 'Worker Bee',
      description: 'A general-purpose AI assistant for common tasks.',
      systemPrompt: 'You are a diligent Worker Bee. Your goal is to assist users with general tasks efficiently.',
      skills: ['filesystem', 'websearch']
    });

    this.register({
      id: 'researcher',
      name: 'Researcher Bee',
      description: 'A specialized bee for deep research and information gathering.',
      systemPrompt: 'You are a curious Researcher Bee. You excel at finding information and synthesizing it into clear reports.',
      skills: ['websearch', 'summarizer']
    });

    this.register({
      id: 'architect',
      name: 'Architect Bee',
      description: 'A specialized bee for system design and planning.',
      systemPrompt: 'You are a visionary Architect Bee. You focus on structure, scalability, and design patterns.',
      skills: ['diagramming', 'planning']
    });
  }
}
