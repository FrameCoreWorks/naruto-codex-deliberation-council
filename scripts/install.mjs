#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fchmodSync,
  fstatSync,
  ftruncateSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
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

function failArguments(errors) {
  console.log(
    JSON.stringify(
      {
        status: "blocked",
        reason: "invalid_arguments",
        errors,
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

function parseArguments(argv) {
  if (argv.length === 0) usage(0);

  const definitions = new Map([
    ["--scope", "value"],
    ["--target", "value"],
    ["--dry-run", "flag"],
    ["--force", "flag"],
    ["--help", "flag"],
  ]);
  const values = new Map();
  const flags = new Set();
  const seen = new Set();
  const errors = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const kind = definitions.get(argument);
    if (!kind) {
      errors.push(`unknown argument: ${argument}`);
      continue;
    }
    if (seen.has(argument)) errors.push(`duplicate argument: ${argument}`);
    seen.add(argument);

    if (kind === "flag") {
      flags.add(argument);
      continue;
    }

    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      errors.push(`missing value for ${argument}`);
      continue;
    }
    if (!values.has(argument)) values.set(argument, value);
    index += 1;
  }

  if (flags.has("--help")) {
    if (argv.length === 1 && errors.length === 0) usage(0);
    errors.push("--help cannot be combined with other arguments");
  }

  const scope = values.get("--scope");
  const target = values.get("--target");
  if (!new Set(["project", "user"]).has(scope)) {
    errors.push("--scope must be project or user");
  } else if (scope === "project") {
    if (!target) errors.push("--target is required for project scope");
    else if (!isAbsolute(target)) errors.push("--target must be an absolute path for project scope");
  } else if (target !== undefined) {
    errors.push("--target is not allowed for user scope");
  }

  if (errors.length > 0) failArguments(errors);
  return {
    scope,
    target,
    dryRun: flags.has("--dry-run"),
    force: flags.has("--force"),
  };
}

const parsedArguments = parseArguments(process.argv.slice(2));
const { scope, dryRun, force } = parsedArguments;

function toPackagePath(path) {
  return relative(repoRoot, path).split(sep).join("/");
}

function isPathWithin(boundary, candidate) {
  const rel = relative(resolve(boundary), resolve(candidate));
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function loadChecksums() {
  let checksumBytes;
  try {
    checksumBytes = snapshotRegularFile(checksumPath, {
      boundary: repoRoot,
      label: "SHA256SUMS",
    }).bytes;
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          status: "blocked",
          reason: "checksum_file_preflight_failed",
          errors: [error.message],
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }
  const expected = new Map();
  const checksumErrors = [];
  for (const line of checksumBytes.toString("utf8").split(/\r?\n/).filter(Boolean)) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match || expected.has(match[2])) {
      checksumErrors.push(`Invalid SHA256SUMS entry: ${line}`);
      continue;
    }
    expected.set(match[2], match[1]);
  }
  if (checksumErrors.length > 0) {
    console.log(
      JSON.stringify(
        {
          status: "blocked",
          reason: "invalid_checksum_manifest",
          errors: checksumErrors,
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }
  return expected;
}

const expectedChecksums = loadChecksums();
const manifestPackagePath = toPackagePath(packageManifestPath);
const manifestIntegrityErrors = [];
let packageManifestBytes;
if (!isPathWithin(repoRoot, packageManifestPath)) {
  manifestIntegrityErrors.push(`manifest path escapes package root: ${packageManifestPath}`);
} else if (!expectedChecksums.has(manifestPackagePath)) {
  manifestIntegrityErrors.push(`missing checksum entry: ${manifestPackagePath}`);
} else {
  try {
    packageManifestBytes = snapshotRegularFile(packageManifestPath, {
      boundary: repoRoot,
      expectedDigest: expectedChecksums.get(manifestPackagePath),
      label: manifestPackagePath,
    }).bytes;
  } catch (error) {
    manifestIntegrityErrors.push(error.message);
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

let skillDestination;
let profileDestination;
let targetRoot;
let skillBoundary;
let profileBoundary;

if (scope === "project") {
  const target = parsedArguments.target;
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
    const entry = lstatEntry(current);
    if (entry?.isSymbolicLink()) return current;
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

function readOnlyFileFlags() {
  const noFollow =
    process.platform !== "win32" && typeof constants.O_NOFOLLOW === "number"
      ? constants.O_NOFOLLOW
      : 0;
  const nonBlocking =
    process.platform !== "win32" && typeof constants.O_NONBLOCK === "number"
      ? constants.O_NONBLOCK
      : 0;
  return constants.O_RDONLY | noFollow | nonBlocking;
}

function sameFileIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function snapshotRegularFile(path, { boundary, expectedDigest, label }) {
  if (boundary) {
    const symlink = hasSymlinkInExistingPath(path, boundary);
    if (symlink) throw new Error(`symlink in ${label} path: ${symlink}`);
  }

  const pathEntry = lstatEntry(path);
  if (!pathEntry || pathEntry.isSymbolicLink() || !pathEntry.isFile()) {
    throw new Error(`missing, non-file, or symlink ${label}: ${path}`);
  }
  if (pathEntry.nlink !== 1) {
    throw new Error(`hard-linked ${label}: ${path}`);
  }

  let descriptor;
  try {
    descriptor = openSync(path, readOnlyFileFlags());
    const openedBeforeRead = fstatSync(descriptor);
    if (!openedBeforeRead.isFile()) throw new Error(`opened ${label} is not a regular file: ${path}`);
    if (openedBeforeRead.nlink !== 1) throw new Error(`opened ${label} is hard-linked: ${path}`);
    if (!sameFileIdentity(pathEntry, openedBeforeRead)) {
      throw new Error(`${label} changed between lstat and open: ${path}`);
    }

    const bytes = readFileSync(descriptor);
    const openedAfterRead = fstatSync(descriptor);
    if (
      !sameFileIdentity(openedBeforeRead, openedAfterRead) ||
      openedBeforeRead.size !== openedAfterRead.size ||
      openedBeforeRead.mode !== openedAfterRead.mode ||
      openedAfterRead.nlink !== 1
    ) {
      throw new Error(`${label} changed while being snapshotted: ${path}`);
    }
    const digest = sha256Bytes(bytes);
    if (expectedDigest && digest !== expectedDigest) {
      throw new Error(`checksum mismatch: ${label}`);
    }
    return {
      bytes,
      digest,
      mode: openedAfterRead.mode & 0o777,
      size: openedAfterRead.size,
    };
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
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

const sourceInventoryErrors = [];
let sourceSkillFiles = [];
let sourceProfileFiles = [];
try {
  sourceSkillFiles = listFiles(sourceSkill).map((path) => path.split(sep).join("/"));
  sourceProfileFiles = listFiles(sourceProfiles).map((path) => path.split(sep).join("/"));
} catch (error) {
  sourceInventoryErrors.push(error.message);
}

function compareExactInventory(label, actualPaths, expectedPaths) {
  const actual = new Set(actualPaths);
  const expected = new Set(expectedPaths);
  for (const path of expected) {
    if (!actual.has(path)) sourceInventoryErrors.push(`missing ${label} file: ${path}`);
  }
  for (const path of actual) {
    if (!expected.has(path)) sourceInventoryErrors.push(`unexpected ${label} file: ${path}`);
  }
}

const skillChecksumPrefix = ".agents/skills/naruto/";
const profileChecksumPrefix = ".codex/agents/";
const checksumSkillFiles = [...expectedChecksums.keys()]
  .filter((path) => path.startsWith(skillChecksumPrefix))
  .map((path) => path.slice(skillChecksumPrefix.length))
  .sort();
const checksumProfileFiles = [...expectedChecksums.keys()]
  .filter((path) => path.startsWith(profileChecksumPrefix))
  .map((path) => path.slice(profileChecksumPrefix.length))
  .sort();
const manifestProfileFiles = [...profileNames].sort();

compareExactInventory("skill source", sourceSkillFiles, checksumSkillFiles);
compareExactInventory("profile source", sourceProfileFiles, manifestProfileFiles);
compareExactInventory("profile checksum", checksumProfileFiles, manifestProfileFiles);

if (sourceInventoryErrors.length > 0) {
  console.log(
    JSON.stringify(
      {
        status: "blocked",
        reason: "source_inventory_failed",
        errors: sourceInventoryErrors,
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

for (const relativePath of sourceSkillFiles) {
  addPlanItem(sourceSkill, skillDestination, relativePath, skillBoundary);
}
for (const profile of profileNames) {
  addPlanItem(sourceProfiles, profileDestination, profile, profileBoundary);
}
const sourceErrors = [];
for (const item of plan) {
  const packagePath = toPackagePath(item.source);
  item.packagePath = packagePath;
  if (!expectedChecksums.has(packagePath)) {
    sourceErrors.push(`missing checksum entry: ${packagePath}`);
    continue;
  }
  try {
    item.sourceSnapshot = snapshotRegularFile(item.source, {
      boundary: repoRoot,
      expectedDigest: expectedChecksums.get(packagePath),
      label: packagePath,
    });
  } catch (error) {
    sourceErrors.push(error.message);
  }
}
if (sourceErrors.length > 0) {
  console.log(JSON.stringify({ status: "blocked", reason: "source_preflight_failed", errors: sourceErrors }, null, 2));
  process.exit(2);
}

const actions = [];
const conflicts = [];

function inspectDestinationSkillInventory(root) {
  const files = [];
  const errors = [];
  const rootEntry = lstatEntry(root);
  if (!rootEntry) return { files, errors };
  if (rootEntry.isSymbolicLink()) {
    return { files, errors: [{ path: root, reason: "package-owned skill root is a symlink" }] };
  }
  if (!rootEntry.isDirectory()) {
    return { files, errors: [{ path: root, reason: "package-owned skill root is not a directory" }] };
  }

  function walk(directory, base = "") {
    for (const directoryEntry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = join(directory, directoryEntry.name);
      const relativePath = base ? join(base, directoryEntry.name) : directoryEntry.name;
      const entry = lstatEntry(fullPath);
      if (!entry) {
        errors.push({ path: fullPath, reason: "destination entry changed during inventory" });
      } else if (entry.isSymbolicLink()) {
        errors.push({ path: fullPath, reason: "symlink in package-owned skill root" });
      } else if (entry.isDirectory()) {
        walk(fullPath, relativePath);
      } else if (entry.isFile()) {
        if (entry.nlink !== 1) {
          errors.push({ path: fullPath, reason: "hard-linked file in package-owned skill root" });
        } else {
          files.push(relativePath.split(sep).join("/"));
        }
      } else {
        errors.push({ path: fullPath, reason: "non-regular entry in package-owned skill root" });
      }
    }
  }

  walk(root);
  return { files: files.sort(), errors };
}

let destinationSkillInventory;
try {
  destinationSkillInventory = inspectDestinationSkillInventory(skillDestination);
} catch (error) {
  destinationSkillInventory = {
    files: [],
    errors: [{ path: skillDestination, reason: `destination inventory failed: ${error.message}` }],
  };
}
conflicts.push(...destinationSkillInventory.errors);
const expectedDestinationSkillFiles = new Set(sourceSkillFiles);
for (const relativePath of destinationSkillInventory.files) {
  if (!expectedDestinationSkillFiles.has(relativePath)) {
    conflicts.push({
      path: join(skillDestination, ...relativePath.split("/")),
      reason: "unexpected file in package-owned skill root; remove it manually after review",
    });
  }
}

for (const item of plan) {
  const symlink = hasSymlinkInExistingPath(item.destination, item.boundary);
  if (symlink) {
    conflicts.push({ path: item.destination, reason: `symlink in destination path: ${symlink}` });
    continue;
  }
  const destinationEntry = lstatEntry(item.destination);
  if (!destinationEntry) {
    actions.push({ ...item, action: "create" });
    continue;
  }
  if (destinationEntry.isSymbolicLink() || !destinationEntry.isFile()) {
    conflicts.push({ path: item.destination, reason: "destination exists and is not a regular file" });
    continue;
  }
  if (destinationEntry.nlink !== 1) {
    conflicts.push({ path: item.destination, reason: "destination is a hard-linked file" });
    continue;
  }

  let destinationSnapshot;
  try {
    destinationSnapshot = snapshotRegularFile(item.destination, {
      boundary: item.boundary,
      label: `destination ${item.destination}`,
    });
  } catch (error) {
    conflicts.push({ path: item.destination, reason: error.message });
    continue;
  }
  const modeMatches =
    process.platform === "win32" || destinationSnapshot.mode === item.sourceSnapshot.mode;
  if (destinationSnapshot.digest === item.sourceSnapshot.digest && modeMatches) {
    actions.push({ ...item, action: "unchanged" });
    continue;
  }
  if (force) actions.push({ ...item, action: "overwrite" });
  else {
    conflicts.push({
      path: item.destination,
      reason: `different ${modeMatches ? "content" : "content or mode"}; use --force after review`,
    });
  }
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

function writePlanItem(item) {
  // Node has no portable openat-style API, so ancestor resolution cannot be made atomic here.
  // Recheck ancestors around mkdir/open and keep the final leaf no-follow/exclusive instead.
  const destinationDirectory = dirname(item.destination);
  const preMkdirSymlink = hasSymlinkInExistingPath(destinationDirectory, item.boundary);
  if (preMkdirSymlink) {
    throw new Error(`symlink appeared before destination write: ${preMkdirSymlink}`);
  }
  mkdirSync(destinationDirectory, { recursive: true });
  const preWriteSymlink = hasSymlinkInExistingPath(item.destination, item.boundary);
  if (preWriteSymlink) {
    throw new Error(`symlink appeared before destination write: ${preWriteSymlink}`);
  }

  const destinationEntry = lstatEntry(item.destination);
  if (item.action === "create" && destinationEntry) {
    throw new Error(`create destination appeared after preflight: ${item.destination}`);
  }
  if (
    item.action === "overwrite" &&
    (
      !destinationEntry ||
      destinationEntry.isSymbolicLink() ||
      !destinationEntry.isFile() ||
      destinationEntry.nlink !== 1
    )
  ) {
    throw new Error(`overwrite destination changed after preflight: ${item.destination}`);
  }

  const noFollow =
    process.platform !== "win32" && typeof constants.O_NOFOLLOW === "number"
      ? constants.O_NOFOLLOW
      : 0;
  const nonBlocking =
    process.platform !== "win32" && typeof constants.O_NONBLOCK === "number"
      ? constants.O_NONBLOCK
      : 0;
  const flags = item.action === "create"
    ? constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow | nonBlocking
    : constants.O_WRONLY | noFollow | nonBlocking;
  const sourceMode = item.sourceSnapshot.mode;
  let descriptor;
  try {
    descriptor = openSync(item.destination, flags, sourceMode);
    const openedDestination = fstatSync(descriptor);
    if (!openedDestination.isFile()) {
      throw new Error(`opened destination is not a regular file: ${item.destination}`);
    }
    if (openedDestination.nlink !== 1) {
      throw new Error(`opened destination is hard-linked: ${item.destination}`);
    }
    if (
      item.action === "overwrite" &&
      !sameFileIdentity(destinationEntry, openedDestination)
    ) {
      throw new Error(`overwrite destination changed between lstat and open: ${item.destination}`);
    }
    ftruncateSync(descriptor, 0);
    writeFileSync(descriptor, item.sourceSnapshot.bytes);
    if (process.platform !== "win32") fchmodSync(descriptor, sourceMode);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

let targetValidation = { status: "not_run", reason: "dry_run" };

function parseJsonObjectOutput(output) {
  const text = String(output ?? "").trim();
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function runTargetValidatorFromSnapshot() {
  const validatorSource = plan.find(
    (item) => item.packagePath === ".agents/skills/naruto/scripts/validate-naruto.mjs",
  );
  if (!validatorSource?.sourceSnapshot) {
    return { executionError: new Error("verified validator source snapshot is unavailable") };
  }

  let privateRoot;
  let validatorResult;
  let validatorReport;
  let executionError;
  let cleanupError;
  try {
    privateRoot = mkdtempSync(join(tmpdir(), "naruto-installer-validator-"));
    const privateValidator = join(privateRoot, "validate-naruto.mjs");
    const noFollow =
      process.platform !== "win32" && typeof constants.O_NOFOLLOW === "number"
        ? constants.O_NOFOLLOW
        : 0;
    let descriptor;
    try {
      descriptor = openSync(
        privateValidator,
        constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow,
        validatorSource.sourceSnapshot.mode,
      );
      const openedValidator = fstatSync(descriptor);
      if (!openedValidator.isFile() || openedValidator.nlink !== 1) {
        throw new Error("private validator snapshot is not a single-link regular file");
      }
      writeFileSync(descriptor, validatorSource.sourceSnapshot.bytes);
      if (process.platform !== "win32") {
        fchmodSync(descriptor, validatorSource.sourceSnapshot.mode);
      }
    } finally {
      if (descriptor !== undefined) closeSync(descriptor);
    }

    snapshotRegularFile(privateValidator, {
      boundary: privateRoot,
      expectedDigest: validatorSource.sourceSnapshot.digest,
      label: "private validator snapshot",
    });
    const validatorEnvironment = {
      ...process.env,
      NARUTO_INSTALL_VALIDATION_MODE: "1",
      NARUTO_INSTALL_VALIDATOR_SKILL_ROOT: skillDestination,
      NARUTO_INSTALL_VALIDATOR_PROFILE_ROOT: profileDestination,
      NARUTO_INSTALL_VALIDATOR_WORKSPACE_ROOT: targetRoot,
    };
    if (scope === "user") {
      validatorEnvironment.HOME = targetRoot;
      validatorEnvironment.USERPROFILE = targetRoot;
      validatorEnvironment.CODEX_HOME = profileBoundary;
    }
    validatorResult = spawnSync(process.execPath, [privateValidator], {
      cwd: targetRoot,
      env: validatorEnvironment,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    validatorReport = parseJsonObjectOutput(validatorResult.stdout);
  } catch (error) {
    executionError = error;
  } finally {
    if (privateRoot) {
      try {
        rmSync(privateRoot, { recursive: true, force: true });
      } catch (error) {
        cleanupError = error;
      }
    }
  }
  return { validatorResult, validatorReport, executionError, cleanupError };
}

if (!dryRun) {
  try {
    for (const item of actions) {
      if (item.action === "unchanged") continue;
      writePlanItem(item);
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
    try {
      const installedSnapshot = snapshotRegularFile(item.destination, {
        boundary: item.boundary,
        expectedDigest: item.sourceSnapshot.digest,
        label: `installed destination ${item.destination}`,
      });
      if (
        process.platform !== "win32" &&
        installedSnapshot.mode !== item.sourceSnapshot.mode
      ) {
        destinationErrors.push(`post-copy mode mismatch: ${item.destination}`);
      }
    } catch (error) {
      destinationErrors.push(error.message);
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

  const {
    validatorResult,
    validatorReport,
    executionError,
    cleanupError,
  } = runTargetValidatorFromSnapshot();
  if (
    executionError ||
    cleanupError ||
    validatorResult?.error ||
    validatorResult?.status !== 0 ||
    validatorReport?.status !== "pass"
  ) {
    console.log(
      JSON.stringify(
        {
          status: "blocked",
          reason: "target_validation_failed",
          scope,
          validator_source: "private_verified_snapshot",
          validator_exit_code: validatorResult?.status ?? null,
          validator_error: executionError?.message ?? validatorResult?.error?.message ?? null,
          validator_cleanup_error: cleanupError?.message ?? null,
          validator_report: validatorReport,
          validator_stderr: (validatorResult?.stderr ?? "").trim().slice(0, 4000),
          next_step: "Review the installed files and validator report before retrying. The installer does not roll back completed copies.",
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }
  targetValidation = {
    status: "pass",
    source: "private_verified_snapshot",
    total: validatorReport.total,
    passed: validatorReport.passed,
    failed: validatorReport.failed,
  };
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
      validation: targetValidation,
      next_step: "Start a new Codex task; restart Codex if the skill or profiles do not appear.",
    },
    null,
    2,
  ),
);
