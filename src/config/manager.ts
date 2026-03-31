import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { Logger } from 'tslog';

const logger = new Logger({ name: 'Config' });

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
}

export interface OpenBeeConfig {
  llm: LLMConfig;
}

/**
 * ConfigManager handles project configuration storage and retrieval.
 * Configuration is stored in ~/.openbee/config.json
 */
export class ConfigManager {
  private static readonly CONFIG_DIR = path.join(os.homedir(), '.openbee');
  private static readonly CONFIG_FILE = path.join(ConfigManager.CONFIG_DIR, 'config.json');

  private static config: OpenBeeConfig | null = null;

  /**
   * Initialize configuration directory
   */
  private static async ensureConfigDir() {
    if (!(await fs.pathExists(this.CONFIG_DIR))) {
      await fs.ensureDir(this.CONFIG_DIR);
    }
  }

  /**
   * Load configuration from file
   */
  static async load(): Promise<OpenBeeConfig | null> {
    if (this.config) return this.config;

    try {
      if (await fs.pathExists(this.CONFIG_FILE)) {
        const data = await fs.readFile(this.CONFIG_FILE, 'utf-8');
        this.config = JSON.parse(data);
        return this.config;
      }
    } catch (error) {
      logger.error('Failed to load configuration:', error);
    }
    return null;
  }

  /**
   * Save configuration to file
   */
  static async save(config: OpenBeeConfig): Promise<void> {
    try {
      await this.ensureConfigDir();
      await fs.writeJson(this.CONFIG_FILE, config, { spaces: 2 });
      this.config = config;
      logger.info('Configuration saved successfully to', this.CONFIG_FILE);
    } catch (error) {
      logger.error('Failed to save configuration:', error);
      throw error;
    }
  }

  /**
   * Get the path to the configuration file
   */
  static getConfigPath(): string {
    return this.CONFIG_FILE;
  }

  /**
   * Check if configuration exists and is valid
   */
  static async hasConfig(): Promise<boolean> {
    const config = await this.load();
    return !!(config && config.llm && config.llm.apiKey);
  }
}
