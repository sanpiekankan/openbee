import { Command } from 'commander';
import { BeeRegistry } from '../bees/registry.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as p from '@clack/prompts';
import {
  ConfigManager,
  DEFAULT_CONFIG,
  LLMConfig,
  ProviderSpec,
} from '../config/manager.js';
import { LLMClient } from '../infra/llm.js';
const program = new Command();

// Resolve package.json version
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

/**
 * Main entry point for the OpenBee CLI.
 * Build a list of provider options for select prompt.
 */
function buildProviderOptions(providers: ProviderSpec[]): Array<{ value: string; label: string }> {
  return providers.map((provider) => ({
    value: provider.id,
    label: `${provider.label} [${provider.id}]`,
  }));
}

/**
 * Convert unknown value to trimmed string.
 */
function toText(input: unknown, fallback = ''): string {
  const value = typeof input === 'string' ? input.trim() : '';
  return value || fallback;
}

/**
 * Parse unknown value to number with fallback.
 */
function toNumber(input: unknown, fallback: number): number {
  const parsed = Number.parseFloat(String(input));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Run interactive config flow that mirrors pyopenbee behavior.
 */
async function runInteractiveConfig(): Promise<number> {
  const config = (await ConfigManager.load()) ?? DEFAULT_CONFIG;
  const providers = ConfigManager.listProviders();
  const currentProvider = toText(config.llm.provider, 'openai');
  const selectedProviderId = await p.select({
    message: 'Select model provider:',
    options: buildProviderOptions(providers),
    initialValue: currentProvider,
  });
  if (p.isCancel(selectedProviderId)) {
    p.cancel('Configuration cancelled.');
    return 0;
  }
  const selectedProvider = ConfigManager.getProvider(String(selectedProviderId));
  const switchingProvider = currentProvider !== selectedProvider.id;
  const defaultModel = switchingProvider ? selectedProvider.defaultModel : toText(config.llm.model, selectedProvider.defaultModel);
  const defaultBaseUrl = switchingProvider
    ? selectedProvider.defaultBaseUrl
    : toText(config.llm.baseUrl, selectedProvider.defaultBaseUrl);
  const defaultTemperature = toNumber(config.llm.temperature, 0.7);

  const model = await p.text({
    message: 'Model name',
    placeholder: defaultModel,
    initialValue: defaultModel,
  });
  if (p.isCancel(model)) {
    p.cancel('Configuration cancelled.');
    return 0;
  }
  const baseUrl = await p.text({
    message: 'Base URL',
    placeholder: defaultBaseUrl,
    initialValue: defaultBaseUrl,
  });
  if (p.isCancel(baseUrl)) {
    p.cancel('Configuration cancelled.');
    return 0;
  }
  const apiKey = await p.password({
    message: 'API Key',
    mask: '*',
  });
  if (p.isCancel(apiKey)) {
    p.cancel('Configuration cancelled.');
    return 0;
  }
  let apiSecret = '';
  if (selectedProvider.needApiSecret) {
    const secretInput = await p.password({
      message: 'API Secret',
      mask: '*',
    });
    if (p.isCancel(secretInput)) {
      p.cancel('Configuration cancelled.');
      return 0;
    }
    apiSecret = String(secretInput);
  }
  const temperature = await p.text({
    message: 'Temperature',
    placeholder: String(defaultTemperature),
    initialValue: String(defaultTemperature),
    validate(value) {
      const parsed = Number.parseFloat(String(value ?? ''));
      if (!Number.isFinite(parsed)) {
        return 'Invalid number, please try again.';
      }
      return undefined;
    },
  });
  if (p.isCancel(temperature)) {
    p.cancel('Configuration cancelled.');
    return 0;
  }

  const updated = await ConfigManager.updateLLMConfig({
    provider: selectedProvider.id,
    apiKey: String(apiKey),
    apiSecret,
    model: String(model),
    baseUrl: String(baseUrl),
    apiStyle: selectedProvider.apiStyle,
    temperature: Number.parseFloat(String(temperature)),
  });
  console.log('Configuration updated.');
  console.log(JSON.stringify(updated, null, 2));
  return 0;
}

/**
 * Main entry point for the OpenBee CLI.
 */
export function run() {
  BeeRegistry.initDefaults();

  program
    .name('openbee')
    .description('OpenBee — A hive of specialized AI bees collaborating with unique roles.')
    .version(packageJson.version);

  program
    .command('config')
    .description('Show or update LLM config')
    .option('--provider <provider>', 'LLM provider name')
    .option('--api-key <apiKey>', 'LLM API key')
    .option('--api-secret <apiSecret>', 'LLM API secret (if required)')
    .option('--model <model>', 'LLM model name')
    .option('--base-url <baseUrl>', 'OpenAI-compatible base URL')
    .option('--api-style <apiStyle>', 'API style override')
    .option('--temperature <temperature>', 'Sampling temperature')
    .action(async (options: Record<string, unknown>) => {
      const hasUpdates = [
        options.provider,
        options.apiKey,
        options.apiSecret,
        options.model,
        options.baseUrl,
        options.apiStyle,
        options.temperature,
      ].some((value) => value !== undefined);
      if (hasUpdates) {
        const updated = await ConfigManager.updateLLMConfig({
          provider: options.provider ? String(options.provider) : undefined,
          apiKey: options.apiKey ? String(options.apiKey) : undefined,
          apiSecret: options.apiSecret ? String(options.apiSecret) : undefined,
          model: options.model ? String(options.model) : undefined,
          baseUrl: options.baseUrl ? String(options.baseUrl) : undefined,
          apiStyle: options.apiStyle ? String(options.apiStyle) : undefined,
          temperature:
            options.temperature !== undefined ? Number.parseFloat(String(options.temperature)) : undefined,
        } as Partial<LLMConfig>);
        console.log('Configuration updated.');
        console.log(JSON.stringify(updated, null, 2));
        return;
      }
      await runInteractiveConfig();
    });

  program
    .command('list')
    .description('List available bee roles')
    .action(() => {
      const roles = BeeRegistry.list();
      roles.forEach((role) => {
        console.log(`${role.name} (${role.id})`);
        console.log(`  ${role.description}`);
      });
    });

  program
    .command('ask')
    .description('Ask a role to perform a task')
    .argument('<role>', 'Role id, e.g. worker')
    .argument('<task...>', 'Task text')
    .option('--provider <provider>', 'Override provider')
    .option('--api-key <apiKey>', 'Override API key')
    .option('--api-secret <apiSecret>', 'Override API secret')
    .option('--model <model>', 'Override model')
    .option('--base-url <baseUrl>', 'Override base URL')
    .option('--api-style <apiStyle>', 'Override API style')
    .option('--temperature <temperature>', 'Override temperature')
    .action(async (roleId: string, taskParts: string[], options: Record<string, unknown>) => {
      const task = taskParts.join(' ');
      const role = BeeRegistry.get(roleId);

      if (!role) {
        console.error(`Error: role "${roleId}" not found.`);
        process.exitCode = 1;
        return;
      }

      const config = (await ConfigManager.load()) ?? DEFAULT_CONFIG;
      const provider = toText(options.provider, config.llm.provider || 'openai');
      const providerSpec = ConfigManager.getProvider(provider);
      const merged: LLMConfig = {
        provider,
        apiKey: toText(options.apiKey, config.llm.apiKey),
        apiSecret: toText(options.apiSecret, config.llm.apiSecret),
        model: toText(options.model, config.llm.model || providerSpec.defaultModel),
        baseUrl: toText(options.baseUrl, config.llm.baseUrl || providerSpec.defaultBaseUrl),
        apiStyle: toText(options.apiStyle, config.llm.apiStyle || providerSpec.apiStyle),
        temperature:
          options.temperature !== undefined
            ? toNumber(options.temperature, config.llm.temperature)
            : toNumber(config.llm.temperature, 0.7),
      };

      if (!merged.apiKey && provider !== 'ollama') {
        console.error('Error: API key missing. Run "openbee config" to set it first.');
        process.exitCode = 1;
        return;
      }
      if (providerSpec.needApiSecret && !merged.apiSecret) {
        console.error(`Error: API secret missing for provider "${provider}". Run "openbee config" to set it first.`);
        process.exitCode = 1;
        return;
      }

      try {
        const llm = new LLMClient(merged);
        const content = await llm.ask(role.systemPrompt, task);
        console.log(content);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${message}`);
        process.exitCode = 1;
      }
    });

  program.parse();
}
