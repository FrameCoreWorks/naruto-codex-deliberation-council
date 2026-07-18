#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const checks = [];

function record(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function parseJson(relativePath) {
  try {
    return JSON.parse(readText(join(repoRoot, relativePath)));
  } catch (error) {
    record(`parse:${relativePath}`, false, error.message);
    return null;
  }
}

function listFiles(directory, base = "") {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "__MACOSX"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    const relativePath = base ? join(base, entry.name) : entry.name;
    if (entry.isSymbolicLink()) {
      files.push(relativePath);
      continue;
    }
    if (entry.isDirectory()) files.push(...listFiles(path, relativePath));
    if (entry.isFile()) files.push(relativePath);
  }
  return files.sort();
}

const packageJson = parseJson("package.json");
const manifest = parseJson("manifest/package-manifest.json");
const assetManifest = parseJson("manifest/assets.json");
const readmePath = join(repoRoot, "README.md");
const readme = readText(readmePath);
const releaseAcceptance = readText(join(repoRoot, "docs/release-acceptance-v1.0.0.md"));
const compatibility = readText(join(repoRoot, "docs/compatibility.md"));
const bannerRelativePath = "assets/naruto-codex-deliberation-council-banner.png";
const bannerPath = join(repoRoot, bannerRelativePath);

record("package_version", packageJson?.version === "1.0.0", packageJson?.version ?? "missing");
record("package_private", packageJson?.private === true, "package must remain non-publishable through npm");
record("package_node", packageJson?.engines?.node === ">=22", packageJson?.engines?.node ?? "missing");
record("manifest_version", manifest?.package_version === packageJson?.version, manifest?.package_version ?? "missing");
record("manifest_stable", manifest?.release?.status === "stable", manifest?.release?.status ?? "missing");
record("manifest_contract", manifest?.release?.contract_version === "1.0.0", manifest?.release?.contract_version ?? "missing");
record("manifest_node", manifest?.release?.node_minimum_major === 22, String(manifest?.release?.node_minimum_major));
record(
  "manifest_ci_matrix",
  JSON.stringify(manifest?.release?.ci_node_majors) === JSON.stringify([22, 24]),
  JSON.stringify(manifest?.release?.ci_node_majors),
);
record(
  "manifest_runtime_policy",
  manifest?.release?.runtime_capability_policy === "fail_closed",
  manifest?.release?.runtime_capability_policy ?? "missing",
);
record(
  "manifest_parent_identity",
  manifest?.public_parent_role_id === "hokage" && manifest?.public_parent_identity_id === "tsunade_senju",
  `${manifest?.public_parent_role_id ?? "missing"}/${manifest?.public_parent_identity_id ?? "missing"}`,
);
record(
  "manifest_distribution",
  manifest?.distribution?.github_source_ready === true &&
    manifest?.distribution?.remote_included === false &&
    manifest?.distribution?.remote_meaning === "no_remote_configuration_or_push_automation",
  JSON.stringify(manifest?.distribution),
);
const finalQaRequirement = manifest?.host_role_requirements?.[0];
record(
  "manifest_host_final_qa",
  manifest?.host_role_requirements?.length === 1 &&
    finalQaRequirement?.role_id === "final_qa" &&
    finalQaRequirement?.runtime_binding === "host_provided" &&
    finalQaRequirement?.bundled_profile === false &&
    finalQaRequirement?.required_when === "consequential_result" &&
    finalQaRequirement?.review_mode === "role_blind_independent" &&
    finalQaRequirement?.unavailable_policy === "blocked",
  JSON.stringify(manifest?.host_role_requirements),
);
record(
  "manifest_update_contract",
  JSON.stringify(manifest?.migration?.supported_in_place_from) === JSON.stringify(["0.4.x"]),
  JSON.stringify(manifest?.migration?.supported_in_place_from),
);

