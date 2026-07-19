#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const installerPath = join(repoRoot, "scripts/install.mjs");
const packageManifest = JSON.parse(
  readFileSync(join(repoRoot, "manifest/package-manifest.json"), "utf8"),
);
const historicalMigrationInventory = JSON.parse(
  readFileSync(join(scriptDir, "fixtures/install-0.4.0-inventory.json"), "utf8"),
);
const sourceSkillRoot = join(repoRoot, ".agents/skills/naruto");
const sourceProfileRoot = join(repoRoot, ".codex/agents");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function toPortablePath(path) {
  return path.split(sep).join("/");
}

function listFiles(directory, base = "") {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".DS_Store" || entry.name.startsWith("._")) continue;
    const fullPath = join(directory, entry.name);
    const relativePath = base ? join(base, entry.name) : entry.name;
    if (entry.isSymbolicLink()) {
      throw new Error(`Unexpected symlink while listing files: ${fullPath}`);
    }
    if (entry.isDirectory()) files.push(...listFiles(fullPath, relativePath));
    if (entry.isFile()) files.push(toPortablePath(relativePath));
  }
  return files.sort();
}

function snapshot(directory, base = "") {
  if (!existsSync(directory)) return {};
  const entries = {};
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    const relativePath = toPortablePath(base ? join(base, entry.name) : entry.name);
    const stat = lstatSync(fullPath);
    if (stat.isSymbolicLink()) {
      entries[relativePath] = "symlink";
    } else if (stat.isDirectory()) {
      entries[`${relativePath}/`] = "directory";
      Object.assign(entries, snapshot(fullPath, relativePath));
    } else if (stat.isFile()) {
      entries[relativePath] = `file:${sha256(fullPath)}`;
    } else {
      entries[relativePath] = "other";
    }
  }
  return Object.fromEntries(Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)));
}

function parseJsonOutput(stdout, label) {
  const output = (stdout ?? "").trim();
  try {
    const parsed = JSON.parse(output);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    // Report the complete malformed output below.
  }
  throw new Error(`${label} did not emit exactly one JSON object.\nstdout:\n${stdout ?? ""}`);
}

function runNode(script, args, cwd = repoRoot, env = process.env) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  return result;
}

function readResult(result, label, expectedExitCode) {
  let report;
  try {
    report = parseJsonOutput(result.stdout, label);
  } catch (error) {
    throw new Error(
      `${error.message}\nstderr:\n${result.stderr ?? ""}\nexit status: ${result.status}`,
    );
  }

  if ((result.stderr ?? "").trim() !== "") {
    throw new Error(`${label} emitted unexpected stderr:\n${result.stderr}`);
  }

  if (result.status !== expectedExitCode) {
    const integrityReason = new Set([
      "manifest_integrity_failed",
      "source_inventory_failed",
      "source_preflight_failed",
    ]).has(report.reason);
    const hint = integrityReason
      ? "\nThe installer correctly refused stale package checksums. Regenerate SHA256SUMS after all source edits, then rerun this suite."
      : "";
    throw new Error(
      `${label} exited with ${result.status}; expected ${expectedExitCode}.\n` +
        `${JSON.stringify(report, null, 2)}\n${result.stderr ?? ""}${hint}`,
    );
  }
  return report;
}

function runInstaller(target, extraArgs = [], expectedExitCode = 0, label = "installer") {
  return readResult(
    runNode(installerPath, ["--scope", "project", "--target", target, ...extraArgs]),
    label,
    expectedExitCode,
  );
}

function runUserInstaller(home, codexHome, extraArgs = [], expectedExitCode = 0, label = "user installer") {
  return readResult(
    runNode(
      installerPath,
      ["--scope", "user", ...extraArgs],
      repoRoot,
      { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: codexHome },
    ),
    label,
    expectedExitCode,
  );
}

function assertReportStatus(report, expected, label, scope = "project") {
  assert(report.status === expected, `${label}: expected status ${expected}, got ${report.status}`);
  assert(report.scope === scope, `${label}: expected ${scope} scope`);
}

