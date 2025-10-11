import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Patch the Vercel runtime to use Node.js 20 instead of 18
const configPath = join(process.cwd(), '.vercel/output/functions/_render.func/.vc-config.json');

try {
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  config.runtime = 'nodejs20.x';
  writeFileSync(configPath, JSON.stringify(config, null, '\t'));
  console.log('✓ Patched Vercel runtime to Node.js 20');
} catch (error) {
  console.error('Failed to patch Vercel runtime:', error);
  process.exit(1);
}
