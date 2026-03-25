export * from './bees/base.js';
export * from './bees/registry.js';
export * from './bees/types.js';
export * from './skills/loader.js';
export * from './cli/program.js';

import { run } from './cli/program.js';

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