function assertExactInstallRoots(installedSkillRoot, installedProfileRoot) {
  const sourceSkillFiles = listFiles(sourceSkillRoot);
  const installedSkillFiles = listFiles(installedSkillRoot);
  assert(
    JSON.stringify(installedSkillFiles) === JSON.stringify(sourceSkillFiles),
    "Installed skill file set differs from the package source",
  );
  for (const path of sourceSkillFiles) {
    assert(
      sha256(join(installedSkillRoot, ...path.split("/"))) ===
        sha256(join(sourceSkillRoot, ...path.split("/"))),
      `Installed skill file differs from source: ${path}`,
    );
  }

  const requiredProfiles = [...packageManifest.required_profiles].sort();
  assert(
    JSON.stringify(listFiles(installedProfileRoot)) === JSON.stringify(requiredProfiles),
    "Installed profile file set differs from required_profiles",
  );
  for (const profile of requiredProfiles) {
    assert(
      sha256(join(installedProfileRoot, profile)) === sha256(join(sourceProfileRoot, profile)),
      `Installed profile differs from source: ${profile}`,
    );
  }
}

function assertExactProjectInstall(target) {
  assertExactInstallRoots(
    join(target, ".agents/skills/naruto"),
    join(target, ".codex/agents"),
  );
}

const cases = [];
let testRoot;
let failure;

