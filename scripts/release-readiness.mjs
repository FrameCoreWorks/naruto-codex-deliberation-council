#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const releaseVersion = "1.0.1";
const repositoryUrl = "https://github.com/FrameCoreWorks/naruto-codex-deliberation-council";
const historicalCiUrls = [
  `${repositoryUrl}/actions/runs/29687294043`,
  `${repositoryUrl}/actions/runs/29687369374`,
];
const checks = [];

function record(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

function readText(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

function parseJson(relativePath) {
  try {
    return JSON.parse(readText(relativePath));
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
const migrationInventory = parseJson("scripts/fixtures/install-0.4.0-inventory.json");
const readme = readText("README.md");
const benchmarkPlan = readText("docs/benchmark-plan.md");
const compatibility = readText("docs/compatibility.md");
const releaseAcceptance = readText(`docs/release-acceptance-v${releaseVersion}.md`);
const historicalAcceptance = readText("docs/release-acceptance-v1.0.0.md");
const historicalReleaseNotes = readText("docs/releases/v1.0.0.md");
const releaseNotes = readText(`docs/releases/v${releaseVersion}.md`);
const notice = readText("NOTICE.md");
const security = readText("SECURITY.md");
const bannerRelativePath = "assets/naruto-codex-deliberation-council-banner.png";
const bannerPath = join(repoRoot, bannerRelativePath);

record(
  "package_identity",
  packageJson?.name === "naruto-codex-deliberation-council" &&
    manifest?.package_name === packageJson?.name,
  `${packageJson?.name ?? "missing"}/${manifest?.package_name ?? "missing"}`,
);
record("package_version", packageJson?.version === releaseVersion, packageJson?.version ?? "missing");
record("package_private", packageJson?.private === true, "package must not be published to npm");
record("package_node", packageJson?.engines?.node === ">=22", packageJson?.engines?.node ?? "missing");
record("manifest_version", manifest?.package_version === releaseVersion, manifest?.package_version ?? "missing");
record("manifest_stable", manifest?.release?.status === "stable", manifest?.release?.status ?? "missing");
record(
  "manifest_contract",
  manifest?.release?.contract_version === releaseVersion,
  manifest?.release?.contract_version ?? "missing",
);
record("manifest_node", manifest?.release?.node_minimum_major === 22, String(manifest?.release?.node_minimum_major));
record(
  "manifest_ci_matrix",
  JSON.stringify(manifest?.release?.ci_node_majors) === JSON.stringify([22, 24]),
  JSON.stringify(manifest?.release?.ci_node_majors),
);
record(
  "manifest_acceptance_boundary",
  manifest?.release?.runtime_capability_policy === "fail_closed" &&
    manifest?.release?.static_package_acceptance === "pass_required" &&
    manifest?.release?.target_host_runtime_acceptance === "not_proven_until_live_evidence" &&
    manifest?.release?.host_orchestration_adapter_bundled === false &&
    manifest?.release?.host_event_log_bundled === false &&
    manifest?.release?.live_host_acceptance_report_bundled === false &&
    manifest?.release?.method_output_diversity === "not_measured" &&
    manifest?.release?.behavioral_quality_lift === "not_measured" &&
    manifest?.release?.runtime_cost_latency === "not_benchmarked" &&
    manifest?.release?.benchmark_plan === "docs/benchmark-plan.md" &&
    manifest?.release?.fan_art_rights_clearance === "not_cleared",
  JSON.stringify(manifest?.release),
);
record(
  "manifest_parent_identity",
  manifest?.public_parent_role_id === "hokage" &&
    manifest?.public_parent_identity_id === "tsunade_senju" &&
    manifest?.parent_role_profile_bundled === false,
  `${manifest?.public_parent_role_id ?? "missing"}/${manifest?.public_parent_identity_id ?? "missing"}`,
);
record(
  "manifest_distribution",
  manifest?.distribution?.github_source_ready === true &&
    manifest?.distribution?.repository_visibility === "public" &&
    manifest?.distribution?.repository_url === repositoryUrl &&
    manifest?.distribution?.first_published_release_url === `${repositoryUrl}/releases/tag/v1.0.0` &&
    manifest?.distribution?.remote_included === false &&
    manifest?.distribution?.remote_meaning === "no_remote_configuration_or_push_automation",
  JSON.stringify(manifest?.distribution),
);
record(
  "manifest_runtime_preflight",
  manifest?.runtime_preflight?.trusted_project_required === true &&
    manifest?.runtime_preflight?.exact_runtime_profile_count === 6 &&
    manifest?.runtime_preflight?.peak_child_capacity_required === 6 &&
    manifest?.runtime_preflight?.profile_permission_defaults?.sandbox_mode === "read-only" &&
    manifest?.runtime_preflight?.profile_permission_defaults?.approval_policy === "never" &&
    manifest?.runtime_preflight?.effective_permissions_must_be_verified === true &&
    manifest?.runtime_preflight?.fresh_child_context_required === true &&
    manifest?.runtime_preflight?.spawn_all_candidates_before_wait === true &&
    manifest?.runtime_preflight?.same_target_followup_receipt_required === true &&
    manifest?.runtime_preflight?.opaque_runtime_handle_hash_forbidden === true &&
    manifest?.runtime_preflight?.unavailable_policy === "blocked",
  JSON.stringify(manifest?.runtime_preflight),
);
record(
  "manifest_validation_surface",
  manifest?.validation_surfaces?.repository_self_check ===
      ".agents/skills/naruto/scripts/validate-naruto.mjs" &&
    !("recorded_run_bundle" in (manifest?.validation_surfaces ?? {})),
  JSON.stringify(manifest?.validation_surfaces),
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
  JSON.stringify(manifest?.migration?.supported_in_place_from) === JSON.stringify(["0.4.x"]) &&
    manifest?.migration?.historical_test_fixture ===
      "scripts/fixtures/install-0.4.0-inventory.json" &&
    manifest?.migration?.historical_test_source_version === "0.4.0" &&
    manifest?.migration?.historical_test_source_commit === "42cab91",
  JSON.stringify(manifest?.migration),
);

const migrationEntries = Array.isArray(migrationInventory?.entries)
  ? migrationInventory.entries
  : [];
const migrationPaths = migrationEntries.map(({ path }) => path);
const expectedMigrationPaths = [
  ...listFiles(join(repoRoot, ".agents/skills/naruto")).map(
    (path) => `.agents/skills/naruto/${path.split(sep).join("/")}`,
  ),
  ...(manifest?.required_profiles ?? []).map((profile) => `.codex/agents/${profile}`),
].sort();
const migrationDigestPattern = /^[a-f0-9]{64}$/;
const migrationEntryErrors = [];
let historicalOverwriteCount = 0;
let historicalUnchangedCount = 0;
for (const entry of migrationEntries) {
  if (
    typeof entry?.path !== "string" ||
    !migrationDigestPattern.test(entry?.historical_sha256 ?? "") ||
    !migrationDigestPattern.test(entry?.target_sha256 ?? "")
  ) {
    migrationEntryErrors.push(`invalid entry: ${JSON.stringify(entry)}`);
    continue;
  }
  const path = join(repoRoot, ...entry.path.split("/"));
  if (!existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) {
    migrationEntryErrors.push(`missing, non-file, or symlink target: ${entry.path}`);
    continue;
  }
  const actualDigest = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (actualDigest !== entry.target_sha256) {
    migrationEntryErrors.push(`stale target digest: ${entry.path}`);
  }
  if (entry.historical_sha256 === entry.target_sha256) historicalUnchangedCount += 1;
  else historicalOverwriteCount += 1;
}
record(
  "historical_migration_fixture",
  migrationInventory?.schema === "naruto_installer_historical_inventory.v1" &&
    migrationInventory?.source_commit === "42cab91" &&
    migrationInventory?.source_version === "0.4.0" &&
    migrationInventory?.target_version === releaseVersion &&
    migrationEntries.length === 33 &&
    new Set(migrationPaths).size === migrationEntries.length &&
    JSON.stringify([...migrationPaths].sort()) === JSON.stringify(expectedMigrationPaths) &&
    migrationInventory?.expected_counts?.create === 0 &&
    migrationInventory?.expected_counts?.overwrite === historicalOverwriteCount &&
    migrationInventory?.expected_counts?.unchanged === historicalUnchangedCount &&
    historicalOverwriteCount === 23 &&
    historicalUnchangedCount === 10 &&
    migrationEntryErrors.length === 0,
  migrationEntryErrors.join(", ") || JSON.stringify(migrationInventory?.expected_counts),
);

const requiredFiles = [
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/dependabot.yml",
  ".github/pull_request_template.md",
  ".github/workflows/ci.yml",
  "CHANGELOG.md",
  "LICENSE",
  "NOTICE.md",
  "README.md",
  "SECURITY.md",
  bannerRelativePath,
  "docs/benchmark-plan.md",
  "docs/compatibility.md",
  "docs/naming-risk.md",
  "docs/release-acceptance-v1.0.0.md",
  `docs/release-acceptance-v${releaseVersion}.md`,
  "docs/releases/v1.0.0.md",
  `docs/releases/v${releaseVersion}.md`,
  "manifest/assets.json",
  "manifest/package-manifest.json",
  "scripts/fixtures/install-0.4.0-inventory.json",
  "scripts/test-install-lifecycle.mjs",
  "scripts/test-install-security.mjs",
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
  "readme_quick_start",
  readme.indexOf("## Quick Start") > 0 &&
    readme.indexOf("## Quick Start") < readme.indexOf("## The Training Arc Behind The Protocol") &&
    readme.includes(`git clone --branch v${releaseVersion} --depth 1`) &&
    readme.indexOf("Before running repository JavaScript") > readme.indexOf("## Quick Start") &&
    readme.indexOf("Before running repository JavaScript") <
      readme.indexOf("npm run checksums:check") &&
    readme.indexOf("npm run checksums:check") < readme.indexOf("npm test"),
  "README must put source inspection before pinned-tag repository script execution",
);
record(
  "readme_release_contract",
  readme.includes(`Package contract | \`${releaseVersion}\``) &&
    readme.includes(`docs/release-acceptance-v${releaseVersion}.md`),
  "README must identify the current contract and acceptance record",
);
record(
  "readme_claim_boundary",
  readme.includes("Target-host discovery and same-thread revision") &&
    readme.includes("`NOT PROVEN`") &&
    readme.includes("Host orchestration adapter and event log") &&
    readme.includes("`NOT BUNDLED`") &&
    readme.includes("Method diversity and quality lift") &&
    readme.includes("`NOT MEASURED`") &&
    readme.includes("Fan-art and franchise rights") &&
    readme.includes("`NOT CLEARED`") &&
    readme.includes("repository self-check") &&
    /not a (?:complete parser|recorded host execution|real hosted deliberation)/i.test(readme),
  "README must distinguish static validation, live host proof, and rights status",
);
record(
  "readme_behavioral_evidence_boundary",
  readme.includes("docs/benchmark-plan.md") &&
    /does not claim superiority over either baseline/i.test(readme) &&
    /host orchestration adapter[\s\S]{0,100}`NOT BUNDLED`/i.test(readme) &&
    /method diversity and quality lift[\s\S]{0,100}`NOT MEASURED`/i.test(readme) &&
    /runtime cost and latency[\s\S]{0,100}`NOT BENCHMARKED`/i.test(readme),
  "README must disclose unbundled host orchestration and unmeasured behavioral claims",
);
record(
  "readme_parent_identity",
  readme.includes("Tsunade Senju, Fifth Hokage") && readme.includes("not a seventh child profile"),
  "Tsunade must remain the parent-process identity",
);
record(
  "readme_host_final_qa",
  /final_qa[^\n]{0,100}reviewer/i.test(readme) && /not bundled/i.test(readme),
  "README must disclose the conditional host-provided final QA role",
);
record(
  "readme_fan_art_scope",
  /unofficial fan art/i.test(readme) && /excluded\s+from (?:that|the MIT) license/i.test(readme),
  "README must disclose the banner's separate rights scope",
);

const evidenceDocuments = [readme, compatibility, historicalAcceptance];
record(
  "historical_publication_evidence",
  evidenceDocuments.every((document) => historicalCiUrls.every((url) => document.includes(url))) &&
    [compatibility, historicalAcceptance].every((document) =>
      document.includes(`${repositoryUrl}/releases/tag/v1.0.0`),
    ),
  "README, compatibility, and corrected v1.0.0 acceptance must cite the public release and both CI runs",
);
record(
  "current_acceptance_boundary",
  releaseAcceptance.includes("`PASS BEFORE RELEASE`") &&
    releaseAcceptance.includes("`NOT PROVEN BY PACKAGE`") &&
    releaseAcceptance.includes("`NOT BUNDLED`") &&
    releaseAcceptance.includes("`NOT MEASURED`") &&
    releaseAcceptance.includes("`NOT BENCHMARKED`") &&
    releaseAcceptance.includes("`NOT CLEARED`") &&
    releaseAcceptance.includes("deferred to `1.1.0`") &&
    /does not\s+claim rollback or uninstall/i.test(releaseAcceptance),
  "v1.0.1 acceptance must state its package, host, rights, and deferred-feature boundaries",
);
record(
  "benchmark_plan_contract",
  benchmarkPlan.includes("Status: design only") &&
    benchmarkPlan.includes("Single-agent one-pass") &&
    benchmarkPlan.includes("Single-agent planner-critic") &&
    benchmarkPlan.includes("Council") &&
    benchmarkPlan.includes("budget-normalized comparison") &&
    benchmarkPlan.includes("Output redundancy") &&
    benchmarkPlan.includes("Evidence independence") &&
    benchmarkPlan.includes("host-acceptance.json") &&
    benchmarkPlan.includes("execution-events.jsonl") &&
    benchmarkPlan.includes("behavioral_quality_lift: NOT_MEASURED") &&
    benchmarkPlan.includes("runtime_cost_latency: NOT_BENCHMARKED"),
  "benchmark plan must define baselines, controls, measures, host evidence, and no-result statuses",
);
record(
  "installer_hardening_documented",
  readme.includes("descriptor-verified source snapshots") &&
    readme.includes("private verified validator copy") &&
    readme.includes("`42cab91`") &&
    readme.includes("portable `openat` API") &&
    releaseAcceptance.includes("private verified validator snapshot") &&
    releaseAcceptance.includes("0 creates, 23 overwrites, and 10 unchanged") &&
    releaseNotes.includes("private verified validator copy") &&
    security.includes("descriptor-verified source bytes") &&
    /outside the supported\s+trust boundary/i.test(security),
  "installer snapshot, migration, hard-link, and residual ancestor-swap boundaries must be documented",
);
record(
  "release_notes_scope",
  releaseNotes.includes("# Naruto Codex Deliberation Council 1.0.1") &&
    /package self-check, not[\s\S]{0,120}arbitrary live run/i.test(releaseNotes) &&
    !releaseNotes.includes("validate-run-bundle"),
  "v1.0.1 notes must describe the release without claiming a live-run validator",
);
record(
  "historical_release_links",
  !historicalReleaseNotes.includes("](../") &&
    historicalReleaseNotes.includes(`${repositoryUrl}/blob/v1.0.0/`),
  "v1.0.0 notes must use tag-pinned links that render from the GitHub release page",
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
    assetRecord?.qa?.status === "accepted_with_known_deviation" &&
    assetRecord?.qa?.exact_spaced_title_compliance === false &&
    assetRecord?.distribution?.delivery_status === "public_github_repository" &&
    assetRecord?.distribution?.repository_url === repositoryUrl &&
    assetRecord?.distribution?.license_scope === "unofficial_fan_art_excluded_from_mit" &&
    assetRecord?.distribution?.rights_clearance === "not_cleared" &&
    assetRecord?.distribution?.affiliation_claimed === false,
  JSON.stringify(assetRecord),
);
record(
  "notice_rights_boundary",
  /unofficial fan art/i.test(notice) &&
    /excluded from the\s+MIT License/i.test(notice) &&
    /No copyright, trademark, publicity-rights, or other rights clearance has been/i.test(notice),
  "NOTICE must distinguish original MIT-licensed material from third-party rights",
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
  record("banner_dimensions", width === 1942 && height === 809, `${width}x${height}`);
  record("banner_ratio", Math.abs(ratio - 2.4) <= 0.03, ratio.toFixed(4));
} else {
  record("banner_png", false, "banner missing");
  record("banner_dimensions", false, "banner missing");
  record("banner_ratio", false, "banner missing");
}

const ci = readText(".github/workflows/ci.yml");
record(
  "ci_platform_matrix",
  ci.includes("os: ubuntu-latest") &&
    ci.includes("os: macos-latest") &&
    ci.includes("os: windows-latest") &&
    (ci.match(/node: 22/g) ?? []).length >= 1 &&
    (ci.match(/node: 24/g) ?? []).length >= 3,
  "CI must cover Ubuntu Node 22/24 plus macOS and Windows Node 24",
);
record(
  "ci_action_pins",
  ci.includes("actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0") &&
    ci.includes("actions/setup-node@820762786026740c76f36085b0efc47a31fe5020") &&
    ci.includes("persist-credentials: false"),
  "GitHub Actions must use reviewed full-SHA pins without persisted credentials",
);
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

const publicFiles = listFiles(repoRoot);
const publicTextFiles = publicFiles.filter((path) => {
  if (path === "SHA256SUMS") return false;
  return new Set(["", ".json", ".md", ".mjs", ".toml", ".yaml", ".yml"]).has(
    extname(path).toLowerCase(),
  );
});
const privatePathPattern = /(?:^|[\s("'`])\/(?:Users|Volumes)\/[A-Za-z0-9._~+/@ -]+/m;
const internalRolePattern = new RegExp(
  ["\\bOs", "kar\\b|\\bHip", "son\\b|\\bEr", "yk\\b|\\bOl", "ga\\b"].join(""),
  "i",
);
const staleClaimPattern = /no hosted run is claimed|external publication:\s*not run by design|local_repository_only/i;
const privatePathHits = [];
const internalRoleHits = [];
const staleClaimHits = [];
const symlinkHits = [];
const runBundleClaimHits = [];
for (const relativePath of publicTextFiles) {
  const path = join(repoRoot, ...relativePath.split(sep));
  if (lstatSync(path).isSymbolicLink()) {
    symlinkHits.push(relativePath);
    continue;
  }
  const contents = readFileSync(path, "utf8");
  if (privatePathPattern.test(contents)) privatePathHits.push(relativePath);
  if (relativePath !== "integrations/framecore-workspace.md" && internalRolePattern.test(contents)) {
    internalRoleHits.push(relativePath);
  }
  if (relativePath !== "scripts/release-readiness.mjs" && staleClaimPattern.test(contents)) {
    staleClaimHits.push(relativePath);
  }
  if (
    relativePath !== "scripts/release-readiness.mjs" &&
    /validate-run-bundle|recorded[_ -]run[_ -]bundle/i.test(contents)
  ) {
    runBundleClaimHits.push(relativePath);
  }
}
record("public_text_private_paths", privatePathHits.length === 0, privatePathHits.join(", "));
record("public_text_internal_role", internalRoleHits.length === 0, internalRoleHits.join(", "));
record("public_text_stale_claims", staleClaimHits.length === 0, staleClaimHits.join(", "));
record("public_text_symlinks", symlinkHits.length === 0, symlinkHits.join(", "));
record(
  "deferred_run_bundle_surface",
  runBundleClaimHits.length === 0 &&
    !existsSync(join(repoRoot, ".agents/skills/naruto/scripts/validate-run-bundle.mjs")),
  runBundleClaimHits.join(", "),
);

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