const requiredFiles = [
  ".github/workflows/ci.yml",
  "CHANGELOG.md",
  "LICENSE",
  "NOTICE.md",
  "README.md",
  "SECURITY.md",
  bannerRelativePath,
  "docs/compatibility.md",
  "docs/naming-risk.md",
  "docs/release-acceptance-v1.0.0.md",
  "docs/releases/v1.0.0.md",
  "manifest/package-manifest.json",
  "manifest/assets.json",
  "scripts/test-install-lifecycle.mjs",
];
for (const relativePath of requiredFiles) {
  const path = join(repoRoot, relativePath);
  record(
    `required_file:${relativePath}`,
    existsSync(path) && lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(),
    "missing, non-file, or symlink",
  );
}

const firstReadmeLine = readme.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
record(
  "readme_banner_first",
  /^!\[[^\]]+\]\(assets\/naruto-codex-deliberation-council-banner\.png\)$/.test(firstReadmeLine),
  firstReadmeLine,
);
record(
  "readme_release_contract",
  readme.includes("Standalone package version: `1.0.0`") &&
    readme.includes("docs/release-acceptance-v1.0.0.md"),
  "README must identify the release and its acceptance record",
);
record(
  "readme_parent_identity",
  readme.includes("Tsunade Senju, Fifth Hokage") && readme.includes("not a seventh child profile"),
  "Tsunade must remain the parent-process identity",
);
record(
  "readme_host_final_qa",
  readme.includes("independent `final_qa` reviewer") && readme.includes("not bundled"),
  "README must disclose the conditional host-provided final QA role",
);
record(
  "readme_fan_art_scope",
  /unofficial fan art/i.test(readme) && /excluded from the MIT/i.test(readme),
  "README must disclose the banner's separate rights scope",
);
record(
  "hosted_ci_claim_boundary",
  releaseAcceptance.includes("no hosted run is claimed or recorded here") &&
    compatibility.includes("no hosted run is") &&
    !/\bCI runs\b/.test(releaseAcceptance) &&
    !/Repository CI exercises/.test(compatibility),
  "documentation must describe configured CI without claiming an unobserved hosted run",
);

const assetEntry = manifest?.assets?.find(({ path }) => path === bannerRelativePath);
const assetRecord = assetManifest?.assets?.find(({ path }) => path === bannerRelativePath);
const bannerDigest = existsSync(bannerPath)
  ? createHash("sha256").update(readFileSync(bannerPath)).digest("hex")
  : null;
record(
  "manifest_banner",
  manifest?.assets?.length === 1 &&
    assetEntry?.asset_id === "naruto_codex_deliberation_council_banner" &&
    assetEntry?.version === 3 &&
    assetEntry?.kind === "readme_banner" &&
    assetEntry?.media_type === "image/png" &&
    assetEntry?.license_scope === "unofficial_fan_art_excluded_from_mit" &&
    manifest?.fan_art_included_in_mit === false,
  JSON.stringify(manifest?.assets),
);
record(
  "asset_manifest_contract",
  assetManifest?.schema === "codex_deliberation_asset_manifest.v1" &&
    assetManifest?.assets?.length === 1 &&
    assetRecord?.asset_id === assetEntry?.asset_id &&
    assetRecord?.version === assetEntry?.version &&
    assetRecord?.media_type === "image/png" &&
    assetRecord?.width === 1942 &&
    assetRecord?.height === 809 &&
    assetRecord?.sha256 === "fdd77292c3778aee20d0a4bc608b4b5567223fd44de6e443ebff82228ae00c46" &&
    assetRecord?.sha256 === bannerDigest &&
    assetRecord?.creation?.tool === "codex_builtin_imagegen" &&
    assetRecord?.qa?.status === "accepted" &&
    assetRecord?.distribution?.delivery_status === "local_repository_only" &&
    assetRecord?.distribution?.license_scope === "unofficial_fan_art_excluded_from_mit" &&
    assetRecord?.distribution?.rights_clearance === "not_cleared" &&
    assetRecord?.distribution?.affiliation_claimed === false,
  JSON.stringify(assetRecord),
);

