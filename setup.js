#!/usr/bin/env node

/**
 * MicroGate Setup Script
 * Helps users set up the project for the first time
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${color}${colors.bright}[${prefix}]${colors.reset} ${message}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function copyEnvFile(examplePath, targetPath, name) {
  if (fs.existsSync(targetPath)) {
    log(colors.yellow, 'SKIP', `${name} .env already exists`);
    return;
  }

  if (!fs.existsSync(examplePath)) {
    log(colors.red, 'ERROR', `${name} .env.example not found`);
    return;
  }

  fs.copyFileSync(examplePath, targetPath);
  log(colors.green, 'CREATED', `${name} .env file created`);
}

async function installDependencies(dir, name) {
  try {
    log(colors.blue, 'INSTALL', `Installing ${name} dependencies...`);
    execSync('npm install', { cwd: dir, stdio: 'inherit' });
    log(colors.green, 'SUCCESS', `${name} dependencies installed`);
  } catch (error) {
    log(colors.red, 'ERROR', `Failed to install ${name} dependencies`);
    throw error;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log(colors.cyan, 'SETUP', 'MicroGate Setup Wizard');
  console.log('='.repeat(60) + '\n');

  const backendDir = path.join(__dirname, 'backend');
  const frontendDir = path.join(__dirname, 'frontend');

  log(colors.blue, 'INFO', 'This will help you set up the MicroGate project');
  console.log('');

  // Step 1: Install dependencies
  const installDeps = await question('Install dependencies? (y/n): ');
  if (installDeps.toLowerCase() === 'y') {
    console.log('');
    await installDependencies(backendDir, 'Backend');
    await installDependencies(frontendDir, 'Frontend');
    console.log('');
  }

  // Step 2: Create .env files
  log(colors.blue, 'SETUP', 'Setting up environment files...');
  console.log('');

  const backendEnvExample = path.join(backendDir, '.env.example');
  const backendEnv = path.join(backendDir, '.env');
  await copyEnvFile(backendEnvExample, backendEnv, 'Backend');

  const frontendEnvExample = path.join(frontendDir, '.env.example');
  const frontendEnv = path.join(frontendDir, '.env');
  await copyEnvFile(frontendEnvExample, frontendEnv, 'Frontend');

  console.log('');
  log(colors.yellow, 'IMPORTANT', 'You need to configure the .env files with your actual values:');
  console.log('');
  console.log('  Backend (.env):');
  console.log('    - PRIVATE_KEY: Your wallet private key');
  console.log('    - WALLET_ADDRESS: Your wallet public address');
  console.log('');
  console.log('  Frontend (.env):');
  console.log('    - VITE_AGENT_WALLET_ADDRESS: Your agent wallet address');
  console.log('    - VITE_TRANSAK_API_KEY: Get from https://transak.com/');
  console.log('');

  log(colors.green, 'SUCCESS', 'Setup complete!');
  console.log('');
  log(colors.cyan, 'NEXT STEPS', 'To run the project:');
  console.log('');
  console.log('  1. Configure the .env files (see above)');
  console.log('  2. Run: npm start');
  console.log('  3. Or use platform-specific scripts:');
  console.log('     - Windows: .\\run.ps1');
  console.log('     - Unix/Mac: ./run.sh');
  console.log('');
  log(colors.blue, 'DOCS', 'See README.md for more information');
  console.log('');

  rl.close();
}

main().catch(error => {
  log(colors.red, 'ERROR', error.message);
  process.exit(1);
});
