#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const checksumPath = join(repoRoot, "SHA256SUMS");
const mode = process.argv[2];

if (!new Set(["--write", "--check"]).has(mode)) {
  console.error("Usage: node scripts/checksums.mjs --write|--check");
  process.exit(2);
}

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "__MACOSX",
  "Memory Cache",
  "Context",
]);
const ignoredFiles = new Set([".DS_Store", "SHA256SUMS"]);

function toPortablePath(path) {
  return path.split(sep).join("/");
}

function listFiles(directory, base = "") {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith("._")) continue;
    if (entry.isSymbolicLink()) {
      throw new Error(`Symlink is not allowed in the package: ${join(directory, entry.name)}`);
    }
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    if (entry.isFile() && ignoredFiles.has(entry.name)) continue;

    const fullPath = join(directory, entry.name);
    const relativePath = base ? join(base, entry.name) : entry.name;

    if (entry.isDirectory()) files.push(...listFiles(fullPath, relativePath));
    if (entry.isFile()) files.push(toPortablePath(relativePath));
  }
  return files.sort();
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function currentEntries() {
  return listFiles(repoRoot).map((path) => ({
    path,
    hash: sha256(join(repoRoot, ...path.split("/"))),
    size_bytes: statSync(join(repoRoot, ...path.split("/"))).size,
  }));
}

function serialize(entries) {
  return `${entries.map(({ hash, path }) => `${hash}  ${path}`).join("\n")}\n`;
}

if (mode === "--write") {
  const entries = currentEntries();
  writeFileSync(checksumPath, serialize(entries), "utf8");
  console.log(
    JSON.stringify(
      {
        status: "written",
        file: relative(repoRoot, checksumPath),
        files: entries.length,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!existsSync(checksumPath)) {
  console.error("SHA256SUMS is missing. Run npm run checksums.");
  process.exit(1);
}

const expectedLines = readFileSync(checksumPath, "utf8")
  .split(/\r?\n/)
  .filter(Boolean);
const errors = [];
const expected = new Map();

for (const line of expectedLines) {
  const match = line.match(/^([a-f0-9]{64})  (.+)$/);
  if (!match) {
    errors.push(`Malformed checksum line: ${line}`);
    continue;
  }
  if (expected.has(match[2])) errors.push(`Duplicate checksum path: ${match[2]}`);
  expected.set(match[2], match[1]);
}

const actual = currentEntries();
const actualPaths = new Set(actual.map(({ path }) => path));

for (const { path, hash } of actual) {
  if (!expected.has(path)) errors.push(`Missing checksum entry: ${path}`);
  else if (expected.get(path) !== hash) errors.push(`Checksum mismatch: ${path}`);
}

for (const path of expected.keys()) {
  if (!actualPaths.has(path)) errors.push(`Checksum references missing file: ${path}`);
}

console.log(
  JSON.stringify(
    {
      status: errors.length === 0 ? "pass" : "fail",
      files: actual.length,
      failed: errors.length,
      errors,
    },
    null,
    2,
  ),
);

if (errors.length > 0) process.exitCode = 1;
