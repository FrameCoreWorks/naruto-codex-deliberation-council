#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const installerSource = join(repoRoot, "scripts/install.mjs");
const exactProfiles = [
  "naruto_clone_integrator.toml",
  "naruto_clone_challenger.toml",
  "naruto_clone_strategist.toml",
  "naruto_clone_verifier.toml",
  "kakashi_hatake.toml",
  "yamato.toml",
];
const legacyPaths = [
  ".codex/agents/naruto_uzumaki.toml",
  ".codex/agents/sasuke_uchiha.toml",
  ".codex/agents/shikamaru_nara.toml",
  ".codex/agents/sakura_haruno.toml",
  ".agents/skills/naruto/agents/naruto-uzumaki.yaml",
  ".agents/skills/naruto/agents/sasuke-uchiha.yaml",
  ".agents/skills/naruto/agents/shikamaru-nara.yaml",
  ".agents/skills/naruto/agents/sakura-haruno.yaml",
];

function digest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function baseManifest(requiredProfiles = exactProfiles) {
  return {
    schema: "codex_deliberation_package.v3",
    package_name: "naruto-codex-deliberation-council",
    package_version: "1.0.1",
    bundled_profile_count: 6,
    parent_role_profile_bundled: false,
    required_profiles: requiredProfiles,
    migration: {
      legacy_0_3_installation_policy: "fail_closed_manual_cleanup",
      force_bypass_allowed: false,
      legacy_profile_paths: legacyPaths,
    },
  };
}

function createTestPackage(manifest, mutateAfterChecksum = null) {
  const root = mkdtempSync(join(tmpdir(), "naruto-installer-security-"));
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "manifest"), { recursive: true });
  mkdirSync(join(root, "target"), { recursive: true });
  copyFileSync(installerSource, join(root, "scripts/install.mjs"));

  const manifestPath = join(root, "manifest/package-manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  writeFileSync(
    join(root, "SHA256SUMS"),
    `${digest(manifestPath)}  manifest/package-manifest.json\n`,
    "utf8",
  );
  if (mutateAfterChecksum) mutateAfterChecksum(manifestPath);
  return root;
}

function createFullTestPackage() {
  const root = mkdtempSync(join(tmpdir(), "naruto-installer-security-full-"));
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "manifest"), { recursive: true });
  mkdirSync(join(root, "target"), { recursive: true });
  mkdirSync(join(root, ".agents/skills"), { recursive: true });
  mkdirSync(join(root, ".codex"), { recursive: true });
  copyFileSync(installerSource, join(root, "scripts/install.mjs"));
  copyFileSync(join(repoRoot, "manifest/package-manifest.json"), join(root, "manifest/package-manifest.json"));
  copyFileSync(join(repoRoot, "SHA256SUMS"), join(root, "SHA256SUMS"));
  cpSync(join(repoRoot, ".agents/skills/naruto"), join(root, ".agents/skills/naruto"), { recursive: true });
  cpSync(join(repoRoot, ".codex/agents"), join(root, ".codex/agents"), { recursive: true });
  return root;
}

function replaceChecksumEntry(root, packagePath) {
  const checksumFile = join(root, "SHA256SUMS");
  const payloadPath = join(root, ...packagePath.split("/"));
  const lines = readFileSync(checksumFile, "utf8").trimEnd().split(/\r?\n/);
  const index = lines.findIndex((line) => line.endsWith(`  ${packagePath}`));
  if (index < 0) throw new Error(`Missing checksum fixture entry: ${packagePath}`);
  lines[index] = `${digest(payloadPath)}  ${packagePath}`;
  writeFileSync(checksumFile, `${lines.join("\n")}\n`, "utf8");
}

function runInstaller(root, extraArgs = [], dryRun = true) {
  const args = [
    join(root, "scripts/install.mjs"),
    "--scope",
    "project",
    "--target",
    join(root, "target"),
  ];
  if (dryRun) args.push("--dry-run");
  args.push(...extraArgs);
  return spawnSync(
    process.execPath,
    args,
    { cwd: root, encoding: "utf8" },
  );
}

