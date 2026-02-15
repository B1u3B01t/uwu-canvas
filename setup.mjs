#!/usr/bin/env node

/**
 * uwu-canvas setup script
 *
 * Drag the uwu-canvas folder into your Next.js app, then run:
 *   node src/app/uwu-canvas/setup.mjs
 *
 * This script will:
 *   1. Install missing npm dependencies (won't override existing versions)
 *   2. Create the data directory for JSON storage
 *   3. Create .env.local from template (for your API keys)
 */

import { readFileSync, existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// ── Helpers ──────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  info: (msg) => console.log(`  ${msg}`),
  success: (msg) => console.log(`  ${COLORS.green}✓${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`  ${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`  ${COLORS.red}✗${COLORS.reset} ${msg}`),
  step: (msg) => console.log(`\n${COLORS.bold}${COLORS.cyan}→${COLORS.reset} ${COLORS.bold}${msg}${COLORS.reset}`),
};

// ── Step 1: Find project root ────────────────────────────────────────────────

function findProjectRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 15; i++) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break; // filesystem root
    dir = parent;
  }
  return null;
}

// ── Step 2: Detect package manager ───────────────────────────────────────────

function detectPackageManager(projectRoot) {
  if (existsSync(join(projectRoot, 'bun.lockb')) || existsSync(join(projectRoot, 'bun.lock'))) {
    return { name: 'bun', install: 'bun add' };
  }
  if (existsSync(join(projectRoot, 'pnpm-lock.yaml'))) {
    return { name: 'pnpm', install: 'pnpm add' };
  }
  if (existsSync(join(projectRoot, 'yarn.lock'))) {
    return { name: 'yarn', install: 'yarn add' };
  }
  return { name: 'npm', install: 'npm install' };
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log(`\n${COLORS.bold}${COLORS.magenta}  uwu-canvas${COLORS.reset} ${COLORS.dim}setup${COLORS.reset}\n`);

  // ── Find project root ──────────────────────────────────────────────────────
  log.step('Finding project root');
  const projectRoot = findProjectRoot(__dirname);
  if (!projectRoot) {
    log.error('Could not find package.json in any parent directory.');
    log.info('Make sure you placed uwu-canvas inside a Next.js project.');
    process.exit(1);
  }
  log.success(`Project root: ${projectRoot}`);

  // ── Detect package manager ─────────────────────────────────────────────────
  const pm = detectPackageManager(projectRoot);
  log.success(`Package manager: ${pm.name}`);

  // ── Read manifest ──────────────────────────────────────────────────────────
  log.step('Reading dependency manifest');
  const manifestPath = join(__dirname, 'uwu-canvas.setup.json');
  if (!existsSync(manifestPath)) {
    log.error('uwu-canvas.setup.json not found. Is the uwu-canvas folder intact?');
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  log.success(`${manifest.dependencies.length} dependencies listed`);

  // ── Check prerequisites ────────────────────────────────────────────────────
  log.step('Checking prerequisites');
  const hostPkgPath = join(projectRoot, 'package.json');
  const hostPkg = JSON.parse(readFileSync(hostPkgPath, 'utf-8'));
  const allHostDeps = {
    ...(hostPkg.dependencies || {}),
    ...(hostPkg.devDependencies || {}),
  };

  const prereqs = ['next', 'react', 'typescript'];
  for (const dep of prereqs) {
    if (allHostDeps[dep]) {
      log.success(`${dep} ${COLORS.dim}(${allHostDeps[dep]})${COLORS.reset}`);
    } else {
      log.warn(`${dep} not found in package.json (may be installed globally or in a monorepo)`);
    }
  }

  // Check for Tailwind (could be in dependencies or devDependencies)
  if (allHostDeps['tailwindcss'] || allHostDeps['@tailwindcss/postcss']) {
    log.success(`tailwindcss ${COLORS.dim}(${allHostDeps['tailwindcss'] || allHostDeps['@tailwindcss/postcss']})${COLORS.reset}`);
  } else {
    log.warn('tailwindcss not found in package.json');
  }

  // ── Diff & install dependencies ────────────────────────────────────────────
  log.step('Installing dependencies');
  const missing = manifest.dependencies.filter((dep) => !allHostDeps[dep]);
  const alreadyInstalled = manifest.dependencies.length - missing.length;

  if (alreadyInstalled > 0) {
    log.success(`${alreadyInstalled} already installed — skipped`);
  }

  if (missing.length > 0) {
    log.info(`Installing ${missing.length} missing packages...`);
    log.info(`${COLORS.dim}${missing.join(', ')}${COLORS.reset}`);

    const installCmd = `${pm.install} ${missing.join(' ')}`;
    try {
      execSync(installCmd, {
        cwd: projectRoot,
        stdio: 'inherit',
      });
      log.success(`${missing.length} packages installed`);
    } catch (err) {
      log.error('Package installation failed.');
      log.info(`Try running manually: ${COLORS.bold}${installCmd}${COLORS.reset}`);
      process.exit(1);
    }
  } else {
    log.success('All dependencies already installed');
  }

  // ── Create data directory ──────────────────────────────────────────────────
  log.step('Setting up data directory');
  const dataDir = join(projectRoot, 'data', 'uwu-canvas');
  if (existsSync(dataDir)) {
    log.success(`data/uwu-canvas/ ${COLORS.dim}(already exists)${COLORS.reset}`);
  } else {
    mkdirSync(dataDir, { recursive: true });
    log.success('data/uwu-canvas/ created');
  }

  // ── Handle .env.local (at project root — Next.js auto-loads it) ─────────
  log.step('Setting up environment');
  const envLocalPath = join(projectRoot, '.env.local');
  const envExamplePath = join(__dirname, '.env.example');

  if (existsSync(envLocalPath)) {
    // Check if the existing .env.local already has uwu-canvas keys
    const envContent = readFileSync(envLocalPath, 'utf-8');
    const hasAnyKey = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY']
      .some((key) => envContent.includes(key));

    if (hasAnyKey) {
      log.success(`.env.local ${COLORS.dim}(already has API key entries)${COLORS.reset}`);
      log.info('Make sure at least one AI API key is uncommented and set.');
    } else {
      // Append uwu-canvas keys to existing .env.local
      const envExample = existsSync(envExamplePath)
        ? readFileSync(envExamplePath, 'utf-8')
        : [
            '',
            '# uwu-canvas — AI Provider API Keys',
            '# At least ONE key is required for AI features.',
            '# OPENAI_API_KEY=sk-...',
            '# ANTHROPIC_API_KEY=sk-ant-...',
            '# GOOGLE_GENERATIVE_AI_API_KEY=...',
          ].join('\n');

      writeFileSync(envLocalPath, envContent.trimEnd() + '\n\n' + envExample);
      log.success('.env.local updated — uwu-canvas keys appended');
      log.warn('Add at least one AI API key to .env.local');
    }
  } else if (existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envLocalPath);
    log.success('.env.local created from uwu-canvas template');
    log.warn('Add at least one AI API key to .env.local');
  } else {
    // Fallback: create a minimal .env.local
    writeFileSync(envLocalPath, [
      '# uwu-canvas — AI Provider API Keys',
      '# At least ONE key is required for AI features.',
      '',
      '# OPENAI_API_KEY=sk-...',
      '# ANTHROPIC_API_KEY=sk-ant-...',
      '# GOOGLE_GENERATIVE_AI_API_KEY=...',
      '',
    ].join('\n'));
    log.success('.env.local created (minimal template)');
    log.warn('Add at least one AI API key to .env.local');
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${COLORS.bold}${COLORS.green}  ✓ uwu-canvas setup complete!${COLORS.reset}\n`);
  log.info(`Installed: ${COLORS.bold}${missing.length}${COLORS.reset} packages | Skipped: ${COLORS.bold}${alreadyInstalled}${COLORS.reset} (already installed)`);
  log.info(`Data dir:  ${COLORS.dim}data/uwu-canvas/${COLORS.reset}`);
  log.info(`Env file:  ${COLORS.dim}.env.local${COLORS.reset}`);
  console.log(`\n  ${COLORS.bold}Next steps:${COLORS.reset}`);
  console.log(`  ${COLORS.cyan}1.${COLORS.reset} Add at least one AI API key to ${COLORS.bold}.env.local${COLORS.reset}`);
  console.log(`  ${COLORS.cyan}2.${COLORS.reset} ${COLORS.bold}${pm.name === 'npm' ? 'npm run dev' : pm.name + ' dev'}${COLORS.reset}`);
  console.log(`  ${COLORS.cyan}3.${COLORS.reset} Visit ${COLORS.bold}${COLORS.cyan}http://localhost:3000/uwu-canvas${COLORS.reset}`);
  console.log('');
}

main();
