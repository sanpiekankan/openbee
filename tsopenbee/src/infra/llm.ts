import { LLMConfig } from '../config/manager.js';
import { Logger } from 'tslog';

const logger = new Logger({ name: 'LLM' });

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

/**
 * LLMClient routes chat requests by provider apiStyle.
 */
export class LLMClient {
  private readonly config: LLMConfig;

  /**
   * Create a client with normalized LLM config.
   */
  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Backward-compatible chat method for existing Bee runtime calls.
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string }>,
    _tools?: unknown[],
  ): Promise<{
    role: 'assistant';
    content: string;
    tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
  }> {
    const systemPrompt =
      messages.find((message) => message.role === 'system')?.content ?? 'You are a helpful assistant.';
    const userMessage =
      [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';
    const content = await this.ask(systemPrompt, userMessage);
    return {
      role: 'assistant',
      content,
    };
  }

  /**
   * Send a single-turn chat request and return assistant text.
   */
  async ask(systemPrompt: string, task: string): Promise<string> {
    logger.info(`Sending request to ${this.config.provider.toUpperCase()} (model: ${this.config.model})`);
    const style = this.config.apiStyle || 'openai_compatible';
    const timeout = 60_000;
    const temperature = Number.isFinite(this.config.temperature) ? this.config.temperature : 0.7;
    try {
      if (style === 'anthropic') {
        return await this.askAnthropic(systemPrompt, task, temperature, timeout);
      }
      if (style === 'baidu_qianfan') {
        return await this.askBaiduQianfan(systemPrompt, task, temperature, timeout);
      }
      return await this.askOpenAICompatible(systemPrompt, task, temperature, timeout);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (temperature !== 1.0 && this.isTemperatureOneOnlyError(message)) {
        return this.askOpenAICompatible(systemPrompt, task, 1.0, timeout);
      }
      throw error;
    }
  }

  /**
   * Detect model error patterns that indicate only temperature=1 is allowed.
   */
  private isTemperatureOneOnlyError(errorMessage: string): boolean {
    const text = errorMessage.toLowerCase();
    return (
      (text.includes('invalid temperature') && text.includes('only 1 is allowed')) ||
      text.includes('temperature only supports 1')
    );
  }

  /**
   * Send JSON request and parse response body.
   */
  private async requestJson(url: string, init: RequestInit, timeoutMs: number): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      const raw = await response.text();
      if (!response.ok) {
        throw new Error(`request failed: ${response.status} ${raw}`);
      }
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error(`invalid json response: ${raw.slice(0, 200)}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('request failed: timeout');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Call OpenAI-compatible /chat/completions endpoint.
   */
  private async askOpenAICompatible(
    systemPrompt: string,
    task: string,
    temperature: number,
    timeoutMs: number,
  ): Promise<string> {
    const endpoint = `${this.config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: task },
    ];
    const payload = {
      model: this.config.model,
      temperature,
      messages,
    };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }
    const data = (await this.requestJson(
      endpoint,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      timeoutMs,
    )) as Record<string, unknown>;

    const choices = data.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new Error('invalid response: missing choices');
    }
    const first = choices[0] as Record<string, unknown>;
    const message = (first.message ?? {}) as Record<string, unknown>;
    const content = message.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('invalid response: missing content');
    }
    return content;
  }

  /**
   * Call Anthropic native /v1/messages endpoint.
   */
  private async askAnthropic(
    systemPrompt: string,
    task: string,
    temperature: number,
    timeoutMs: number,
  ): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('api_key is required for Anthropic provider');
    }
    const endpoint = `${this.config.baseUrl.replace(/\/+$/, '')}/v1/messages`;
    const payload = {
      model: this.config.model,
      temperature,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: task }],
    };
    const data = (await this.requestJson(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      },
      timeoutMs,
    )) as Record<string, unknown>;
    const contentBlocks = data.content;
    if (!Array.isArray(contentBlocks) || contentBlocks.length === 0) {
      throw new Error('invalid response: missing content');
    }
    const firstBlock = contentBlocks[0] as Record<string, unknown>;
    const text = firstBlock.text;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('invalid response: missing text');
    }
    return text;
  }

  /**
   * Get Baidu Qianfan access token from AK/SK.
   */
  private async getBaiduAccessToken(timeoutMs: number): Promise<string> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      throw new Error('api_key and api_secret are required for Baidu Qianfan provider');
    }
    const query = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.apiKey,
      client_secret: this.config.apiSecret,
    });
    const endpoint = `https://aip.baidubce.com/oauth/2.0/token?${query.toString()}`;
    const data = (await this.requestJson(
      endpoint,
      {
        method: 'POST',
      },
      timeoutMs,
    )) as Record<string, unknown>;
    const token = data.access_token;
    if (typeof token !== 'string' || !token) {
      throw new Error('invalid Baidu token response');
    }
    return token;
  }

  /**
   * Call Baidu Qianfan chat endpoint.
   */
  private async askBaiduQianfan(
    systemPrompt: string,
    task: string,
    temperature: number,
    timeoutMs: number,
  ): Promise<string> {
    const token = await this.getBaiduAccessToken(timeoutMs);
    const endpoint = `${this.config.baseUrl.replace(/\/+$/, '')}/chat/completions?access_token=${encodeURIComponent(token)}`;
    const payload = {
      model: this.config.model,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: task },
      ],
    };
    const data = (await this.requestJson(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      timeoutMs,
    )) as Record<string, unknown>;
    const choices = data.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new Error('invalid response: missing choices');
    }
    const first = choices[0] as Record<string, unknown>;
    const message = (first.message ?? {}) as Record<string, unknown>;
    const content = message.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('invalid response: missing content');
    }
    return content;
  }
}
