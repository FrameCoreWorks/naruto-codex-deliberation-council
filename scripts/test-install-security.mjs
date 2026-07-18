#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
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
    package_name: "codex-deliberation-council",
    package_version: "1.0.0",
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

function runInstaller(root, extraArgs = []) {
  return spawnSync(
    process.execPath,
    [join(root, "scripts/install.mjs"), "--scope", "project", "--target", join(root, "target"), "--dry-run", ...extraArgs],
    { cwd: root, encoding: "utf8" },
  );
}

function assertBlocked(name, root, expectedReason, expectedDetail, extraArgs = []) {
  try {
    const result = runInstaller(root, extraArgs);
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    if (result.status !== 2 || !output.includes(expectedReason) || !output.includes(expectedDetail)) {
      throw new Error(
        `${name} did not fail closed as expected (status=${result.status}).\n${output}`,
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
  "checksum mismatch: manifest/package-manifest.json",
);

const legacyRoot = createTestPackage(baseManifest());
const seededLegacyPath = join(legacyRoot, "target/.codex/agents/naruto_uzumaki.toml");
mkdirSync(dirname(seededLegacyPath), { recursive: true });
writeFileSync(seededLegacyPath, "legacy\n", "utf8");
assertBlocked(
  "legacy 0.3 installation with force",
  legacyRoot,
  "legacy_0_3_installation_detected",
  '"force_bypass_allowed": false',
  ["--force"],
);

const traversalProfiles = [...exactProfiles];
traversalProfiles[traversalProfiles.length - 1] = "../../README.md";
assertBlocked(
  "profile path traversal",
  createTestPackage(baseManifest(traversalProfiles)),
  "invalid_profile_bundle_contract",
  "profile must be a basename without path traversal",
);

const duplicateProfiles = [...exactProfiles];
duplicateProfiles[duplicateProfiles.length - 1] = "kakashi_hatake.toml";
assertBlocked(
  "duplicate profile",
  createTestPackage(baseManifest(duplicateProfiles)),
  "invalid_profile_bundle_contract",
  "duplicate required profile: kakashi_hatake.toml",
);

console.log(
  JSON.stringify(
    {
      status: "pass",
      suite: "installer-security",
      cases: 4,
    },
    null,
    2,
  ),
);
