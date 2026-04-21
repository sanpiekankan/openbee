import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { Logger } from 'tslog';

const logger = new Logger({ name: 'Config' });

export interface LLMConfig {
  provider: string;
  apiKey: string;
  apiSecret: string;
  model: string;
  baseUrl: string;
  apiStyle: string;
  temperature: number;
}

export interface OpenBeeConfig {
  llm: LLMConfig;
}

export interface ProviderSpec {
  id: string;
  label: string;
  defaultModel: string;
  defaultBaseUrl: string;
  apiStyle: string;
  needApiSecret: boolean;
}

export const PROVIDERS: ProviderSpec[] = [
  {
    id: 'openai',
    label: 'OpenAI (Global)',
    defaultModel: 'gpt-4o',
    defaultBaseUrl: 'https://api.openai.com/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude (Global)',
    defaultModel: 'claude-3-7-sonnet-latest',
    defaultBaseUrl: 'https://api.anthropic.com',
    apiStyle: 'anthropic',
    needApiSecret: false,
  },
  {
    id: 'google',
    label: 'Google Gemini (Global)',
    defaultModel: 'gemini-2.0-flash',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'xai',
    label: 'xAI Grok (Global)',
    defaultModel: 'grok-3-latest',
    defaultBaseUrl: 'https://api.x.ai/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'deepseek',
    label: 'DeepSeek (China)',
    defaultModel: 'deepseek-chat',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'qwen',
    label: 'Qwen / DashScope (China)',
    defaultModel: 'qwen-max',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'kimi',
    label: 'Kimi / Moonshot (China)',
    defaultModel: 'kimi-k2-0711-preview',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'zhipu',
    label: 'Zhipu GLM (China)',
    defaultModel: 'glm-4-plus',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'doubao',
    label: 'Doubao / Volcano Engine (China)',
    defaultModel: 'doubao-seed-1-6-flash-250715',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'hunyuan',
    label: 'Tencent Hunyuan (China)',
    defaultModel: 'hunyuan-large',
    defaultBaseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'baidu',
    label: 'Baidu Wenxin/Qianfan (China, AK/SK)',
    defaultModel: 'ernie-4.0-turbo-8k',
    defaultBaseUrl: 'https://qianfan.baidubce.com/v2',
    apiStyle: 'baidu_qianfan',
    needApiSecret: true,
  },
  {
    id: 'minimax',
    label: 'MiniMax (China)',
    defaultModel: 'MiniMax-M1',
    defaultBaseUrl: 'https://api.minimax.chat/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'siliconflow',
    label: 'SiliconFlow (China)',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'groq',
    label: 'Groq (Global)',
    defaultModel: 'llama-3.3-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'ollama',
    label: 'Ollama (Local)',
    defaultModel: 'qwen2.5:7b',
    defaultBaseUrl: 'http://localhost:11434/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
  {
    id: 'custom',
    label: 'Custom OpenAI-Compatible',
    defaultModel: 'your-model',
    defaultBaseUrl: 'https://api.your-provider.com/v1',
    apiStyle: 'openai_compatible',
    needApiSecret: false,
  },
];

export const DEFAULT_CONFIG: OpenBeeConfig = {
  llm: {
    provider: 'openai',
    apiKey: '',
    apiSecret: '',
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
    apiStyle: 'openai_compatible',
    temperature: 0.7,
  },
};

/**
 * ConfigManager handles project configuration storage and retrieval.
 * Configuration is stored in ~/.openbee/config.json
 */
export class ConfigManager {
  private static config: OpenBeeConfig | null = null;

  /**
   * Return config directory, supporting OPENBEE_CONFIG_HOME override.
   */
  private static getConfigDir(): string {
    const custom = process.env.OPENBEE_CONFIG_HOME;
    if (custom && custom.trim()) {
      return path.resolve(custom.trim());
    }
    return path.join(os.homedir(), '.openbee');
  }

  /**
   * Return full configuration file path.
   */
  private static getConfigFilePath(): string {
    return path.join(this.getConfigDir(), 'config.json');
  }

  /**
   * Initialize configuration directory.
   */
  private static async ensureConfigDir(): Promise<void> {
    await fs.ensureDir(this.getConfigDir());
  }

  /**
   * Sanitize user-entered text by trimming wrappers and spaces.
   */
  private static sanitizeText(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }
    let cleaned = value.trim();
    const wrappers: Array<[string, string]> = [
      ['`', '`'],
      ['"', '"'],
      ["'", "'"],
    ];
    let changed = true;
    while (changed && cleaned.length > 0) {
      changed = false;
      for (const [left, right] of wrappers) {
        if (cleaned.startsWith(left) && cleaned.endsWith(right) && cleaned.length >= 2) {
          cleaned = cleaned.slice(1, -1).trim();
          changed = true;
        }
      }
    }
    return cleaned;
  }

  /**
   * Get provider spec by id with custom fallback.
   */
  static getProvider(providerId: string): ProviderSpec {
    const found = PROVIDERS.find((provider) => provider.id === providerId);
    if (found) {
      return found;
    }
    return {
      id: providerId || 'custom',
      label: providerId ? `Custom (${providerId})` : 'Custom',
      defaultModel: 'your-model',
      defaultBaseUrl: 'https://api.your-provider.com/v1',
      apiStyle: 'openai_compatible',
      needApiSecret: false,
    };
  }

  /**
   * List built-in providers.
   */
  static listProviders(): ProviderSpec[] {
    return [...PROVIDERS];
  }

  /**
   * Normalize and sanitize llm config into canonical camelCase fields.
   */
  private static normalizeLLMConfig(llm: Record<string, unknown>): LLMConfig {
    const normalized: Record<string, unknown> = { ...DEFAULT_CONFIG.llm };
    const aliases: Record<string, keyof LLMConfig> = {
      provider: 'provider',
      apiKey: 'apiKey',
      api_key: 'apiKey',
      apiSecret: 'apiSecret',
      api_secret: 'apiSecret',
      model: 'model',
      baseUrl: 'baseUrl',
      base_url: 'baseUrl',
      apiStyle: 'apiStyle',
      api_style: 'apiStyle',
      temperature: 'temperature',
    };
    for (const [oldKey, canonicalKey] of Object.entries(aliases)) {
      const value = llm[oldKey];
      if (value !== undefined && value !== null && value !== '') {
        normalized[canonicalKey] = value;
      }
    }

    for (const key of ['provider', 'apiKey', 'apiSecret', 'model', 'baseUrl', 'apiStyle'] as const) {
      normalized[key] = this.sanitizeText(normalized[key]);
    }

    const provider = String(normalized.provider || DEFAULT_CONFIG.llm.provider);
    const providerSpec = this.getProvider(provider);
    normalized.provider = provider;
    normalized.baseUrl = String(normalized.baseUrl || providerSpec.defaultBaseUrl);
    normalized.apiStyle = String(normalized.apiStyle || providerSpec.apiStyle);
    normalized.model = String(normalized.model || providerSpec.defaultModel);
    normalized.apiKey = String(normalized.apiKey || '');
    normalized.apiSecret = String(normalized.apiSecret || '');

    const parsedTemperature = Number.parseFloat(String(normalized.temperature));
    normalized.temperature = Number.isFinite(parsedTemperature)
      ? parsedTemperature
      : DEFAULT_CONFIG.llm.temperature;

    return {
      provider: String(normalized.provider),
      apiKey: String(normalized.apiKey),
      apiSecret: String(normalized.apiSecret),
      model: String(normalized.model),
      baseUrl: String(normalized.baseUrl),
      apiStyle: String(normalized.apiStyle),
      temperature: Number(normalized.temperature),
    };
  }

  /**
   * Merge loaded config with defaults.
   */
  private static mergeWithDefaults(input: unknown): OpenBeeConfig {
    const merged: OpenBeeConfig = {
      llm: { ...DEFAULT_CONFIG.llm },
    };
    if (input && typeof input === 'object' && !Array.isArray(input)) {
      const data = input as Record<string, unknown>;
      if (data.llm && typeof data.llm === 'object' && !Array.isArray(data.llm)) {
        merged.llm = this.normalizeLLMConfig(data.llm as Record<string, unknown>);
      } else {
        merged.llm = this.normalizeLLMConfig({});
      }
    } else {
      merged.llm = this.normalizeLLMConfig({});
    }
    return merged;
  }

  /**
   * Load configuration from file.
   */
  static async load(): Promise<OpenBeeConfig | null> {
    if (this.config) return this.config;

    try {
      const configFile = this.getConfigFilePath();
      if (await fs.pathExists(configFile)) {
        const data = await fs.readFile(configFile, 'utf-8');
        this.config = this.mergeWithDefaults(JSON.parse(data));
        return this.config;
      }
    } catch (error) {
      logger.error('Failed to load configuration:', error);
    }
    this.config = this.mergeWithDefaults(null);
    return this.config;
  }

  /**
   * Save configuration to file.
   */
  static async save(config: OpenBeeConfig): Promise<void> {
    try {
      await this.ensureConfigDir();
      const normalized = this.mergeWithDefaults(config);
      const configFile = this.getConfigFilePath();
      await fs.writeJson(configFile, normalized, { spaces: 2 });
      this.config = normalized;
      logger.info('Configuration saved successfully to', configFile);
    } catch (error) {
      logger.error('Failed to save configuration:', error);
      throw error;
    }
  }

  /**
   * Get the path to the configuration file.
   */
  static getConfigPath(): string {
    return this.getConfigFilePath();
  }

  /**
   * Update selected llm config fields and persist.
   */
  static async updateLLMConfig(next: Partial<LLMConfig>): Promise<OpenBeeConfig> {
    const current = await this.load();
    const llm = { ...(current?.llm ?? DEFAULT_CONFIG.llm), ...next };
    const normalized = this.normalizeLLMConfig(llm as unknown as Record<string, unknown>);
    const updated: OpenBeeConfig = { llm: normalized };
    await this.save(updated);
    return updated;
  }

  /**
   * Check if configuration exists and is valid.
   */
  static async hasConfig(): Promise<boolean> {
    const config = await this.load();
    return !!(config && config.llm && (config.llm.apiKey || config.llm.provider === 'ollama'));
  }
}
