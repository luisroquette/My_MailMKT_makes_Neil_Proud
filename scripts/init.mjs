#!/usr/bin/env node

import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const source = path.join(root, "templates");
const requested = process.argv[2];

if (!requested) {
  console.error("Usage: node scripts/init.mjs campaigns/<campaign-name>");
  process.exit(1);
}

const destination = path.resolve(process.cwd(), requested);

try {
  await stat(destination);
  console.error(`Refusing to overwrite existing path: ${destination}`);
  process.exit(2);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

await mkdir(path.dirname(destination), { recursive: true });
await cp(source, destination, { recursive: true, errorOnExist: true });

console.log(`Campaign workspace created: ${destination}`);
console.log("Next: complete intake.md, fact-pack.json, compliance-rules.json and sequence.json.");