if (existsSync(bannerPath) && lstatSync(bannerPath).isFile()) {
  const banner = readFileSync(bannerPath);
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const signatureOk = banner.length >= 24 && signature.every((byte, index) => banner[index] === byte);
  const ihdrOk = signatureOk && banner.subarray(12, 16).toString("ascii") === "IHDR";
  const width = ihdrOk ? banner.readUInt32BE(16) : 0;
  const height = ihdrOk ? banner.readUInt32BE(20) : 0;
  const ratio = height > 0 ? width / height : 0;
  record("banner_png", signatureOk && ihdrOk, "invalid PNG signature or IHDR");
  record("banner_dimensions", width >= 1920 && height >= 800, `${width}x${height}`);
  record("banner_ratio", Math.abs(ratio - 2.4) <= 0.03, ratio.toFixed(4));
} else {
  record("banner_png", false, "banner missing");
  record("banner_dimensions", false, "banner missing");
  record("banner_ratio", false, "banner missing");
}

const ciPath = join(repoRoot, ".github/workflows/ci.yml");
if (existsSync(ciPath)) {
  const ci = readText(ciPath);
  record("ci_node_matrix", /\[\s*22\s*,\s*24\s*\]/.test(ci), "CI must cover Node 22 and 24");
  record(
    "ci_release_commands",
    ci.includes("npm test") && ci.includes("npm run checksums:check") && ci.includes("git diff --check"),
    "CI release commands missing",
  );
  record(
    "ci_commit_range",
    ci.includes("github.event.pull_request.base.sha") &&
      ci.includes("github.event.before") &&
      ci.includes("git show --check"),
    "CI whitespace check must cover the PR or push commit range",
  );
}

const textExtensions = new Set(["", ".json", ".md", ".mjs", ".toml", ".yaml", ".yml"]);
const publicTextFiles = listFiles(repoRoot).filter((path) => {
  if (path === "SHA256SUMS") return false;
  return textExtensions.has(extname(path).toLowerCase());
});
const privatePathPattern = /(?:^|[\s("'`])\/(?:Users|Volumes)\/[A-Za-z0-9._~+/@ -]+/m;
const internalRolePattern = new RegExp(
  ["\\bOs", "kar\\b|\\bHip", "son\\b|\\bEr", "yk\\b|\\bOl", "ga\\b"].join(""),
  "i",
);
const privatePathHits = [];
const internalRoleHits = [];
const symlinkHits = [];
for (const relativePath of publicTextFiles) {
  const path = join(repoRoot, ...relativePath.split(sep));
  if (lstatSync(path).isSymbolicLink()) {
    symlinkHits.push(relativePath);
    continue;
  }
  const contents = readText(path);
  if (privatePathPattern.test(contents)) privatePathHits.push(relativePath);
  if (
    relativePath !== "integrations/framecore-workspace.md" &&
    internalRolePattern.test(contents)
  ) {
    internalRoleHits.push(relativePath);
  }
}
record("public_text_private_paths", privatePathHits.length === 0, privatePathHits.join(", "));
record("public_text_internal_role", internalRoleHits.length === 0, internalRoleHits.join(", "));
record("public_text_symlinks", symlinkHits.length === 0, symlinkHits.join(", "));

const failed = checks.filter(({ ok }) => !ok);
console.log(
  JSON.stringify(
    {
      status: failed.length === 0 ? "pass" : "fail",
      suite: "release-readiness",
      version: packageJson?.version ?? null,
      total: checks.length,
      passed: checks.length - failed.length,
      failed: failed.length,
      errors: failed.map(({ name, detail }) => `${name}: ${detail}`),
    },
    null,
    2,
  ),
);

if (failed.length > 0) process.exitCode = 1;
