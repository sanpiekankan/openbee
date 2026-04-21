import { BaseBee } from './base.js';
import { BeeRole } from './types.js';
import { LLMClient } from '../infra/llm.js';

/**
 * A concrete implementation of a Bee agent.
 */
export class Bee extends BaseBee {
  constructor(role: BeeRole, llm: LLMClient) {
    super(role, llm);
  }
}
