#!/usr/bin/env node
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
const databaseURL = (process.env.NST_FIREBASE_DATABASE_URL || '').replace(/\/+$/, '');
const apiKey = process.env.NST_FIREBASE_API_KEY || '';

if (!/^https:\/\/[^/]+$/.test(databaseURL) || !apiKey) {
  throw new Error('Set NST_FIREBASE_DATABASE_URL and NST_FIREBASE_API_KEY in the build environment.');
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const excluded = new Set(['.git', '.vercel', 'dist', 'node_modules', 'tools', 'nst-portfolio-production.zip']);
for (const name of readdirSync(root)) {
  if (excluded.has(name) || name.startsWith('.env')) continue;
  cpSync(join(root, name), join(out, name), { recursive: true });
}

writeFileSync(
  join(out, 'js', 'firebase-config.js'),
  `window.NST_FIREBASE_CONFIG = ${JSON.stringify({ databaseURL, apiKey })};\n`
);
