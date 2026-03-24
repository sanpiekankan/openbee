/**
 * Post-installation script for @openbee/openbee
 * Displays a welcome message and a call for talents.
 */

const projectInfo = {
  name: "OpenBee",
  description: "Busy as a Bee, Smart as AI, Automated for You",
  tagline: "Building a user-friendly, strong, and secure AI agent/skill CLI tool.",
  github: "https://github.com/sanpiekankan/openbee"
};

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m"
};

function displayWelcomeMessage() {
  const line = "=".repeat(60);
  
  console.log(`\n${colors.cyan}${line}${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}Welcome to ${projectInfo.name}!${colors.reset}`);
  console.log(`${colors.green}${projectInfo.description}${colors.reset}`);
  console.log(`\n${projectInfo.tagline}`);
  console.log(`\n${colors.bright}We are looking for talents to join this open-source project!${colors.reset}`);
  console.log(`Check us out at: ${colors.cyan}${projectInfo.github}${colors.reset}`);
  console.log(`${colors.cyan}${line}${colors.reset}\n`);
}

displayWelcomeMessage();
