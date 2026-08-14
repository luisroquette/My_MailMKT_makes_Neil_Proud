#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const html = await readFile(path.join(root, 'docs/index.html'), 'utf8');
const js = await readFile(path.join(root, 'docs/sota-validator.js'), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((asset) => !/^(?:https?:|#|mailto:)/.test(asset));

if ((html.match(/<h1\b/g) ?? []).length !== 1) throw new Error('Expected exactly one H1');
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs found');
if (!html.includes('BROWSER MODEL · NO EMAIL IS SENT')) throw new Error('Missing simulation boundary');
if (!html.includes('role="tablist"') || !html.includes('aria-live="polite"')) throw new Error('Missing interactive accessibility semantics');
if (!js.includes("renderValidation('validated')")) throw new Error('Safe default state is not explicit');
if ((js.match(/\['[^']+', (?:true|false), '(?:PASS|FAIL)'\]/g) ?? []).length !== 10) throw new Error('Expected five checks in each state');

await Promise.all(assets.map((asset) => access(path.join(root, 'docs', asset))));
console.log(`Product site validation passed: one H1, ${ids.length} unique IDs, safe default, five modeled checks, no missing assets`);
