#!/usr/bin/env node
// scripts/ci-local.js
// Runs comprehensive local CI pipeline:
// 1. Temporarily ignores .env and .dev.vars
// 2. Sets CI=true and TZ=UTC
// 3. Runs ESLint
// 4. Runs Vitest tests with coverage in shuffled order (UTC)
// 5. Runs Vitest tests in shuffled order with TZ=Asia/Kolkata
// 6. Runs Vite production build
// 7. Safely restores .env and .dev.vars in finally block

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const envFile = path.join(rootDir, '.env');
const envBak = path.join(rootDir, '.env.ci_local_bak');
const devVarsFile = path.join(rootDir, '.dev.vars');
const devVarsBak = path.join(rootDir, '.dev.vars.ci_local_bak');

let stashedEnv = false;
let stashedDevVars = false;

function stashFile(source, target) {
  if (fs.existsSync(source)) {
    fs.renameSync(source, target);
    return true;
  }
  return false;
}

function restoreFile(source, target) {
  if (fs.existsSync(target)) {
    if (fs.existsSync(source)) {
      fs.unlinkSync(source);
    }
    fs.renameSync(target, source);
  }
}

function runCommand(command, args, extraEnv = {}) {
  const isWindows = process.platform === 'win32';
  const binName = isWindows && !command.endsWith('.cmd') && !command.endsWith('.exe')
    ? `${command}.cmd`
    : command;

  console.log(`\n========================================`);
  console.log(`> ${command} ${args.join(' ')}`);
  console.log(`  Environment: ${JSON.stringify(extraEnv)}`);
  console.log(`========================================\n`);

  const mergedEnv = {
    ...process.env,
    ...extraEnv
  };

  const result = spawnSync(binName, args, {
    stdio: 'inherit',
    env: mergedEnv,
    shell: true
  });

  if (result.error) {
    console.error(`Failed to execute ${command}:`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\n❌ Command failed with exit code ${result.status}: ${command} ${args.join(' ')}\n`);
    process.exit(result.status || 1);
  }
}

console.log('🚀 Starting CI Local Pipeline (Hermetic & Shuffled)...');

try {
  // 1. Temporarily stash .env and .dev.vars
  stashedEnv = stashFile(envFile, envBak);
  stashedDevVars = stashFile(devVarsFile, devVarsBak);

  // 2. Step 1: Run Linter
  runCommand('pnpm', ['run', 'lint'], {
    CI: 'true'
  });

  // 3. Step 2: Run Shuffled Test Suite with Coverage under TZ=UTC
  runCommand('pnpm', ['exec', 'vitest', 'run', '--coverage', '--sequence.shuffle'], {
    CI: 'true',
    TZ: 'UTC'
  });

  // 4. Step 3: Run Shuffled Test Suite under TZ=Asia/Kolkata
  runCommand('pnpm', ['exec', 'vitest', 'run', '--sequence.shuffle'], {
    CI: 'true',
    TZ: 'Asia/Kolkata'
  });

  // 5. Step 4: Run Vite Production Build
  runCommand('pnpm', ['run', 'build'], {
    CI: 'true'
  });

  console.log('\n✅ All local CI checks passed cleanly!\n');
} finally {
  // Safely restore stashed files
  if (stashedEnv) {
    restoreFile(envFile, envBak);
  }
  if (stashedDevVars) {
    restoreFile(devVarsFile, devVarsBak);
  }
}
