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
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const packageManifestPath = join(repoRoot, "manifest/package-manifest.json");
const checksumPath = join(repoRoot, "SHA256SUMS");
const allowedProfileNames = Object.freeze([
  "naruto_clone_integrator.toml",
  "naruto_clone_challenger.toml",
  "naruto_clone_strategist.toml",
  "naruto_clone_verifier.toml",
  "kakashi_hatake.toml",
  "yamato.toml",
]);
const legacyProfileNames = Object.freeze([
  "naruto_uzumaki.toml",
  "sasuke_uchiha.toml",
  "shikamaru_nara.toml",
  "sakura_haruno.toml",
]);
const legacyAgentCardNames = Object.freeze([
  "naruto-uzumaki.yaml",
  "sasuke-uchiha.yaml",
  "shikamaru-nara.yaml",
  "sakura-haruno.yaml",
]);
const expectedLegacyManifestPaths = Object.freeze([
  ...legacyProfileNames.map((name) => `.codex/agents/${name}`),
  ...legacyAgentCardNames.map((name) => `.agents/skills/naruto/agents/${name}`),
]);

function toPackagePath(path) {
  return relative(repoRoot, path).split(sep).join("/");
}

function isPathWithin(boundary, candidate) {
  const rel = relative(resolve(boundary), resolve(candidate));
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function loadChecksums() {
  if (!existsSync(checksumPath)) {
    console.error("SHA256SUMS is missing. Refusing a partial or unverified install.");
    process.exit(2);
  }
  const expected = new Map();
  for (const line of readFileSync(checksumPath, "utf8").split(/\r?\n/).filter(Boolean)) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match || expected.has(match[2])) {
      console.error(`Invalid SHA256SUMS entry: ${line}`);
      process.exit(2);
    }
    expected.set(match[2], match[1]);
  }
  return expected;
}

