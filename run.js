#!/usr/bin/env node

/**
 * MicroGate - Complete System Runner
 * Runs backend server, frontend, and optionally the agent
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const processes = [];
let shutdownInProgress = false;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${color}${colors.bright}[${prefix}]${colors.reset} ${message}`);
}

function checkEnvFile(path, name) {
  if (!fs.existsSync(path)) {
    log(colors.red, 'ERROR', `${name} .env file not found at ${path}`);
    log(colors.yellow, 'INFO', `Copy .env.example to .env and configure it`);
    return false;
  }
  return true;
}

function checkNodeModules(path, name) {
  const nodeModulesPath = join(path, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log(colors.red, 'ERROR', `${name} dependencies not installed`);
    log(colors.yellow, 'INFO', `Run: cd ${path} && npm install`);
    return false;
  }
  return true;
}

function spawnProcess(name, command, args, cwd, color) {
  log(color, name, `Starting...`);
  
  const proc = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'pipe'
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => log(color, name, line));
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => log(color, name, line));
  });

  proc.on('error', (error) => {
    log(colors.red, name, `Error: ${error.message}`);
  });

  proc.on('close', (code) => {
    if (!shutdownInProgress) {
      log(colors.red, name, `Process exited with code ${code}`);
      shutdown();
    }
  });

  processes.push({ name, proc });
  return proc;
}

function shutdown() {
  if (shutdownInProgress) return;
  shutdownInProgress = true;

  log(colors.yellow, 'SHUTDOWN', 'Stopping all processes...');

  processes.forEach(({ name, proc }) => {
    try {
      log(colors.yellow, name, 'Stopping...');
      proc.kill('SIGTERM');
      
      // Force kill after 5 seconds
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
      }, 5000);
    } catch (error) {
      log(colors.red, name, `Error stopping: ${error.message}`);
    }
  });

  setTimeout(() => {
    log(colors.green, 'SHUTDOWN', 'All processes stopped. Goodbye! 👋');
    process.exit(0);
  }, 6000);
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log(colors.cyan, 'MICROGATE', 'Starting MicroGate System');
  console.log('='.repeat(60) + '\n');

  const backendDir = join(__dirname, 'backend');
  const frontendDir = join(__dirname, 'frontend');
  const backendEnv = join(backendDir, '.env');
  const frontendEnv = join(frontendDir, '.env');

  // Pre-flight checks
  log(colors.blue, 'CHECK', 'Running pre-flight checks...');
  
  let allChecksPass = true;

  if (!checkEnvFile(backendEnv, 'Backend')) allChecksPass = false;
  if (!checkEnvFile(frontendEnv, 'Frontend')) allChecksPass = false;
  if (!checkNodeModules(backendDir, 'Backend')) allChecksPass = false;
  if (!checkNodeModules(frontendDir, 'Frontend')) allChecksPass = false;

  if (!allChecksPass) {
    log(colors.red, 'ERROR', 'Pre-flight checks failed. Please fix the issues above.');
    process.exit(1);
  }

  log(colors.green, 'CHECK', 'All pre-flight checks passed! ✓');
  console.log('');

  // Start backend server
  spawnProcess(
    'BACKEND',
    'npm',
    ['start'],
    backendDir,
    colors.green
  );

  // Wait a bit for backend to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Start frontend
  spawnProcess(
    'FRONTEND',
    'npm',
    ['run', 'dev'],
    frontendDir,
    colors.cyan
  );

  console.log('');
  log(colors.green, 'READY', '🚀 MicroGate is running!');
  log(colors.blue, 'INFO', 'Backend API: http://localhost:3000');
  log(colors.blue, 'INFO', 'Frontend Dashboard: http://localhost:5173');
  log(colors.yellow, 'INFO', 'Press Ctrl+C to stop all processes');
  console.log('');
  log(colors.magenta, 'AGENT', 'To run the agent: npm run agent (in backend directory)');
  console.log('');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n');
  shutdown();
});

process.on('SIGTERM', () => {
  console.log('\n');
  shutdown();
});

process.on('uncaughtException', (error) => {
  log(colors.red, 'ERROR', `Uncaught exception: ${error.message}`);
  shutdown();
});

// Run
main().catch(error => {
  log(colors.red, 'ERROR', `Failed to start: ${error.message}`);
  process.exit(1);
});
