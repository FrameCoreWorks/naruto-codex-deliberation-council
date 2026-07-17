#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillRoot = resolve(scriptDir, "..");
const workspaceRoot = resolve(skillRoot, "../../..");
const errors = [];
const checks = [];

const expectedAgents = [
  {
    card: "naruto-uzumaki.yaml",
    runtime: "naruto_uzumaki",
    contracts: ["naruto_candidate.v1", "naruto_integrative_method.v1", "naruto_experience_transfer.v1"],
  },
  {
    card: "sasuke-uchiha.yaml",
    runtime: "sasuke_uchiha",
    contracts: ["naruto_candidate.v1", "naruto_adversarial_method.v1", "naruto_experience_transfer.v1"],
  },
  {
    card: "shikamaru-nara.yaml",
    runtime: "shikamaru_nara",
    contracts: ["naruto_candidate.v1", "naruto_systems_method.v1", "naruto_experience_transfer.v1"],
  },
  {
    card: "sakura-haruno.yaml",
    runtime: "sakura_haruno",
    contracts: ["naruto_candidate.v1", "naruto_empirical_method.v1", "naruto_experience_transfer.v1"],
  },
  {
    card: "kakashi-hatake.yaml",
    runtime: "kakashi_hatake",
    contracts: ["naruto_moderator.v1", "naruto_commit_barrier.v1", "naruto_phase_integrity.v1", "naruto_groupthink_audit.v1"],
  },
];

const requiredSkillFiles = [
  "SKILL.md",
  "agent_manifest.json",
  "agents/openai.yaml",
  ...expectedAgents.map(({ card }) => `agents/${card}`),
  "references/deliberation-protocol.md",
  "references/contracts-and-schemas.md",
  "references/role-methods.md",
  "references/examples-and-failure-modes.md",
  "references/prior-art-assimilation.md",
  "templates/source-packet.md",
  "templates/candidate-solution.md",
  "templates/reveal-transfer.md",
  "templates/revision.md",
  "templates/consensus-report.md",
  "templates/protocol-run-manifest.md",
  "fixtures/naruto-fixtures.json",
  "scripts/validate-naruto.mjs",
];