try {
  assert(Array.isArray(packageManifest.required_profiles), "Package manifest required_profiles must be an array");
  assert(packageManifest.required_profiles.length > 0, "Package manifest must require at least one profile");

  testRoot = mkdtempSync(join(tmpdir(), "naruto-installer-lifecycle-"));
  const projectTarget = join(testRoot, "project");
  mkdirSync(projectTarget, { recursive: true });

  const beforeInvalidArguments = snapshot(projectTarget);
  const unknownArgument = runInstaller(projectTarget, ["--dryrun"], 2, "unknown argument");
  assert(unknownArgument.reason === "invalid_arguments", "Unknown argument was not rejected by the CLI parser");
  assert(
    unknownArgument.errors?.some((error) => error.includes("unknown argument: --dryrun")),
    "Unknown argument report did not identify --dryrun",
  );
  const duplicateArgument = runInstaller(
    projectTarget,
    ["--force", "--force"],
    2,
    "duplicate argument",
  );
  assert(duplicateArgument.reason === "invalid_arguments", "Duplicate argument was not rejected");
  assert(
    duplicateArgument.errors?.some((error) => error.includes("duplicate argument: --force")),
    "Duplicate argument report did not identify --force",
  );
  const missingValueArgument = readResult(
    runNode(installerPath, ["--scope", "project", "--target"]),
    "missing argument value",
    2,
  );
  assert(missingValueArgument.reason === "invalid_arguments", "Missing argument value was not rejected");
  assert(
    missingValueArgument.errors?.some((error) => error.includes("missing value for --target")),
    "Missing-value report did not identify --target",
  );
  const invalidUserHome = join(testRoot, "invalid-user-home");
  const invalidUserRuntimeRoot = join(testRoot, "invalid-user-runtime-root");
  mkdirSync(invalidUserHome, { recursive: true });
  mkdirSync(invalidUserRuntimeRoot, { recursive: true });
  const invalidUserTarget = runUserInstaller(
    invalidUserHome,
    invalidUserRuntimeRoot,
    ["--target", projectTarget],
    2,
    "user scope with target",
  );
  assert(invalidUserTarget.reason === "invalid_arguments", "User-scope --target was not rejected");
  assert(
    invalidUserTarget.errors?.some((error) => error.includes("--target is not allowed for user scope")),
    "Invalid user-scope report did not identify --target",
  );
  assert(
    JSON.stringify(snapshot(projectTarget)) === JSON.stringify(beforeInvalidArguments) &&
      Object.keys(snapshot(invalidUserHome)).length === 0 &&
      Object.keys(snapshot(invalidUserRuntimeRoot)).length === 0,
    "Invalid arguments caused destination writes",
  );
  cases.push("strict-cli-rejects-invalid-arguments-before-write");

  const unexpectedTarget = join(testRoot, "unexpected-file-project");
  const unexpectedPath = join(unexpectedTarget, ".agents/skills/naruto/unexpected.txt");
  mkdirSync(dirname(unexpectedPath), { recursive: true });
  writeFileSync(unexpectedPath, "not package-owned\n", "utf8");
  const beforeUnexpectedInstall = snapshot(unexpectedTarget);
  const unexpectedReport = runInstaller(unexpectedTarget, [], 2, "unexpected skill file");
  assertReportStatus(unexpectedReport, "blocked", "unexpected skill file");
  assert(
    unexpectedReport.conflicts?.some(
      ({ path, reason }) => resolve(path) === resolve(unexpectedPath) && reason.includes("unexpected file"),
    ),
    "Unexpected package-owned skill file was not reported",
  );
  assert(
    JSON.stringify(snapshot(unexpectedTarget)) === JSON.stringify(beforeUnexpectedInstall),
    "Unexpected-file conflict caused partial writes",
  );
  cases.push("unexpected-package-owned-skill-file-blocked");

  const danglingTarget = join(testRoot, "dangling-symlink-project");
  const danglingSink = join(testRoot, "dangling-symlink-sink");
  const danglingPath = join(danglingTarget, ".agents/skills/naruto/SKILL.md");
  mkdirSync(dirname(danglingPath), { recursive: true });
  mkdirSync(danglingSink, { recursive: true });
  const escapedPath = join(danglingSink, "escaped-SKILL.md");
  if (process.platform === "win32") {
    mkdirSync(escapedPath, { recursive: true });
    symlinkSync(escapedPath, danglingPath, "junction");
    rmSync(escapedPath, { recursive: true, force: true });
  } else {
    symlinkSync(escapedPath, danglingPath, "file");
  }
  assert(lstatSync(danglingPath).isSymbolicLink(), "Dangling-link fixture is not a symbolic link");
  const beforeDanglingInstall = snapshot(danglingTarget);
  const danglingReport = runInstaller(danglingTarget, [], 2, "dangling destination symlink");
  assertReportStatus(danglingReport, "blocked", "dangling destination symlink");
  assert(
    danglingReport.conflicts?.some(({ reason }) => reason.includes("symlink")),
    "Dangling destination symlink was not reported",
  );
  assert(!existsSync(escapedPath), "Installer wrote through a dangling destination symlink");
  assert(
    JSON.stringify(snapshot(danglingTarget)) === JSON.stringify(beforeDanglingInstall),
    "Blocked dangling-symlink install changed the target",
  );
  cases.push("dangling-destination-symlink-blocked");

  const nonRegularTarget = join(testRoot, "non-regular-destination-project");
  const nonRegularPath = join(nonRegularTarget, ".agents/skills/naruto/SKILL.md");
  mkdirSync(nonRegularPath, { recursive: true });
  const beforeNonRegularInstall = snapshot(nonRegularTarget);
  const nonRegularReport = runInstaller(nonRegularTarget, [], 2, "non-regular destination");
  assertReportStatus(nonRegularReport, "blocked", "non-regular destination");
  assert(
    nonRegularReport.conflicts?.some(
      ({ path, reason }) => resolve(path) === resolve(nonRegularPath) && reason.includes("not a regular file"),
    ),
    "Non-regular destination was not reported",
  );
  assert(
    JSON.stringify(snapshot(nonRegularTarget)) === JSON.stringify(beforeNonRegularInstall),
    "Blocked non-regular destination install changed the target",
  );
  cases.push("non-regular-destination-blocked");

  const hardLinkTarget = join(testRoot, "hard-link-destination-project");
  const hardLinkExternal = join(testRoot, "hard-link-external-SKILL.md");
  const hardLinkDestination = join(hardLinkTarget, ".agents/skills/naruto/SKILL.md");
  mkdirSync(dirname(hardLinkDestination), { recursive: true });
  writeFileSync(hardLinkExternal, "external file must remain unchanged\n", "utf8");
  linkSync(hardLinkExternal, hardLinkDestination);
  const externalHashBefore = sha256(hardLinkExternal);
  const beforeHardLinkInstall = snapshot(hardLinkTarget);
  const hardLinkReport = runInstaller(
    hardLinkTarget,
    ["--force"],
    2,
    "hard-linked destination",
  );
  assertReportStatus(hardLinkReport, "blocked", "hard-linked destination");
  assert(
    hardLinkReport.conflicts?.some(
      ({ path, reason }) =>
        resolve(path) === resolve(hardLinkDestination) && reason.includes("hard-linked"),
    ),
    "Hard-linked destination was not reported",
  );
  assert(sha256(hardLinkExternal) === externalHashBefore, "Installer modified the external hard-link alias");
  assert(
    JSON.stringify(snapshot(hardLinkTarget)) === JSON.stringify(beforeHardLinkInstall),
    "Blocked hard-link install changed the target",
  );
  cases.push("hard-linked-destination-blocked-even-with-force");

  const beforeFreshDryRun = snapshot(projectTarget);
  const freshDryRun = runInstaller(projectTarget, ["--dry-run"], 0, "fresh dry-run");
  assertReportStatus(freshDryRun, "dry-run", "fresh dry-run");
  assert(freshDryRun.validation?.status === "not_run", "Dry-run must not execute target validation");
  assert(freshDryRun.counts?.create > 0, "Fresh dry-run must plan at least one create action");
  assert(freshDryRun.counts?.overwrite === 0, "Fresh dry-run must not plan overwrite actions");
  assert(freshDryRun.counts?.unchanged === 0, "Fresh dry-run must not report unchanged package files");
  assert(
    JSON.stringify(snapshot(projectTarget)) === JSON.stringify(beforeFreshDryRun),
    "Fresh dry-run wrote to the target",
  );
  cases.push("fresh-dry-run-no-write");

  const freshInstall = runInstaller(projectTarget, [], 0, "fresh install");
  assertReportStatus(freshInstall, "installed", "fresh install");
  assert(freshInstall.validation?.status === "pass", "Fresh install did not report target validation PASS");
  assert(
    freshInstall.validation?.source === "private_verified_snapshot",
    "Fresh install did not execute the private verified validator snapshot",
  );
  assert(freshInstall.counts?.create > 0, "Fresh install must create package files");
  assert(freshInstall.counts?.overwrite === 0, "Fresh install must not overwrite files");
  assertExactProjectInstall(projectTarget);
  cases.push("fresh-project-install");

  const installedValidator = join(
    projectTarget,
    ".agents/skills/naruto/scripts/validate-naruto.mjs",
  );
  const validatorReport = readResult(
    runNode(installedValidator, [], projectTarget),
    "installed skill validator",
    0,
  );
  assert(validatorReport.status === "pass", "Installed skill validator did not pass");
  assert(validatorReport.skill === "naruto", "Installed skill validator reported the wrong skill");
  cases.push("installed-skill-validator");

  const installedSnapshot = snapshot(projectTarget);
  const secondInstall = runInstaller(projectTarget, [], 0, "idempotent second install");
  assertReportStatus(secondInstall, "installed", "idempotent second install");
  assert(secondInstall.counts?.create === 0, "Second install must not create files");
  assert(secondInstall.counts?.overwrite === 0, "Second install must not overwrite files");
  assert(secondInstall.counts?.unchanged > 0, "Second install must report unchanged files");
  assert(
    JSON.stringify(snapshot(projectTarget)) === JSON.stringify(installedSnapshot),
    "Second install changed an already current installation",
  );

  const idempotentDryRun = runInstaller(projectTarget, ["--dry-run"], 0, "idempotent dry-run");
  assertReportStatus(idempotentDryRun, "dry-run", "idempotent dry-run");
  assert(idempotentDryRun.counts?.create === 0, "Idempotent dry-run must not plan creates");
  assert(idempotentDryRun.counts?.overwrite === 0, "Idempotent dry-run must not plan overwrites");
  assert(idempotentDryRun.counts?.unchanged > 0, "Idempotent dry-run must report unchanged files");
  assert(
    JSON.stringify(snapshot(projectTarget)) === JSON.stringify(installedSnapshot),
    "Idempotent dry-run changed the installation",
  );
  cases.push("idempotent-reinstall-and-dry-run");

  const conflictPath = join(projectTarget, ".agents/skills/naruto/SKILL.md");
  const sourceConflictPath = join(sourceSkillRoot, "SKILL.md");
  writeFileSync(conflictPath, `${readFileSync(conflictPath, "utf8")}\n# lifecycle-test-conflict\n`, "utf8");
  const conflictHash = sha256(conflictPath);
  const beforeBlockedInstall = snapshot(projectTarget);
  const conflictReport = runInstaller(projectTarget, [], 2, "conflict without force");
  assertReportStatus(conflictReport, "blocked", "conflict without force");
  assert(
    conflictReport.conflicts?.some(
      ({ path, reason }) => resolve(path) === resolve(conflictPath) && reason.includes("use --force"),
    ),
    "Conflict report did not identify the modified package-owned file",
  );
  assert(sha256(conflictPath) === conflictHash, "Blocked install changed the conflicting file");
  assert(
    JSON.stringify(snapshot(projectTarget)) === JSON.stringify(beforeBlockedInstall),
    "Blocked install made partial writes",
  );
  cases.push("conflict-without-force-blocked");

  const forceReport = runInstaller(projectTarget, ["--force"], 0, "force overwrite");
  assertReportStatus(forceReport, "installed", "force overwrite");
  assert(forceReport.counts?.overwrite > 0, "Force install must report an overwrite");
  assert(
    sha256(conflictPath) === sha256(sourceConflictPath),
    "Force install did not restore the package source hash",
  );
  assertExactProjectInstall(projectTarget);
  cases.push("force-overwrite-restores-source");

  const migrationTarget = join(testRoot, "historical-0.4-project");
  const currentInstallPaths = [
    ...listFiles(sourceSkillRoot).map((path) => `.agents/skills/naruto/${path}`),
    ...packageManifest.required_profiles.map((profile) => `.codex/agents/${profile}`),
  ].sort();
  const historicalPaths = historicalMigrationInventory.entries.map(({ path }) => path).sort();
  assert(
    historicalMigrationInventory.schema === "naruto_installer_historical_inventory.v1" &&
      historicalMigrationInventory.source_commit === "42cab91" &&
      historicalMigrationInventory.source_version === "0.4.0",
    "Historical migration fixture identity is invalid",
  );
  assert(
    JSON.stringify(historicalPaths) === JSON.stringify(currentInstallPaths),
    "Historical 0.4 inventory does not match the complete current install inventory",
  );
  let historicalOverwriteCount = 0;
  let historicalUnchangedCount = 0;
  for (const entry of historicalMigrationInventory.entries) {
    assert(
      /^[a-f0-9]{64}$/.test(entry.historical_sha256) && /^[a-f0-9]{64}$/.test(entry.target_sha256),
      `Historical fixture has an invalid digest: ${entry.path}`,
    );
    const sourcePath = join(repoRoot, ...entry.path.split("/"));
    const destinationPath = join(migrationTarget, ...entry.path.split("/"));
    assert(sha256(sourcePath) === entry.target_sha256, `Historical fixture target digest is stale: ${entry.path}`);
    mkdirSync(dirname(destinationPath), { recursive: true });
    if (entry.historical_sha256 === entry.target_sha256) {
      copyFileSync(sourcePath, destinationPath);
      historicalUnchangedCount += 1;
    } else {
      writeFileSync(
        destinationPath,
        `historical 0.4 payload placeholder\npath=${entry.path}\nsha256=${entry.historical_sha256}\n`,
        "utf8",
      );
      historicalOverwriteCount += 1;
    }
  }
  assert(
    historicalMigrationInventory.expected_counts?.create === 0 &&
      historicalMigrationInventory.expected_counts?.overwrite === historicalOverwriteCount &&
      historicalMigrationInventory.expected_counts?.unchanged === historicalUnchangedCount,
    "Historical fixture action counts do not match its hashes",
  );
  const migrationReport = runInstaller(
    migrationTarget,
    ["--force"],
    0,
    "historical 0.4 migration",
  );
  assertReportStatus(migrationReport, "installed", "historical 0.4 migration");
  assert(
    JSON.stringify(migrationReport.counts) ===
      JSON.stringify(historicalMigrationInventory.expected_counts),
    `0.4 migration action mix mismatch: ${JSON.stringify(migrationReport.counts)}`,
  );
  assert(migrationReport.validation?.status === "pass", "0.4 migration target validation did not pass");
  assertExactProjectInstall(migrationTarget);
  cases.push("historical-0.4.0-to-1.1.0-full-inventory-migration");

  const sameNameHostTarget = join(testRoot, "same-name-host-project");
  mkdirSync(sameNameHostTarget, { recursive: true });
  writeFileSync(
    join(sameNameHostTarget, "package.json"),
    `${JSON.stringify({ name: "naruto-codex-deliberation-council" })}\n`,
    "utf8",
  );
  const sameNameHostReport = runInstaller(
    sameNameHostTarget,
    [],
    0,
    "same-name host project install",
  );
  assertReportStatus(sameNameHostReport, "installed", "same-name host project install");
  assert(
    sameNameHostReport.validation?.status === "pass" &&
      sameNameHostReport.validation?.source === "private_verified_snapshot",
    "Install validation incorrectly entered package mode for the host project",
  );
  assertExactProjectInstall(sameNameHostTarget);
  cases.push("install-validation-ignores-host-package-mode");

  const userHome = join(testRoot, "user-home");
  const userRuntimeRoot = join(testRoot, "user-runtime-root");
  mkdirSync(userHome, { recursive: true });
  mkdirSync(userRuntimeRoot, { recursive: true });
  const userInstall = runUserInstaller(userHome, userRuntimeRoot, [], 0, "fresh user install");
  assertReportStatus(userInstall, "installed", "fresh user install", "user");
  assert(userInstall.validation?.status === "pass", "User install did not report target validation PASS");
  assert(userInstall.counts?.create > 0, "Fresh user install must create package files");
  assert(userInstall.counts?.overwrite === 0, "Fresh user install must not overwrite files");
  assertExactInstallRoots(
    join(userHome, ".agents/skills/naruto"),
    join(userRuntimeRoot, "agents"),
  );
  const userValidator = join(
    userHome,
    ".agents/skills/naruto/scripts/validate-naruto.mjs",
  );
  const userValidatorReport = readResult(
    runNode(
      userValidator,
      [],
      userHome,
      {
        ...process.env,
        HOME: userHome,
        USERPROFILE: userHome,
        CODEX_HOME: userRuntimeRoot,
      },
    ),
    "user-installed skill validator",
    0,
  );
  assert(userValidatorReport.status === "pass", "User-installed skill validator did not pass");
  const userDryRun = runUserInstaller(
    userHome,
    userRuntimeRoot,
    ["--dry-run"],
    0,
    "idempotent user dry-run",
  );
  assertReportStatus(userDryRun, "dry-run", "idempotent user dry-run", "user");
  assert(userDryRun.counts?.create === 0, "User dry-run must not plan creates");
  assert(userDryRun.counts?.overwrite === 0, "User dry-run must not plan overwrites");
  assert(userDryRun.counts?.unchanged > 0, "User dry-run must report unchanged files");
  cases.push("fresh-user-install-and-validation");

  const symlinkTarget = join(testRoot, "symlink-project");
  const symlinkSink = join(testRoot, "symlink-sink");
  mkdirSync(symlinkTarget, { recursive: true });
  mkdirSync(symlinkSink, { recursive: true });
  symlinkSync(
    symlinkSink,
    join(symlinkTarget, ".agents"),
    process.platform === "win32" ? "junction" : "dir",
  );
  const beforeSymlinkInstall = snapshot(symlinkTarget);
  const symlinkReport = runInstaller(symlinkTarget, [], 2, "symlink destination");
  assertReportStatus(symlinkReport, "blocked", "symlink destination");
  assert(
    symlinkReport.conflicts?.some(({ reason }) => reason.includes("symlink in destination path")),
    "Symlink destination was not reported as a conflict",
  );
  assert(
    JSON.stringify(snapshot(symlinkTarget)) === JSON.stringify(beforeSymlinkInstall),
    "Blocked symlink install changed the target",
  );
  assert(listFiles(symlinkSink).length === 0, "Blocked symlink install wrote through the symlink");
  cases.push("symlink-destination-blocked");

} catch (error) {
  failure = error;
} finally {
  if (testRoot) {
    try {
      rmSync(testRoot, { recursive: true, force: true });
    } catch (cleanupError) {
      failure ??= cleanupError;
    }
  }
}

if (failure) {
  console.error(`installer-lifecycle failed: ${failure.message}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "pass",
      suite: "installer-lifecycle",
      cases,
      case_count: cases.length,
    },
    null,
    2,
  ),
);
