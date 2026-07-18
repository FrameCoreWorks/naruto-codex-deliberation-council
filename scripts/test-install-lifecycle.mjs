#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
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

function parseLastJson(stdout, label) {
  const output = (stdout ?? "").trim();
  for (let start = output.lastIndexOf("{"); start >= 0; start = output.lastIndexOf("{", start - 1)) {
    try {
      const parsed = JSON.parse(output.slice(start));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      // Continue until the outermost final JSON object is found.
    }
  }
  throw new Error(`${label} did not emit a final JSON object.\nstdout:\n${stdout ?? ""}`);
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
    report = parseLastJson(result.stdout, label);
  } catch (error) {
    throw new Error(
      `${error.message}\nstderr:\n${result.stderr ?? ""}\nexit status: ${result.status}`,
    );
  }

  if (result.status !== expectedExitCode) {
    const integrityReason = new Set([
      "manifest_integrity_failed",
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
      { ...process.env, HOME: home, CODEX_HOME: codexHome },
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

  const beforeFreshDryRun = snapshot(projectTarget);
  const freshDryRun = runInstaller(projectTarget, ["--dry-run"], 0, "fresh dry-run");
  assertReportStatus(freshDryRun, "dry-run", "fresh dry-run");
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

  const userHome = join(testRoot, "user-home");
  const userRuntimeRoot = join(testRoot, "user-runtime-root");
  mkdirSync(userHome, { recursive: true });
  mkdirSync(userRuntimeRoot, { recursive: true });
  const userInstall = runUserInstaller(userHome, userRuntimeRoot, [], 0, "fresh user install");
  assertReportStatus(userInstall, "installed", "fresh user install", "user");
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
      { ...process.env, HOME: userHome, CODEX_HOME: userRuntimeRoot },
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
