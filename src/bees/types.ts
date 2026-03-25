/**
 * Types for the Bee Hive
 */

export interface BeeRole {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  skills: string[]; // List of skill IDs
}

export interface BeeContext {
  role: BeeRole;
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  skills: any[]; // Loaded skills
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
  execute: (args: any) => Promise<any>;
}
