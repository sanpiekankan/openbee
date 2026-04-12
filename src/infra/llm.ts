import OpenAI from 'openai';
import { LLMConfig } from '../config/manager.js';
import { Logger } from 'tslog';

const logger = new Logger({ name: 'LLM' });

/**
 * LLMClient provides a unified interface for interacting with LLMs.
 * It currently supports OpenAI-compatible APIs (OpenAI, Ollama, etc.).
 */
export class LLMClient {
  private client: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
    });
  }

  /**
   * Send a completion request to the LLM with optional tools
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string; tool_call_id?: string }>,
    tools?: any[]
  ): Promise<any> {
    try {
      const providerInfo = this.config.provider.toUpperCase();
      logger.info(`Sending request to ${providerInfo} (model: ${this.config.model})...`);
      
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages as any,
        tools: tools,
        temperature: this.config.temperature ?? (this.config.model.includes('k2.5') || this.config.model.includes('reasoner') ? 1.0 : 0.7),
      });

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new Error(`${providerInfo} returned an empty response.`);
      }

      return choice.message;
    } catch (error: any) {
      const providerInfo = this.config.provider.toUpperCase();
      let errorMessage = error.message;

      // Handle specific provider error structures if necessary
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error.message || errorMessage;
      }

      logger.error(`${providerInfo} request failed:`, errorMessage);
      throw new Error(`${providerInfo} Error: ${errorMessage}`);
    }
  }
}