const expectedChecksums = loadChecksums();
const manifestPackagePath = toPackagePath(packageManifestPath);
const manifestIntegrityErrors = [];
let packageManifestBytes;
if (!isPathWithin(repoRoot, packageManifestPath)) {
  manifestIntegrityErrors.push(`manifest path escapes package root: ${packageManifestPath}`);
} else if (!existsSync(packageManifestPath)) {
  manifestIntegrityErrors.push(`missing manifest: ${manifestPackagePath}`);
} else if (lstatSync(packageManifestPath).isSymbolicLink()) {
  manifestIntegrityErrors.push(`symlink manifest: ${manifestPackagePath}`);
} else if (!lstatSync(packageManifestPath).isFile()) {
  manifestIntegrityErrors.push(`missing or non-file manifest: ${manifestPackagePath}`);
} else if (!expectedChecksums.has(manifestPackagePath)) {
  manifestIntegrityErrors.push(`missing checksum entry: ${manifestPackagePath}`);
} else {
  packageManifestBytes = readFileSync(packageManifestPath);
  const actualManifestHash = createHash("sha256").update(packageManifestBytes).digest("hex");
  if (expectedChecksums.get(manifestPackagePath) !== actualManifestHash) {
    manifestIntegrityErrors.push(`checksum mismatch: ${manifestPackagePath}`);
  }
}
if (manifestIntegrityErrors.length > 0) {
  console.log(
    JSON.stringify(
      {
        status: "blocked",
        reason: "manifest_integrity_failed",
        errors: manifestIntegrityErrors,
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

function parseJson(contents, label) {
  try {
    return JSON.parse(contents.toString("utf8"));
  } catch (error) {
    console.error(`${label} is invalid: ${error.message}`);
    process.exit(2);
  }
}

const packageManifest = parseJson(packageManifestBytes, "Package manifest");
const profileNames = packageManifest.required_profiles;
const profileContractErrors = [];
if (!Array.isArray(profileNames)) {
  profileContractErrors.push("required_profiles must be an array");
} else {
  if (profileNames.length !== allowedProfileNames.length) {
    profileContractErrors.push(`required_profiles must contain exactly ${allowedProfileNames.length} entries`);
  }
  const seen = new Set();
  const allowed = new Set(allowedProfileNames);
  for (const profile of profileNames) {
    if (typeof profile !== "string") {
      profileContractErrors.push("every required profile must be a string basename");
      continue;
    }
    if (
      profile.length === 0 ||
      profile !== basename(profile) ||
      profile.includes("/") ||
      profile.includes("\\") ||
      isAbsolute(profile)
    ) {
      profileContractErrors.push(`profile must be a basename without path traversal: ${profile}`);
    }
    if (seen.has(profile)) profileContractErrors.push(`duplicate required profile: ${profile}`);
    seen.add(profile);
    if (!allowed.has(profile)) profileContractErrors.push(`profile is not in the exact allowlist: ${profile}`);
  }
  for (const requiredProfile of allowedProfileNames) {
    if (!seen.has(requiredProfile)) profileContractErrors.push(`missing required profile: ${requiredProfile}`);
  }
}
if (packageManifest.bundled_profile_count !== allowedProfileNames.length) {
  profileContractErrors.push(`bundled_profile_count must be ${allowedProfileNames.length}`);
}
if (packageManifest.parent_role_profile_bundled !== false) {
  profileContractErrors.push("parent_role_profile_bundled must be false");
}
if (
  packageManifest.migration?.legacy_0_3_installation_policy !== "fail_closed_manual_cleanup" ||
  packageManifest.migration?.force_bypass_allowed !== false ||
  JSON.stringify(packageManifest.migration?.legacy_profile_paths) !==
    JSON.stringify(expectedLegacyManifestPaths)
) {
  profileContractErrors.push("legacy 0.3 migration contract must match the exact fail-closed allowlist");
}
if (profileContractErrors.length > 0) {
  console.log(
    JSON.stringify(
      {
        status: "blocked",
        reason: "invalid_profile_bundle_contract",
        errors: profileContractErrors,
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

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
let skillBoundary;
let profileBoundary;

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
  skillBoundary = targetRoot;
  profileBoundary = targetRoot;
} else {
  targetRoot = homedir();
  const codexHome = resolve(process.env.CODEX_HOME || join(targetRoot, ".codex"));
  skillDestination = join(targetRoot, ".agents/skills/naruto");
  profileDestination = join(codexHome, "agents");
  skillBoundary = targetRoot;
  profileBoundary = codexHome;
}

function listFiles(directory, base = "") {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".DS_Store" || entry.name.startsWith("._")) continue;
    if (entry.isSymbolicLink()) {
      throw new Error(`Symlink is not allowed in package sources: ${join(directory, entry.name)}`);
    }
    const fullPath = join(directory, entry.name);
    const relativePath = base ? join(base, entry.name) : entry.name;
    if (entry.isDirectory()) files.push(...listFiles(fullPath, relativePath));
    if (entry.isFile()) files.push(relativePath);
  }
  return files.sort();
}

function hasSymlinkInExistingPath(path, stopAt) {
  let current = resolve(path);
  const boundary = resolve(stopAt);
  const rel = relative(boundary, current);
  if (rel === ".." || rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    return `path escapes destination boundary: ${boundary}`;
  }
  while (true) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) return current;
    if (current === boundary) break;
    current = dirname(current);
  }
  return null;
}

function lstatEntry(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") return null;
    throw error;
  }
}

const legacyDestinations = [
  ...legacyProfileNames.map((name) => ({
    path: join(profileDestination, name),
    boundary: profileBoundary,
  })),
  ...legacyAgentCardNames.map((name) => ({
    path: join(skillDestination, "agents", name),
    boundary: skillBoundary,
  })),
];
const detectedLegacyPaths = [];
for (const legacy of legacyDestinations) {
  const entry = lstatEntry(legacy.path);
  if (!entry) continue;
  const symlink = hasSymlinkInExistingPath(legacy.path, legacy.boundary);
  detectedLegacyPaths.push({
    path: legacy.path,
    reason: symlink ? `symlink in legacy path: ${symlink}` : "legacy 0.3 file exists",
  });
}
if (detectedLegacyPaths.length > 0) {
  console.log(
    JSON.stringify(
      {
        status: "blocked",
        reason: "legacy_0_3_installation_detected",
        scope,
        dry_run: dryRun,
        force_bypass_allowed: false,
        legacy_paths: detectedLegacyPaths,
        next_step: "Review and manually remove only the listed legacy 0.3 files, then rerun the installer.",
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

const plan = [];
const sourceSkill = join(repoRoot, ".agents/skills/naruto");
const sourceProfiles = join(repoRoot, ".codex/agents");
const sourceRootErrors = [];
for (const sourceRoot of [sourceSkill, sourceProfiles]) {
  if (!isPathWithin(repoRoot, sourceRoot)) {
    sourceRootErrors.push(`source root escapes package root: ${sourceRoot}`);
    continue;
  }
  if (!existsSync(sourceRoot) || !lstatSync(sourceRoot).isDirectory()) {
    sourceRootErrors.push(`missing or non-directory source root: ${sourceRoot}`);
    continue;
  }
  const symlink = hasSymlinkInExistingPath(sourceRoot, repoRoot);
  if (symlink) sourceRootErrors.push(`symlink in source root path: ${symlink}`);
}
if (sourceRootErrors.length > 0) {
  console.log(
    JSON.stringify(
      {
        status: "blocked",
        reason: "source_root_preflight_failed",
        errors: sourceRootErrors,
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

function addPlanItem(sourceBase, destinationBase, relativePath, boundary) {
  const source = resolve(sourceBase, relativePath);
  const destination = resolve(destinationBase, relativePath);
  if (!isPathWithin(sourceBase, source)) {
    console.error(`Package source escapes its allowed root: ${source}`);
    process.exit(2);
  }
  if (!isPathWithin(destinationBase, destination) || !isPathWithin(boundary, destination)) {
    console.error(`Install destination escapes its allowed root: ${destination}`);
    process.exit(2);
  }
  plan.push({ source, destination, boundary });
}

for (const relativePath of listFiles(sourceSkill)) {
  addPlanItem(sourceSkill, skillDestination, relativePath, skillBoundary);
}
for (const profile of profileNames) {
  addPlanItem(sourceProfiles, profileDestination, profile, profileBoundary);
}
const sourceErrors = [];
for (const item of plan) {
  if (!existsSync(item.source) || !lstatSync(item.source).isFile()) {
    sourceErrors.push(`missing or non-file source: ${item.source}`);
    continue;
  }
  if (lstatSync(item.source).isSymbolicLink()) {
    sourceErrors.push(`symlink source: ${item.source}`);
    continue;
  }
  const packagePath = toPackagePath(item.source);
  if (!expectedChecksums.has(packagePath)) {
    sourceErrors.push(`missing checksum entry: ${packagePath}`);
  } else if (expectedChecksums.get(packagePath) !== sha256(item.source)) {
    sourceErrors.push(`checksum mismatch: ${packagePath}`);
  }
}
if (sourceErrors.length > 0) {
  console.log(JSON.stringify({ status: "blocked", reason: "source_preflight_failed", errors: sourceErrors }, null, 2));
  process.exit(2);
}

const actions = [];
const conflicts = [];
for (const item of plan) {
  const symlink = hasSymlinkInExistingPath(item.destination, item.boundary);
  if (symlink) {
    conflicts.push({ path: item.destination, reason: `symlink in destination path: ${symlink}` });
    continue;
  }
  if (!existsSync(item.destination)) {
    actions.push({ ...item, action: "create" });
    continue;
  }
  if (!lstatSync(item.destination).isFile()) {
    conflicts.push({ path: item.destination, reason: "destination exists and is not a regular file" });
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
  try {
    for (const item of actions) {
      if (item.action === "unchanged") continue;
      mkdirSync(dirname(item.destination), { recursive: true });
      copyFileSync(item.source, item.destination);
    }
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          status: "blocked",
          reason: "copy_failed",
          scope,
          error: error.message,
          next_step: "Review the target and rerun the installer after resolving the reported filesystem error.",
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  const destinationErrors = [];
  for (const item of actions) {
    const entry = lstatEntry(item.destination);
    if (!entry || !entry.isFile() || entry.isSymbolicLink()) {
      destinationErrors.push(`missing, non-file, or symlink destination: ${item.destination}`);
      continue;
    }
    if (sha256(item.destination) !== sha256(item.source)) {
      destinationErrors.push(`post-copy checksum mismatch: ${item.destination}`);
    }
  }
  if (destinationErrors.length > 0) {
    console.log(
      JSON.stringify(
        {
          status: "blocked",
          reason: "destination_verification_failed",
          scope,
          errors: destinationErrors,
        },
        null,
        2,
      ),
    );
    process.exit(2);
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
