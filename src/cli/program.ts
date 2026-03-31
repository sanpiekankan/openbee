import { Command } from 'commander';
import chalk from 'chalk';
import { BeeRegistry } from '../bees/registry.js';
import { Logger } from 'tslog';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as p from '@clack/prompts';
import { ConfigManager } from '../config/manager.js';
import { LLMClient } from '../infra/llm.js';
import { Bee } from '../bees/bee.js';

const logger = new Logger({ name: 'CLI' });
const program = new Command();

// Resolve package.json version
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

/**
 * Main entry point for the OpenBee CLI.
 * Busy as a Bee, Smart as AI, Automated for You.
 */
export function run() {
  BeeRegistry.initDefaults();

  program
    .name('openbee')
    .description('OpenBee — A hive of specialized AI bees collaborating with unique roles.')
    .version(packageJson.version);

  program
    .command('config')
    .description('Configure the OpenBee hive (LLM setup)')
    .action(async () => {
      p.intro(chalk.yellow(`${chalk.bold('OpenBee Config')} 🐝`));

      const config = await ConfigManager.load() || { llm: { provider: 'openai', model: 'gpt-4o', apiKey: '', baseUrl: '' } };

      const setup = await p.group(
        {
          provider: () =>
            p.select({
              message: 'Select LLM Provider:',
              options: [
                { value: 'openai', label: 'OpenAI' },
                { value: 'deepseek', label: 'DeepSeek' },
                { value: 'qwen', label: 'Qwen (Aliyun)' },
                { value: 'kimi', label: 'Kimi (Moonshot)' },
                { value: 'zhipu', label: 'Zhipu AI (GLM)' },
                { value: 'anthropic', label: 'Anthropic' },
                { value: 'ollama', label: 'Ollama (Local)' },
                { value: 'custom', label: 'Custom OpenAI-compatible' },
              ],
              initialValue: config.llm.provider,
            }),
          apiKey: ({ results }) =>
            results.provider !== 'ollama'
              ? p.text({
                  message: `Enter ${results.provider} API Key:`,
                  placeholder: 'your-api-key',
                  initialValue: config.llm.apiKey,
                })
              : Promise.resolve(''),
          baseUrl: ({ results }) => {
            const defaults: Record<string, string> = {
              deepseek: 'https://api.deepseek.com',
              qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
              kimi: 'https://api.moonshot.cn/v1',
              zhipu: 'https://open.bigmodel.cn/api/paas/v4/',
              ollama: 'http://localhost:11434/v1',
            };
            const defaultUrl = defaults[results.provider as string] || '';
            
            if (results.provider === 'openai' || results.provider === 'anthropic') {
              return Promise.resolve(defaultUrl);
            }

            return p.text({
              message: 'Enter Base URL:',
              placeholder: defaultUrl || 'https://api.your-provider.com/v1',
              initialValue: config.llm.baseUrl || defaultUrl,
            });
          },
          model: ({ results }) => {
            const modelDefaults: Record<string, string> = {
              deepseek: 'deepseek-chat', // or deepseek-reasoner
              qwen: 'qwen-max',
              kimi: 'kimi-k2.5',
              zhipu: 'glm-4-plus',
              openai: 'gpt-4o',
            };
            const placeholders: Record<string, string> = {
              deepseek: 'deepseek-chat, deepseek-reasoner',
              qwen: 'qwen-max, qwen-plus, qwen-turbo',
              kimi: 'kimi-k2.5, moonshot-v1-8k, moonshot-v1-32k',
              zhipu: 'glm-4-plus, glm-4-0520, glm-4',
              openai: 'gpt-4o, gpt-4-turbo, gpt-3.5-turbo',
            };
            const defaultModel = modelDefaults[results.provider as string] || '';
            const placeholder = placeholders[results.provider as string] || 'model-name';

            return p.text({
              message: 'Enter Model Name:',
              placeholder: placeholder,
              initialValue: config.llm.model || defaultModel,
            });
          },
        },
        {
          onCancel: () => {
            p.cancel('Configuration cancelled.');
            process.exit(0);
          },
        }
      );

      await ConfigManager.save({
        llm: {
          provider: setup.provider as string,
          apiKey: setup.apiKey as string,
          model: setup.model as string,
          baseUrl: setup.baseUrl as string,
        },
      });

      p.outro(chalk.green('Configuration saved successfully! Hive is ready to work. 🐝'));
    });

  program
    .command('list')
    .description('List all available Bee roles in the Hive')
    .action(() => {
      const roles = BeeRegistry.list();
      console.log(chalk.yellow('\nAvailable Bee Roles in the Hive:'));
      console.log(chalk.cyan('='.repeat(40)));
      roles.forEach(role => {
        console.log(`${chalk.bold(role.name)} (${chalk.gray(role.id)})`);
        console.log(`  ${role.description}\n`);
      });
    });

  program
    .command('ask')
    .description('Ask a specific Bee role to perform a task')
    .argument('<role>', 'The ID of the bee role (e.g., worker, researcher)')
    .argument('<task...>', 'The task or question for the bee')
    .action(async (roleId, taskParts) => {
      const task = taskParts.join(' ');
      const role = BeeRegistry.get(roleId);

      if (!role) {
        p.log.error(chalk.red(`Error: Bee role "${roleId}" not found in the Hive.`));
        process.exit(1);
      }

      const config = await ConfigManager.load();
      if (!config || !config.llm || !config.llm.apiKey) {
        p.log.error(chalk.red('Error: LLM not configured. Please run "openbee config" first.'));
        process.exit(1);
      }

      const s = p.spinner();
      s.start(chalk.green(`Summoning ${role.name} to work on: "${task}"...`));

      try {
        const llm = new LLMClient(config.llm);
        const bee = new Bee(role, llm);
        const response = await bee.think(task);

        s.stop(chalk.cyan(`[${role.name}] has finished thinking.`));
        
        console.log(`\n${chalk.bold(role.name)}:`);
        console.log(`${response}\n`);
        
        p.log.info(chalk.gray(`  Role: ${role.description}`));
        p.log.info(chalk.gray(`  Skills: ${role.skills.join(', ')}`));
      } catch (error: any) {
        s.stop(chalk.red('The bee got confused or ran into an error.'));
        p.log.error(chalk.red(`Error: ${error.message}`));
      }
    });

  program.parse();
}
