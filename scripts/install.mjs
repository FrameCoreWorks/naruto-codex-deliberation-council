#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const profileNames = [
  "naruto_uzumaki.toml",
  "sasuke_uchiha.toml",
  "shikamaru_nara.toml",
  "sakura_haruno.toml",
  "kakashi_hatake.toml",
];

function usage(exitCode = 0) {
  console.log(`Usage:
  node scripts/install.mjs --scope project --target /absolute/project/path [--dry-run] [--force]
  node scripts/install.mjs --scope user [--dry-run] [--force]

Options:
  --dry-run  Report planned copies without writing.
  --force    Overwrite destination files whose content differs.
  --help     Show this help.`);
  process.exit(exitCode);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) usage(0);

function argumentValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const scope = argumentValue("--scope");
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

if (!new Set(["project", "user"]).has(scope)) {
  console.error("--scope must be project or user.");
  usage(2);
}

let skillDestination;
let profileDestination;
let targetRoot;

if (scope === "project") {
  const target = argumentValue("--target");
  if (!target) {
    console.error("--target is required for project scope.");
    usage(2);
  }
  targetRoot = resolve(target);
  if (!existsSync(targetRoot) || !lstatSync(targetRoot).isDirectory()) {
    console.error(`Project target does not exist or is not a directory: ${targetRoot}`);
    process.exit(2);
  }
  skillDestination = join(targetRoot, ".agents/skills/naruto");
  profileDestination = join(targetRoot, ".codex/agents");
} else {
  targetRoot = homedir();
  const codexHome = resolve(process.env.CODEX_HOME || join(targetRoot, ".codex"));
  skillDestination = join(targetRoot, ".agents/skills/naruto");
  profileDestination = join(codexHome, "agents");
}

function listFiles(directory, base = "") {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".DS_Store" || entry.name.startsWith("._")) continue;
    const fullPath = join(directory, entry.name);
    const relativePath = base ? join(base, entry.name) : entry.name;
    if (entry.isDirectory()) files.push(...listFiles(fullPath, relativePath));
    if (entry.isFile()) files.push(relativePath);
  }
  return files.sort();
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function hasSymlinkInExistingPath(path, stopAt) {
  let current = resolve(path);
  const boundary = resolve(stopAt);
  while (current.startsWith(boundary)) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) return current;
    if (current === boundary) break;
    current = dirname(current);
  }
  return null;
}

const plan = [];
const sourceSkill = join(repoRoot, ".agents/skills/naruto");
for (const relativePath of listFiles(sourceSkill)) {
  plan.push({
    source: join(sourceSkill, relativePath),
    destination: join(skillDestination, relativePath),
  });
}
for (const profile of profileNames) {
  plan.push({
    source: join(repoRoot, ".codex/agents", profile),
    destination: join(profileDestination, profile),
  });
}

const actions = [];
const conflicts = [];
for (const item of plan) {
  const symlink = hasSymlinkInExistingPath(item.destination, targetRoot);
  if (symlink) {
    conflicts.push({ path: item.destination, reason: `symlink in destination path: ${symlink}` });
    continue;
  }
  if (!existsSync(item.destination)) {
    actions.push({ ...item, action: "create" });
    continue;
  }
  if (sha256(item.source) === sha256(item.destination)) {
    actions.push({ ...item, action: "unchanged" });
    continue;
  }
  if (force) actions.push({ ...item, action: "overwrite" });
  else conflicts.push({ path: item.destination, reason: "different content; use --force after review" });
}

if (conflicts.length > 0) {
  console.log(
    JSON.stringify(
      {
        status: "blocked",
        scope,
        dry_run: dryRun,
        conflicts,
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

if (!dryRun) {
  for (const item of actions) {
    if (item.action === "unchanged") continue;
    mkdirSync(dirname(item.destination), { recursive: true });
    copyFileSync(item.source, item.destination);
  }
}

const counts = Object.fromEntries(
  ["create", "overwrite", "unchanged"].map((action) => [
    action,
    actions.filter((item) => item.action === action).length,
  ]),
);
console.log(
  JSON.stringify(
    {
      status: dryRun ? "dry-run" : "installed",
      scope,
      target_root: targetRoot,
      skill_destination: skillDestination,
      profile_destination: profileDestination,
      counts,
      validation_command: `node ${join(skillDestination, "scripts/validate-naruto.mjs")}`,
      next_step: "Start a new Codex task; restart Codex if the skill or profiles do not appear.",
    },
    null,
    2,
  ),
);
