import { Command } from 'commander';
import chalk from 'chalk';
import { BeeRegistry } from '../bees/registry.js';
import { Logger } from 'tslog';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
        console.error(chalk.red(`Error: Bee role "${roleId}" not found in the Hive.`));
        process.exit(1);
      }

      console.log(chalk.green(`\n🐝 Summoning ${role.name} to work on: "${task}"...`));
      
      // Simulating a bee thinking
      setTimeout(() => {
        console.log(chalk.cyan(`\n[${role.name}]: I've started working on your request using my specialized capacities.`));
        console.log(chalk.gray(`  Role: ${role.description}`));
        console.log(chalk.gray(`  Skills: ${role.skills.join(', ')}`));
        console.log(chalk.green('\nTask complete! (Simulation mode)'));
      }, 1000);
    });

  program.parse();
}