function parseJsonObjectOutput(output) {
  const text = String(output ?? "").trim();
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function assertBlocked(name, root, expectedReason, assertDetail, extraArgs = [], dryRun = true) {
  try {
    const result = runInstaller(root, extraArgs, dryRun);
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    const report = parseJsonObjectOutput(result.stdout);
    if (
      result.status !== 2 ||
      (result.stderr ?? "").trim() !== "" ||
      report?.status !== "blocked" ||
      report?.reason !== expectedReason ||
      !assertDetail(report)
    ) {
      throw new Error(
        `${name} did not fail closed with exact status/reason/detail (status=${result.status}).\n${output}`,
      );
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const tamperedRoot = createTestPackage(baseManifest(), (manifestPath) => {
  const tampered = baseManifest();
  tampered.package_name = "tampered-package";
  writeFileSync(manifestPath, `${JSON.stringify(tampered, null, 2)}\n`, "utf8");
});
assertBlocked(
  "tampered manifest",
  tamperedRoot,
  "manifest_integrity_failed",
  (report) => report.errors?.includes("checksum mismatch: manifest/package-manifest.json"),
);

const hardLinkedChecksumRoot = createTestPackage(baseManifest());
linkSync(join(hardLinkedChecksumRoot, "SHA256SUMS"), join(hardLinkedChecksumRoot, "checksum-hard-link"));
assertBlocked(
  "hard-linked checksum manifest",
  hardLinkedChecksumRoot,
  "checksum_file_preflight_failed",
  (report) => report.errors?.some((error) => error.startsWith("hard-linked SHA256SUMS:")),
  ["--force"],
);

const hardLinkedManifestRoot = createTestPackage(baseManifest());
linkSync(
  join(hardLinkedManifestRoot, "manifest/package-manifest.json"),
  join(hardLinkedManifestRoot, "package-manifest-hard-link"),
);
assertBlocked(
  "hard-linked package manifest",
  hardLinkedManifestRoot,
  "manifest_integrity_failed",
  (report) => report.errors?.some((error) => error.startsWith("hard-linked manifest/package-manifest.json:")),
  ["--force"],
);

const legacyRoot = createTestPackage(baseManifest());
const seededLegacyPath = join(legacyRoot, "target/.codex/agents/naruto_uzumaki.toml");
mkdirSync(dirname(seededLegacyPath), { recursive: true });
writeFileSync(seededLegacyPath, "legacy\n", "utf8");
assertBlocked(
  "legacy 0.3 installation with force",
  legacyRoot,
  "legacy_0_3_installation_detected",
  (report) => report.force_bypass_allowed === false,
  ["--force"],
);

const traversalProfiles = [...exactProfiles];
traversalProfiles[traversalProfiles.length - 1] = "../../README.md";
assertBlocked(
  "profile path traversal",
  createTestPackage(baseManifest(traversalProfiles)),
  "invalid_profile_bundle_contract",
  (report) => report.errors?.some((error) => error.startsWith("profile must be a basename without path traversal:")),
);

const duplicateProfiles = [...exactProfiles];
duplicateProfiles[duplicateProfiles.length - 1] = "kakashi_hatake.toml";
assertBlocked(
  "duplicate profile",
  createTestPackage(baseManifest(duplicateProfiles)),
  "invalid_profile_bundle_contract",
  (report) => report.errors?.includes("duplicate required profile: kakashi_hatake.toml"),
);

const missingSourceRoot = createFullTestPackage();
rmSync(join(missingSourceRoot, ".agents/skills/naruto/SKILL.md"));
assertBlocked(
  "missing source listed in checksums",
  missingSourceRoot,
  "source_inventory_failed",
  (report) => report.errors?.includes("missing skill source file: SKILL.md"),
);

const unexpectedSourceRoot = createFullTestPackage();
writeFileSync(
  join(unexpectedSourceRoot, ".agents/skills/naruto/unexpected.md"),
  "not declared by SHA256SUMS\n",
  "utf8",
);
assertBlocked(
  "unexpected source not listed in checksums",
  unexpectedSourceRoot,
  "source_inventory_failed",
  (report) => report.errors?.includes("unexpected skill source file: unexpected.md"),
);

const tamperedSkillRoot = createFullTestPackage();
const tamperedSkillPath = join(tamperedSkillRoot, ".agents/skills/naruto/SKILL.md");
writeFileSync(tamperedSkillPath, `${readFileSync(tamperedSkillPath, "utf8")}\n# tampered\n`, "utf8");
assertBlocked(
  "tampered expected skill payload",
  tamperedSkillRoot,
  "source_preflight_failed",
  (report) => report.errors?.includes("checksum mismatch: .agents/skills/naruto/SKILL.md"),
);

const tamperedProfileRoot = createFullTestPackage();
const tamperedProfilePath = join(tamperedProfileRoot, ".codex/agents/yamato.toml");
writeFileSync(tamperedProfilePath, `${readFileSync(tamperedProfilePath, "utf8")}\n# tampered\n`, "utf8");
assertBlocked(
  "tampered expected profile payload",
  tamperedProfileRoot,
  "source_preflight_failed",
  (report) => report.errors?.includes("checksum mismatch: .codex/agents/yamato.toml"),
);

const hardLinkedSourceRoot = createFullTestPackage();
linkSync(
  join(hardLinkedSourceRoot, ".agents/skills/naruto/SKILL.md"),
  join(hardLinkedSourceRoot, "source-hard-link"),
);
assertBlocked(
  "hard-linked expected source payload",
  hardLinkedSourceRoot,
  "source_preflight_failed",
  (report) => report.errors?.some((error) => error.startsWith("hard-linked .agents/skills/naruto/SKILL.md:")),
  ["--force"],
);

const failingValidatorRoot = createFullTestPackage();
const failingValidatorPackagePath = ".agents/skills/naruto/scripts/validate-naruto.mjs";
writeFileSync(
  join(failingValidatorRoot, ...failingValidatorPackagePath.split("/")),
  `#!/usr/bin/env node
console.log(JSON.stringify({
  status: "fail",
  skill: "naruto",
  total: 1,
  passed: 0,
  failed: 1,
  errors: ["controlled validator failure"],
}, null, 2));
process.exitCode = 1;
`,
  "utf8",
);
replaceChecksumEntry(failingValidatorRoot, failingValidatorPackagePath);
assertBlocked(
  "target validator must pass before installed",
  failingValidatorRoot,
  "target_validation_failed",
  (report) =>
    report.validator_source === "private_verified_snapshot" &&
    report.validator_report?.status === "fail" &&
    report.validator_report?.errors?.includes("controlled validator failure"),
  [],
  false,
);

console.log(
  JSON.stringify(
    {
      status: "pass",
      suite: "installer-security",
      cases: 12,
    },
    null,
    2,
  ),
);