function record(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  if (!ok) errors.push(`${name}: ${detail}`);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function parseJson(path) {
  try {
    return JSON.parse(read(path));
  } catch (error) {
    record(`parse_json:${path}`, false, error.message);
    return null;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unquote(value) {
  const trimmed = String(value ?? "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function yamlScalar(text, key) {
  const match = text.match(new RegExp(`^${escapeRegExp(key)}:\\s*(.+)$`, "m"));
  return match ? unquote(match[1]) : undefined;
}

function yamlList(text, key) {
  const match = text.match(
    new RegExp(`^${escapeRegExp(key)}:\\s*\\n((?:[ \\t]+-[^\\n]*(?:\\n|$))+)`, "m"),
  );
  if (!match) return [];
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.match(/^\s+-\s*(.+)$/)?.[1])
    .filter(Boolean)
    .map(unquote);
}

function tomlString(text, key) {
  return text.match(new RegExp(`^${escapeRegExp(key)}\\s*=\\s*"([^"]*)"`, "m"))?.[1];
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return typeof value === "string" ? value.replace(/\r\n?/g, "\n") : value;
}

function sha256(value) {
  const bytes = Buffer.isBuffer(value)
    ? value
    : typeof value === "string"
      ? value
      : JSON.stringify(canonicalize(value));
  return createHash("sha256").update(bytes, "utf8").digest("hex");
}

function matchesExactTrigger(message) {
  const text = String(message ?? "").replace(/\r\n?/g, "\n").trimStart();
  if (
    !text ||
    text.startsWith("`") ||
    text.startsWith(">") ||
    text.startsWith("- ") ||
    text.startsWith("* ")
  ) {
    return false;
  }
  const match = text.match(/^(\S+)(?:\s+([\s\S]+))?$/);
  return Boolean(match && match[1] === "$naruto" && match[2]?.trim());
}

function portablePath(path) {
  return path.split(sep).join("/");
}

function listFiles(directory, base = "", options = {}) {
  if (!existsSync(directory)) return [];
  const files = [];
  const ignoredDirectories = new Set(options.ignoredDirectories ?? []);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = join(directory, entry.name);
    const relativePath = base ? join(base, entry.name) : entry.name;
    if (entry.isDirectory()) files.push(...listFiles(fullPath, relativePath, options));
    if (entry.isFile()) files.push(portablePath(relativePath));
  }
  return files.sort();
}

function protocolResult(fixture) {
  if (
    fixture.protected_action_without_normal_gate === true ||
    fixture.barrier !== "pass" ||
    fixture.moderator !== "available" ||
    fixture.valid_commits < 3 ||
    fixture.valid_same_thread_revisions < 3
  ) {
    return "blocked";
  }
  if (fixture.critical_objection === "evidence_backed_unresolved") {
    return "structured_dispute";
  }
  if (
    fixture.valid_commits === 4 &&
    fixture.valid_same_thread_revisions === 4 &&
    fixture.evidence === "complete"
  ) {
    return "verified_consensus";
  }
  return "provisional_consensus";
}

function decideLoopFixture(fixture) {
  if (fixture.user_input_required === true) return "ask_user";
  if (fixture.automatic_second_panel_requested === true) return "blocked";
  if (fixture.required_failures === 0 && fixture.regression_clean === true) {
    return "stop_sufficient";
  }
  if (
    fixture.required_failures === 1 &&
    fixture.root_cause_known === true &&
    fixture.bounded_repair_available === true &&
    fixture.regression_clean === true &&
    fixture.iteration_count < fixture.max_iterations
  ) {
    return "patch_one_gap";
  }
  return "blocked";
}

function classifyIntegrityFixture(fixture) {
  const usableCandidates = Math.min(
    fixture.valid_candidates ?? 0,
    fixture.pre_reveal_self_audits ?? 0,
    fixture.same_thread_proofs ?? 0,
    fixture.experience_transfer_ledgers ?? 0,
  );
  if (
    fixture.barrier !== "pass" ||
    fixture.reveal_byte_identical !== true ||
    fixture.same_thread_proofs < 3 ||
    fixture.experience_transfer_ledgers < 3 ||
    fixture.anti_groupthink_audit !== "pass" ||
    (fixture.consequential === true && fixture.olga_qa !== "pass_reproducible")
  ) {
    return "blocked";
  }
  if (
    fixture.critical_minority === "evidence_backed_unresolved" ||
    fixture.critical_minority === "lost"
  ) {
    return "structured_dispute";
  }
  if (usableCandidates < 3) return "blocked";
  if (
    usableCandidates < 4 ||
    fixture.critical_shared_lineage_only === true ||
    fixture.quick_surrender_unresolved === true ||
    (fixture.oskar_unverified_critical_or_major_claims ?? 0) > 0 ||
    fixture.evidence !== "complete_independent"
  ) {
    return "provisional_consensus";
  }
  return "verified_consensus";
}

const packageJsonPath = join(workspaceRoot, "package.json");
const packageJson = existsSync(packageJsonPath) ? parseJson(packageJsonPath) : null;
const packageMode = packageJson?.name === "codex-deliberation-council";

const profileRootCandidates = packageMode
  ? [join(workspaceRoot, ".codex/agents")]
  : [
      join(workspaceRoot, ".codex/agents"),
      process.env.CODEX_HOME ? join(resolve(process.env.CODEX_HOME), "agents") : null,
      join(homedir(), ".codex/agents"),
    ].filter(Boolean);
const uniqueProfileRoots = [...new Set(profileRootCandidates)];
const profileRoot = packageMode
  ? join(workspaceRoot, ".codex/agents")
  : uniqueProfileRoots.find((root) =>
      expectedAgents.every(({ runtime }) => existsSync(join(root, `${runtime}.toml`))),
    );
const profileSetComplete =
  Boolean(profileRoot) &&
  expectedAgents.every(({ runtime }) => existsSync(join(profileRoot, `${runtime}.toml`)));

record(
  "profile_root_available",
  profileSetComplete,
  `five profiles were not found together in: ${uniqueProfileRoots.join(", ")}`,
);

for (const file of requiredSkillFiles) {
  record(`required_file:${file}`, existsSync(join(skillRoot, file)), "missing required skill file");
}

const skillText = read(join(skillRoot, "SKILL.md"));
const frontmatter = skillText.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
const frontmatterKeys = frontmatter
  .split("\n")
  .map((line) => line.match(/^([a-zA-Z0-9_-]+):/)?.[1])
  .filter(Boolean)
  .sort();

record(
  "skill_frontmatter_keys",
  JSON.stringify(frontmatterKeys) === JSON.stringify(["description", "name"]),
  "SKILL.md frontmatter must contain only name and description",
);
record("skill_frontmatter_name", /^name:\s*naruto$/m.test(frontmatter), "skill name must be naruto");
record("skill_frontmatter_description", /^description:\s*\S.+$/m.test(frontmatter), "description missing");
record("skill_under_500_lines", skillText.split(/\r?\n/).length < 500, "SKILL.md is too long");
record("skill_no_todo", !/\bTODO\b|\[TODO/i.test(skillText), "SKILL.md contains a placeholder");
record(
  "skill_exact_trigger",
  skillText.includes("first non-empty token is exactly `$naruto`"),
  "exact first-token rule missing",
);
record(
  "skill_no_implicit",
  skillText.includes("never invoke implicitly") && skillText.includes("Never\nactivate from prior turns"),
  "implicit invocation guard missing",
);
record(
  "skill_one_revision",
  skillText.includes("only one reveal/revision cycle"),
  "single-cycle stop rule missing",
);
record(
  "skill_oskar_owner",
  skillText.includes("Oskar remains the only workflow orchestrator"),
  "Oskar ownership missing",
);
record(
  "skill_no_permissions",
  skillText.includes("`$naruto` grants no provider activation"),
  "permission non-inheritance missing",
);
record(
  "skill_no_generic_fallback",
  skillText.includes("Never replace a failed dedicated candidate with a generic worker"),
  "dedicated-agent fallback guard missing",
);
record(
  "skill_learning_invariant",
  skillText.includes("## Core Learning Invariant") &&
    skillText.includes("same complete task") &&
    skillText.includes("original agent thread"),
  "same-task learning invariant missing",
);
record("skill_loop_fit", skillText.includes("`loop_control_fit`"), "Loop Protocol gate missing");
record("skill_loop_budget", skillText.includes("`max_iterations: 1`"), "bounded optimizer budget missing");
record(
  "skill_loop_mapping",
  skillText.includes("| critique | one byte-identical reveal packet") &&
    skillText.includes("| repair | one complete revision"),
  "Loop Protocol phase mapping missing",
);
record(
  "skill_no_second_panel",
  skillText.includes("Do not automatically launch a second Naruto run"),
  "automatic second panel guard missing",
);
record(
  "skill_phase_integrity",
  skillText.includes("`protocol_run_manifest.v1`") && skillText.includes("opaque runtime handle"),
  "phase-integrity manifest or opaque handle rule missing",
);
record(
  "skill_evidence_independence",
  skillText.includes("`independence_key`") && skillText.includes("count never increases evidence independence"),
  "evidence-independence rule missing",
);
record(
  "skill_experience_transfer",
  skillText.includes("`experience_transfer`") && skillText.includes("same-thread proofs"),
  "experience-transfer or same-thread proof rule missing",
);
record(
  "skill_groupthink",
  skillText.includes("quick surrender") && skillText.includes("unsupported dissent"),
  "anti-groupthink balance missing",
);
record(
  "skill_synthesis_provenance",
  skillText.includes("synthesis provenance") && skillText.includes("reproducible next check"),
  "synthesis provenance or reproducible QA rule missing",
);

const openaiText = read(join(skillRoot, "agents/openai.yaml"));
const defaultPrompt = openaiText.match(/^\s*default_prompt:\s*"([^"]+)"/m)?.[1];
const shortDescription = openaiText.match(/^\s*short_description:\s*"([^"]+)"/m)?.[1] ?? "";
record("openai_display_name", /display_name:\s*"[^"]+"/.test(openaiText), "display_name missing");
record(
  "openai_short_description_length",
  shortDescription.length >= 25 && shortDescription.length <= 80,
  "short_description must be 25-80 characters",
);
record(
  "openai_implicit_false",
  /^\s*allow_implicit_invocation:\s*false\s*$/m.test(openaiText),
  "allow_implicit_invocation must be false",
);
record(
  "openai_prompt_trigger",
  defaultPrompt?.startsWith("$naruto ") === true,
  "default_prompt must start with exact trigger",
);

const manifest = parseJson(join(skillRoot, "agent_manifest.json"));
record("manifest_agent_count", manifest?.agents?.length === 5, "manifest must contain five agents");
record("manifest_owner_oskar", manifest?.owner_runtime_id === "oskar", "Oskar must remain owner");
record("manifest_qa_olga", manifest?.qa_runtime_id === "olga", "Olga must remain QA owner");
record("manifest_trigger", manifest?.activation?.token === "$naruto", "manifest trigger mismatch");
record("manifest_trigger_case", manifest?.activation?.case_sensitive === true, "trigger must be case-sensitive");
record(
  "manifest_no_implicit",
  manifest?.activation?.allow_implicit_invocation === false,
  "manifest must reject implicit invocation",
);
record("manifest_single_cycle", manifest?.moderation?.reveal_cycles === 1, "one reveal cycle required");
record(
  "manifest_same_thread_revision",
  manifest?.moderation?.same_thread_revision_required === true,
  "same-thread revision must be required",
);
record(
  "manifest_no_majority",
  manifest?.moderation?.majority_is_authority === false,
  "majority cannot be authority",
);
record("manifest_loop_protocol", manifest?.loop_control?.protocol === "loop_control.v1", "Loop Protocol binding missing");
record("manifest_loop_gate", manifest?.loop_control?.gate === "loop_control_fit", "loop_control_fit gate missing");
record("manifest_loop_budget", manifest?.loop_control?.max_optimizer_iterations === 1, "optimizer budget must be one");
record("manifest_no_second_panel", manifest?.loop_control?.automatic_second_panel_run === false, "automatic second panel must be false");
record(
  "manifest_loop_checks",
  manifest?.loop_control?.acceptance_matrix_required === true &&
    manifest?.loop_control?.regression_check_required === true,
  "acceptance or regression requirement missing",
);
record(
  "manifest_integrity_contract",
  manifest?.moderation?.same_thread_handle_hash_required === true &&
    manifest?.moderation?.byte_identical_reveal_required === true &&
    manifest?.moderation?.experience_transfer_required === true,
  "same-thread, reveal, or experience-transfer requirement missing",
);
record(
  "manifest_epistemic_contract",
  manifest?.moderation?.evidence_independence_required === true &&
    manifest?.moderation?.anti_groupthink_audit_required === true,
  "evidence independence or anti-groupthink audit missing",
);

for (const expected of expectedAgents) {
  const cardPath = join(skillRoot, "agents", expected.card);
  const cardText = read(cardPath);
  const manifestAgent = manifest?.agents?.find((agent) => agent.runtime_id === expected.runtime);
  const cardContracts = yamlList(cardText, "behavior_contract_ids").sort();
  const canonicalContracts = [...expected.contracts].sort();

  record(`agent_manifest:${expected.runtime}`, Boolean(manifestAgent), "runtime missing from manifest");
  record(
    `agent_manifest_contracts:${expected.runtime}`,
    JSON.stringify([...(manifestAgent?.behavior_contract_ids ?? [])].sort()) ===
      JSON.stringify(canonicalContracts),
    "manifest behavior contracts mismatch",
  );
  record(
    `agent_card_runtime:${expected.runtime}`,
    yamlScalar(cardText, "runtime_id") === expected.runtime,
    "card runtime_id mismatch",
  );
  record(
    `agent_card_contracts:${expected.runtime}`,
    JSON.stringify(cardContracts) === JSON.stringify(canonicalContracts),
    "card behavior contracts mismatch",
  );
  record(
    `agent_card_read_only_boundary:${expected.runtime}`,
    cardText.includes("write files") && cardText.includes("execute providers") && cardText.includes("upload"),
    "card protected-action boundary missing",
  );

  const runtimePath = profileRoot ? join(profileRoot, `${expected.runtime}.toml`) : "";
  const runtimeText = runtimePath && existsSync(runtimePath) ? read(runtimePath) : "";
  const runtimeContracts =
    runtimeText
      .match(/^Behavior contract IDs:\s*([^\n]+)$/m)?.[1]
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .sort() ?? [];

  record(`agent_runtime_exists:${expected.runtime}`, Boolean(runtimeText), "runtime profile missing");
  record(
    `agent_runtime_name:${expected.runtime}`,
    tomlString(runtimeText, "name") === expected.runtime,
    "runtime name mismatch",
  );
  record(
    `agent_runtime_description:${expected.runtime}`,
    Boolean(tomlString(runtimeText, "description")),
    "runtime description missing",
  );
  record(
    `agent_runtime_instructions:${expected.runtime}`,
    /developer_instructions\s*=\s*"""[\s\S]+"""/.test(runtimeText),
    "developer_instructions missing",
  );
  record(
    `agent_runtime_read_only:${expected.runtime}`,
    /^sandbox_mode\s*=\s*"read-only"$/m.test(runtimeText),
    "runtime must be read-only",
  );
  record(
    `agent_runtime_contracts:${expected.runtime}`,
    JSON.stringify(runtimeContracts) === JSON.stringify(canonicalContracts),
    "runtime behavior contracts mismatch",
  );
  record(
    `agent_runtime_forbidden_actions:${expected.runtime}`,
    runtimeText.includes("Do not spawn agents, edit files, call providers/APIs/MCP, upload, push, install, delete"),
    "runtime protected-action boundary missing",
  );
  if (expected.runtime === "kakashi_hatake") {
    record(
      "agent_card_moderator_integrity",
      cardText.includes("protocol_run_manifest.v1") &&
        cardText.includes("anti-groupthink") &&
        cardText.includes("experience-transfer"),
      "Kakashi card lacks integrity ownership",
    );
    record(
      "agent_runtime_moderator_integrity",
      runtimeText.includes("protocol_run_manifest.v1") &&
        runtimeText.includes("evidence-independence") &&
        runtimeText.includes("matching thread-handle hashes"),
      "Kakashi runtime lacks integrity enforcement",
    );
  } else {
    record(
      `agent_card_candidate_learning:${expected.runtime}`,
      cardText.includes("pre-reveal self-audit") &&
        cardText.includes("experience-transfer ledger") &&
        cardText.includes("opaque handle hashes"),
      "candidate card lacks self-audit or experience transfer",
    );
    record(
      `agent_runtime_candidate_learning:${expected.runtime}`,
      runtimeText.includes("pre-reveal self-audit") &&
        runtimeText.includes("experience-transfer claim map") &&
        runtimeText.includes("opaque thread-handle hashes"),
      "candidate runtime lacks self-audit or experience transfer",
    );
  }
}

const fixtures = parseJson(join(skillRoot, "fixtures/naruto-fixtures.json"));
for (const fixture of fixtures?.trigger_cases ?? []) {
  record(
    `trigger_fixture:${fixture.id}`,
    matchesExactTrigger(fixture.message) === fixture.expected,
    `expected ${fixture.expected}`,
  );
}

const requiredProtocolCases = new Set([
  "full-verified",
  "three-candidate-degraded",
  "two-candidate-blocked",
  "hash-mismatch-degrades",
  "early-reveal-blocked",
  "same-thread-unavailable",
  "moderator-unavailable",
  "critical-minority-unresolved",
  "protected-action-requested",
]);
const actualProtocolCases = new Set((fixtures?.protocol_cases ?? []).map(({ id }) => id));
record(
  "protocol_fixture_coverage",
  [...requiredProtocolCases].every((id) => actualProtocolCases.has(id)),
  "required protocol edge cases missing",
);
for (const fixture of fixtures?.protocol_cases ?? []) {
  record(
    `protocol_fixture_result:${fixture.id}`,
    protocolResult(fixture) === fixture.expected_max_result,
    `expected ${fixture.expected_max_result}, got ${protocolResult(fixture)}`,
  );
}

const requiredIntegrityCases = new Set([
  "integrity-full-verified",
  "integrity-reveal-byte-mismatch",
  "integrity-thread-handle-mismatch",
  "integrity-one-missing-pre-audit",
  "integrity-shared-source-critical-convergence",
  "integrity-canonical-minority-over-unsupported-majority",
  "integrity-quick-surrender-without-evidence",
  "integrity-fake-dissent-rejected",
  "integrity-oskar-unsupported-major-claim",
  "integrity-olga-non-reproducible",
  "integrity-lost-critical-minority",
  "integrity-experience-transfer-missing",
]);
const actualIntegrityCases = new Set((fixtures?.integrity_cases ?? []).map(({ id }) => id));
record(
  "integrity_fixture_coverage",
  [...requiredIntegrityCases].every((id) => actualIntegrityCases.has(id)),
  "required phase-integrity cases missing",
);
for (const fixture of fixtures?.integrity_cases ?? []) {
  record(
    `integrity_fixture_result:${fixture.id}`,
    classifyIntegrityFixture(fixture) === fixture.expected_max_result,
    `expected ${fixture.expected_max_result}, got ${classifyIntegrityFixture(fixture)}`,
  );
}

const requiredLoopCases = new Set([
  "loop-all-required-pass",
  "loop-one-bounded-gap-before-revision",
  "loop-user-decision-required",
  "loop-second-panel-forbidden",
  "loop-regression-after-revision",
  "loop-budget-exhausted-with-gap",
]);
const actualLoopCases = new Set((fixtures?.loop_cases ?? []).map(({ id }) => id));
record(
  "loop_fixture_coverage",
  [...requiredLoopCases].every((id) => actualLoopCases.has(id)),
  "required Loop Protocol cases missing",
);
for (const fixture of fixtures?.loop_cases ?? []) {
  record(
    `loop_fixture_decision:${fixture.id}`,
    decideLoopFixture(fixture) === fixture.expected_decision,
    `expected ${fixture.expected_decision}, got ${decideLoopFixture(fixture)}`,
  );
}
record(
  "domain_fixture_coverage",
  (fixtures?.frozen_domain_cases ?? []).length >= 4 &&
    (fixtures?.frozen_domain_cases ?? []).every(
      ({ required_observables }) => Array.isArray(required_observables) && required_observables.length > 0,
    ),
  "four complete frozen domain cases required",
);

const contractsText = read(join(skillRoot, "references/contracts-and-schemas.md"));
const priorArtText = read(join(skillRoot, "references/prior-art-assimilation.md"));
const sourceTemplateText = read(join(skillRoot, "templates/source-packet.md"));
const candidateTemplateText = read(join(skillRoot, "templates/candidate-solution.md"));
const revealTemplateText = read(join(skillRoot, "templates/reveal-transfer.md"));
const revisionTemplateText = read(join(skillRoot, "templates/revision.md"));
const consensusTemplateText = read(join(skillRoot, "templates/consensus-report.md"));
const runManifestTemplateText = read(join(skillRoot, "templates/protocol-run-manifest.md"));
record("contracts_loop_projection", contractsText.includes("## Loop Control Projection") && contractsText.includes("automatic_second_panel_run: false"), "loop projection contract missing");
record("template_source_loop", sourceTemplateText.includes("gate: loop_control_fit") && sourceTemplateText.includes("max_iterations: 1"), "source packet loop binding missing");
record("template_source_independence", sourceTemplateText.includes("independence_key:") && sourceTemplateText.includes("shared_source_counts_once: true"), "source independence fields missing");
record("template_candidate_self_audit", candidateTemplateText.includes("pre_reveal_self_audit:") && candidateTemplateText.includes("falsification_check:") && candidateTemplateText.includes("source_independence_keys:"), "candidate evidence or self-audit fields missing");
record("template_reveal_criteria", revealTemplateText.includes("acceptance_findings:") && revealTemplateText.includes("root_cause:"), "criterion-level critique missing");
record("template_reveal_groupthink", revealTemplateText.includes("anti_groupthink_checks:") && revealTemplateText.includes("fake_dissent_flags:") && revealTemplateText.includes("shared_source_consensus_claims:"), "anti-groupthink reveal fields missing");
record("template_revision_repair", revisionTemplateText.includes("loop_repair:") && revisionTemplateText.includes("regression_risks:"), "same-thread repair fields missing");
record("template_revision_experience", revisionTemplateText.includes("experience_transfer:") && revisionTemplateText.includes("original_thread_handle_sha256:") && revisionTemplateText.includes("claim_revision_map:"), "experience-transfer fields missing");
record("template_consensus_regression", consensusTemplateText.includes("loop_summary:") && consensusTemplateText.includes("repair_history:") && consensusTemplateText.includes("regression_check:"), "loop summary or regression fields missing");
record("template_consensus_provenance", consensusTemplateText.includes("synthesis_provenance:") && consensusTemplateText.includes("oskar_introduced_claims:") && consensusTemplateText.includes("reproducible_next_check:") && consensusTemplateText.includes("protocol_run_manifest_sha256:") && consensusTemplateText.includes("moderator_report_sha256:"), "synthesis provenance or QA fields missing");
record("template_protocol_run_manifest", runManifestTemplateText.includes("protocol_run_manifest.v1") && runManifestTemplateText.includes("reveal_byte_identical:") && runManifestTemplateText.includes("same_thread_revisions_verified:") && runManifestTemplateText.includes("checkpoint_hashes:") && runManifestTemplateText.includes("reconcile:") && runManifestTemplateText.includes("qa:"), "protocol run manifest fields missing");
record("contracts_integrity_projection", contractsText.includes("## Protocol Run Manifest") && contractsText.includes("evidence_independence_findings:") && contractsText.includes("synthesis_provenance:") && contractsText.includes("protocol_run_manifest_reconcile_checkpoint_sha256:"), "integrity contract fields missing");
record(
  "prior_art_assimilation",
  ["Agent Review Panel", "Agent Council", "oh-my-codex", "Captain Claw", "Zeroshot", "Mixture-of-Agents"].every((name) => priorArtText.includes(name)) &&
    priorArtText.includes("same complete task") &&
    priorArtText.includes("not runtime dependencies"),
  "prior-art decisions or invariants missing",
);

const requiredRegressionCases = new Set([
  "normal-routing-creative",
  "normal-routing-engineering",
  "normal-routing-provider",
  "no-permission-inheritance",
  "no-majority-authority",
  "no-speed-authority",
  "no-verbosity-authority",
]);
const actualRegressionCases = new Set((fixtures?.regression_cases ?? []).map(({ id }) => id));
record(
  "regression_fixture_coverage",
  [...requiredRegressionCases].every((id) => actualRegressionCases.has(id)),
  "required routing and authority regression cases missing",
);

for (const fixture of fixtures?.regression_cases ?? []) {
  if (fixture.naruto_must_activate === false) {
    record(
      `regression_normal_route:${fixture.id}`,
      matchesExactTrigger(fixture.message) === false,
      "normal route was captured by Naruto trigger",
    );
  }
  if (fixture.id === "no-permission-inheritance") {
    record(
      "regression_no_permission_inheritance",
      matchesExactTrigger(fixture.message) === true &&
        fixture.provider_execution_allowed === false &&
        skillText.includes("`$naruto` grants no provider activation"),
      "Naruto trigger inherited provider execution permission",
    );
  }
  if (fixture.expected_rule === "evidence_over_vote") {
    record(
      "regression_evidence_over_vote",
      manifest?.moderation?.majority_is_authority === false &&
        skillText.includes("critical evidence-backed minority objection"),
      "majority could override evidence-backed minority",
    );
  }
  if (fixture.expected_rule === "completion_order_ignored") {
    record(
      "regression_completion_order_ignored",
      skillText.includes("Speed, majority, verbosity") || skillText.includes("Speed, majority"),
      "completion speed authority guard missing",
    );
  }
  if (fixture.expected_rule === "answer_length_ignored") {
    record(
      "regression_answer_length_ignored",
      skillText.includes("verbosity") && skillText.includes("never decide"),
      "answer length authority guard missing",
    );
  }
}

const packetA = { task: "x", constraints: ["a", "b"], evidence: { z: 1, a: 2 } };
const packetB = { evidence: { a: 2, z: 1 }, constraints: ["a", "b"], task: "x" };
const packetC = { evidence: { a: 2, z: 1 }, constraints: ["a", "b"], task: "y" };
record("canonical_hash_key_order", sha256(packetA) === sha256(packetB), "key order changed hash");
record("canonical_hash_task_change", sha256(packetA) !== sha256(packetC), "task change kept hash");

const skillFiles = listFiles(skillRoot);
record(
  "skill_file_manifest",
  JSON.stringify(skillFiles) === JSON.stringify([...requiredSkillFiles].sort()),
  "skill contains missing or unexpected files",
);
record(
  "skill_appledouble_absent",
  !skillFiles.some((path) => path.split("/").some((part) => part.startsWith("._"))),
  "AppleDouble file found in skill",
);
record(
  "skill_dsstore_absent",
  !skillFiles.some((path) => path.endsWith(".DS_Store")),
  ".DS_Store found in skill",
);

if (packageMode) {
  const requiredPackageFiles = [
    ".gitattributes",
    ".gitignore",
    "LICENSE",
    "NOTICE.md",
    "README.md",
    "SHA256SUMS",
    "docs/compatibility.md",
    "docs/naming-risk.md",
    "integrations/framecore-workspace.md",
    "manifest/package-manifest.json",
    "scripts/checksums.mjs",
    "scripts/install.mjs",
    "scripts/validate.mjs",
  ];
  for (const file of requiredPackageFiles) {
    record(`package_file:${file}`, existsSync(join(workspaceRoot, file)), "missing package file");
  }

  const readme = read(join(workspaceRoot, "README.md"));
  const notice = read(join(workspaceRoot, "NOTICE.md"));
  const packageManifest = parseJson(join(workspaceRoot, "manifest/package-manifest.json"));

  record("readme_install", /^## Install$/m.test(readme), "README install section missing");
  record("readme_update", /^## Update$/m.test(readme), "README update section missing");
  record("readme_restart", /restart Codex/i.test(readme), "README restart guidance missing");
  record("readme_positive_trigger", readme.includes("$naruto Review this architecture"), "positive trigger missing");
  record("readme_negative_trigger", readme.includes("$naruto: Review this architecture"), "negative trigger missing");
  record("readme_no_generic_fallback", readme.includes("cannot be replaced by `default`, `worker`, or"), "no-fallback note missing");
  record("readme_validation", readme.includes("npm test"), "single validation command missing");
  record("readme_package_version", readme.includes(`Standalone package version: \`${packageJson?.version}\``), "README package version mismatch");
  record("readme_loop_contract", readme.includes("`loop_control_fit`") && readme.includes("`max_iterations: 1`"), "bounded loop contract missing");
  record("readme_integrity_contract", readme.includes("`protocol_run_manifest.v1`") && readme.includes("opaque thread-handle hashes") && readme.includes("experience-transfer"), "phase-integrity contract missing");
  record("readme_epistemic_contract", readme.includes("independence key") && readme.includes("anti-groupthink") && readme.includes("role-blind"), "evidence or QA contract missing");
  record("notice_no_affiliation", /not affiliated[\s\S]+not endorsed/i.test(notice), "no-affiliation notice missing");
  record(
    "package_manifest_layout",
    packageManifest?.layout?.skill_root === ".agents/skills/naruto" &&
      packageManifest?.layout?.profile_root === ".codex/agents",
    "package manifest layout mismatch",
  );
  record(
    "package_manifest_profiles",
    packageManifest?.required_profiles?.length === 5,
    "package manifest must list five profiles",
  );
  record(
    "package_manifest_protocol_artifacts",
    packageManifest?.required_protocol_artifacts?.includes("references/prior-art-assimilation.md") &&
      packageManifest?.required_protocol_artifacts?.includes("templates/protocol-run-manifest.md"),
    "package manifest omits expanded protocol artifacts",
  );
  record(
    "package_manifest_version",
    packageManifest?.package_version === packageJson?.version,
    "package.json and package manifest versions differ",
  );
  record("package_private", packageJson?.private === true, "package must not be npm-publishable");
  record("package_no_dependencies", !packageJson?.dependencies && !packageJson?.devDependencies, "package must stay dependency-free");
  record("package_node_version", packageJson?.engines?.node === ">=18", "Node engine requirement mismatch");

  const allPackageFiles = listFiles(workspaceRoot, "", {
    ignoredDirectories: [".git", "node_modules", "__MACOSX"],
  });
  const excludedContextDirectories = ["Memory Cache", "Context"].filter((name) =>
    existsSync(join(workspaceRoot, name)),
  );
  record(
    "package_context_directories_absent",
    excludedContextDirectories.length === 0,
    excludedContextDirectories.join(", "),
  );
  const forbiddenEntries = allPackageFiles.filter((path) => {
    const parts = path.split("/");
    const basename = parts.at(-1);
    return (
      basename === ".DS_Store" ||
      basename?.startsWith("._") ||
      basename === ".env" ||
      basename?.startsWith(".env.") ||
      parts.includes("__MACOSX")
    );
  });
  record("package_forbidden_files_absent", forbiddenEntries.length === 0, forbiddenEntries.join(", "));

  const textFiles = allPackageFiles.filter(
    (path) => !path.startsWith(".git/") && path !== "SHA256SUMS",
  );
  const privatePathHits = [];
  const secretHits = [];
  const privateRootNames = ["Us" + "ers", "Vol" + "umes"];
  const privatePathPattern = new RegExp(
    `(?:^|[\\s(\"'\\x60])\\/(?:${privateRootNames.join("|")})\\/[A-Za-z0-9._~+/@ -]+`,
    "m",
  );
  const staleHomeMarker = "Codex" + "Home";
  for (const path of textFiles) {
    const text = read(join(workspaceRoot, ...path.split("/")));
    if (privatePathPattern.test(text) || text.includes(staleHomeMarker)) {
      privatePathHits.push(path);
    }
    if (
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text) ||
      /\bsk-[A-Za-z0-9_-]{20,}\b/.test(text) ||
      /\b(?:OPENAI_API_KEY|FAL_KEY|MUAPI_AUTHORIZATION|POYO_API_KEY)\s*=\s*["']?[A-Za-z0-9_./:+-]{8,}/.test(text) ||
      /\bBearer\s+[A-Za-z0-9._~+/-]{20,}/.test(text)
    ) {
      secretHits.push(path);
    }
  }
  record("package_private_paths_absent", privatePathHits.length === 0, privatePathHits.join(", "));
  record("package_secret_material_absent", secretHits.length === 0, secretHits.join(", "));
}

const failed = checks.filter(({ ok }) => !ok);
console.log(
  JSON.stringify(
    {
      status: failed.length === 0 ? "pass" : "fail",
      skill: "naruto",
      standalone: true,
      package_mode: packageMode,
      profile_root: profileRoot ?? null,
      total: checks.length,
      passed: checks.length - failed.length,
      failed: failed.length,
      errors,
    },
    null,
    2,
  ),
);

if (failed.length > 0) process.exitCode = 1;
