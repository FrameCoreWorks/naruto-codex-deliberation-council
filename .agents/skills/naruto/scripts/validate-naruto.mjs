#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillRoot = resolve(scriptDir, "..");
const workspaceRoot = resolve(skillRoot, "../../..");
const errors = [];
const checks = [];

const expectedAgents = [
  {
    card: "naruto-clone-integrator.yaml",
    runtime: "naruto_clone_integrator",
    actorIdentity: "naruto_uzumaki",
    methodProfile: "naruto_integrative_method.v1",
    contracts: ["naruto_training_instance.v1", "naruto_supervised_training.v1", "naruto_integrative_method.v1", "naruto_experience_transfer.v1"],
  },
  {
    card: "naruto-clone-challenger.yaml",
    runtime: "naruto_clone_challenger",
    actorIdentity: "naruto_uzumaki",
    methodProfile: "naruto_adversarial_method.v1",
    contracts: ["naruto_training_instance.v1", "naruto_supervised_training.v1", "naruto_adversarial_method.v1", "naruto_experience_transfer.v1"],
  },
  {
    card: "naruto-clone-strategist.yaml",
    runtime: "naruto_clone_strategist",
    actorIdentity: "naruto_uzumaki",
    methodProfile: "naruto_systems_method.v1",
    contracts: ["naruto_training_instance.v1", "naruto_supervised_training.v1", "naruto_systems_method.v1", "naruto_experience_transfer.v1"],
  },
  {
    card: "naruto-clone-verifier.yaml",
    runtime: "naruto_clone_verifier",
    actorIdentity: "naruto_uzumaki",
    methodProfile: "naruto_empirical_method.v1",
    contracts: ["naruto_training_instance.v1", "naruto_supervised_training.v1", "naruto_empirical_method.v1", "naruto_experience_transfer.v1"],
  },
  {
    card: "kakashi-hatake.yaml",
    runtime: "kakashi_hatake",
    contracts: ["naruto_moderator.v1", "naruto_training_guidance.v1", "naruto_commit_barrier.v1", "naruto_phase_integrity.v1", "naruto_groupthink_audit.v1"],
  },
  {
    card: "yamato.yaml",
    runtime: "yamato",
    contracts: ["naruto_safety_controller.v1", "naruto_boundary_guard.v1", "naruto_guidance_integrity.v1", "naruto_phase_integrity.v1"],
  },
];

const expectedTrainingInstances = expectedAgents
  .filter(({ actorIdentity }) => actorIdentity)
  .map(({ runtime, actorIdentity, methodProfile }) => ({
    instance_id: runtime,
    actor_identity_id: actorIdentity,
    method_profile_id: methodProfile,
  }));

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
  "templates/method-matrix.md",
  "templates/training-instance-envelope.md",
  "templates/training-guidance.md",
  "templates/safety-control.md",
  "templates/candidate-solution.md",
  "templates/reveal-transfer.md",
  "templates/revision.md",
  "templates/consensus-report.md",
  "templates/protocol-checkpoint.md",
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

function artifactDigest(value, selfDigestField) {
  const projection = JSON.parse(JSON.stringify(value));
  delete projection[selfDigestField];
  return sha256(projection);
}

const protocolCheckpointOrder = [
  "source_packet",
  "training_control",
  "commit_barrier",
  "reveal",
  "revision",
  "reconcile",
  "safety_report",
  "synthesis",
  "qa",
];

function createProtocolCheckpoint(manifest, phase) {
  const phaseIndex = protocolCheckpointOrder.indexOf(phase);
  if (phaseIndex < 0) throw new Error(`Unknown protocol checkpoint: ${phase}`);
  const previousCheckpointSha256 = phaseIndex === 0
    ? null
    : manifest.checkpoint_hashes?.[protocolCheckpointOrder[phaseIndex - 1]];
  if (phaseIndex > 0 && !previousCheckpointSha256) {
    throw new Error(`Missing previous checkpoint for phase: ${phase}`);
  }
  const manifestSnapshot = JSON.parse(JSON.stringify(manifest));
  delete manifestSnapshot.checkpoint_hashes;
  delete manifestSnapshot.manifest_sha256;
  const checkpoint = {
    schema: "protocol_checkpoint.v1",
    run_id: manifest.run_id,
    task_id: manifest.task_id,
    sequence: phaseIndex + 1,
    phase,
    previous_checkpoint_sha256: previousCheckpointSha256,
    manifest_snapshot: manifestSnapshot,
    checkpoint_sha256: "",
  };
  checkpoint.checkpoint_sha256 = artifactDigest(checkpoint, "checkpoint_sha256");
  return checkpoint;
}

function verifyProtocolCheckpointChain(checkpoints, manifest) {
  if (checkpoints.length !== protocolCheckpointOrder.length) return false;
  return checkpoints.every((checkpoint, index) => {
    const expectedPrevious = index === 0 ? null : checkpoints[index - 1].checkpoint_sha256;
    return checkpoint.schema === "protocol_checkpoint.v1" &&
      checkpoint.sequence === index + 1 &&
      checkpoint.phase === protocolCheckpointOrder[index] &&
      checkpoint.previous_checkpoint_sha256 === expectedPrevious &&
      checkpoint.checkpoint_sha256 === artifactDigest(checkpoint, "checkpoint_sha256") &&
      manifest.checkpoint_hashes?.[checkpoint.phase] === checkpoint.checkpoint_sha256;
  });
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

function classifyTrainingInstanceFixture(fixture) {
  const expectedInstanceIds = expectedTrainingInstances.map(({ instance_id }) => instance_id);
  const expectedMethodIds = expectedTrainingInstances.map(({ method_profile_id }) => method_profile_id);
  const actorIdentityIds = fixture.actor_identity_ids ?? [];
  const instanceIds = fixture.instance_ids ?? [];
  const methodProfileIds = fixture.method_profile_ids ?? [];
  const revisionMethodProfileIds = fixture.revision_method_profile_ids ?? [];
  const valid =
    actorIdentityIds.length === 4 &&
    actorIdentityIds.every((identity) => identity === "naruto_uzumaki") &&
    JSON.stringify(instanceIds) === JSON.stringify(expectedInstanceIds) &&
    new Set(instanceIds).size === 4 &&
    JSON.stringify(methodProfileIds) === JSON.stringify(expectedMethodIds) &&
    new Set(methodProfileIds).size === 4 &&
    JSON.stringify(revisionMethodProfileIds) === JSON.stringify(methodProfileIds) &&
    fixture.method_matrix_byte_identical === true &&
    fixture.envelope_difference_allowlist_valid === true;
  return valid ? "ready" : "blocked";
}

function validateEmpiricalMethodFixture(fixture) {
  return fixture.has_complete_solution === true &&
    fixture.fixed_acceptance_criteria_preserved === true &&
    fixture.hypothesis_count > 0 &&
    fixture.discriminating_test_count > 0 &&
    fixture.observable_count > 0 &&
    fixture.decision_threshold_count > 0 &&
    fixture.fallback_or_rollback_defined === true &&
    fixture.invented_results === false &&
    fixture.peer_evaluation === false &&
    fixture.safety_or_qa_status_issued === false;
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

function classifyProtocolFixture(fixture) {
  if (
    fixture.protected_action_without_normal_gate === true ||
    fixture.safety_supervisor === "unavailable" ||
    fixture.training_control === "fail" ||
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

function classifySupervisionFixture(fixture) {
  if (
    fixture.safety_supervisor !== "available" ||
    fixture.source_packet_available !== true ||
    fixture.source_packet_hash_matches !== true ||
    fixture.guidance_byte_identical !== true ||
    fixture.guidance_non_solution !== true ||
    fixture.instance_specific_coaching === true ||
    fixture.protected_boundaries !== "pass" ||
    fixture.hold_count > 1
  ) {
    return "blocked";
  }
  if (fixture.safety_status === "hold" && fixture.hold_count === 1) {
    return "repair_common";
  }
  return fixture.safety_status === "pass" ? "ready" : "blocked";
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
  const usableInstances = Math.min(
    fixture.valid_training_instances ?? 0,
    fixture.pre_reveal_self_audits ?? 0,
    fixture.same_thread_proofs ?? 0,
    fixture.experience_transfer_ledgers ?? 0,
    fixture.no_blind_phase_supervisor_contact_attestations ?? fixture.valid_training_instances ?? 0,
  );
  if (
    fixture.barrier !== "pass" ||
    fixture.reveal_byte_identical !== true ||
    fixture.same_thread_proofs < 3 ||
    fixture.experience_transfer_ledgers < 3 ||
    fixture.guidance_byte_identical === false ||
    fixture.safety_control_byte_identical === false ||
    fixture.instance_specific_coaching_detected === true ||
    fixture.blind_phase_content_feedback_detected === true ||
    (fixture.safety_report != null && fixture.safety_report !== "pass") ||
    fixture.anti_groupthink_audit !== "pass" ||
    (fixture.consequential === true && fixture.final_qa !== "pass_reproducible")
  ) {
    return "blocked";
  }
  if (
    fixture.critical_minority === "evidence_backed_unresolved" ||
    fixture.critical_minority === "lost"
  ) {
    return "structured_dispute";
  }
  if (usableInstances < 3) return "blocked";
  if (
    usableInstances < 4 ||
    fixture.critical_shared_lineage_only === true ||
    fixture.quick_surrender_unresolved === true ||
    (fixture.hokage_unverified_critical_or_major_claims ?? 0) > 0 ||
    fixture.evidence !== "complete_independent"
  ) {
    return "provisional_consensus";
  }
  return "verified_consensus";
}

const packageJsonPath = join(workspaceRoot, "package.json");
const packageJson = existsSync(packageJsonPath) ? parseJson(packageJsonPath) : null;
const packageMode = packageJson?.name === "naruto-codex-deliberation-council";

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
  `six profiles were not found together in: ${uniqueProfileRoots.join(", ")}`,
);

for (const file of requiredSkillFiles) {
  record(`required_file:${file}`, existsSync(join(skillRoot, file)), "missing required skill file");
}

const skillText = read(join(skillRoot, "SKILL.md"));
const publicSkillText = listFiles(skillRoot)
  .filter((file) => !file.startsWith("scripts/"))
  .map((file) => read(join(skillRoot, file)))
  .join("\n");
const forbiddenInternalRolePattern = new RegExp(
  ["\\bOs", "kar\\b|\\bHip", "son\\b|\\bEr", "yk\\b|\\bOl", "ga\\b"].join(""),
  "i",
);
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
record(
  "public_role_names_neutral",
  !forbiddenInternalRolePattern.test(publicSkillText),
  "workspace-internal role name leaked into the public skill",
);
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
  "skill_hokage_owner",
  skillText.includes("Hokage remains the only workflow orchestrator"),
  "Hokage ownership missing",
);
record(
  "skill_no_permissions",
  skillText.includes("`$naruto` grants no provider activation"),
  "permission non-inheritance missing",
);
record(
  "skill_no_generic_fallback",
  skillText.includes("Never replace a failed dedicated\ninstance with a generic worker"),
  "dedicated-agent fallback guard missing",
);
record(
  "skill_learning_invariant",
  skillText.includes("## Core Learning Invariant") &&
    skillText.includes("same complete task") &&
    skillText.includes("original instance thread"),
  "same-task learning invariant missing",
);
record(
  "skill_training_instance_contract",
  skillText.includes("actor_identity_id: naruto_uzumaki") &&
    skillText.includes("method_matrix.v1") &&
    skillText.includes("naruto_training_instance_envelope.v1"),
  "shared Naruto identity, method matrix, or training-instance envelope missing",
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
  skillText.includes("`experience_transfer`") && skillText.includes("opaque runtime handle"),
  "experience-transfer or same-thread provenance rule missing",
);
record(
  "skill_groupthink",
  skillText.includes("quick surrender") && skillText.includes("unsupported dissent"),
  "anti-groupthink balance missing",
);
record(
  "skill_synthesis_provenance",
  skillText.includes("synthesis provenance") && skillText.includes("reproducible next check"),
  "Hokage provenance or reproducible final QA missing",
);

const openaiText = read(join(skillRoot, "agents/openai.yaml"));
const defaultPrompt = openaiText.match(/^\s*default_prompt:\s*"([^"]+)"/m)?.[1];
const shortDescription = openaiText.match(/^\s*short_description:\s*"([^"]+)"/m)?.[1] ?? "";
record("openai_display_name", /display_name:\s*"[^"]+"/.test(openaiText), "display_name missing");
record(
  "openai_short_description_length",
  shortDescription.length >= 25 && shortDescription.length <= 64,
  "short_description must be 25-64 characters",
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
record(
  "openai_supervision_prompt",
  defaultPrompt?.includes("Kakashi") === true && defaultPrompt?.includes("Yamato") === true,
  "default_prompt must expose common Kakashi guidance and Yamato safety control",
);

const manifest = parseJson(join(skillRoot, "agent_manifest.json"));
record("manifest_schema_version", manifest?.schema_version === 3, "manifest schema_version must be 3");
record("manifest_agent_count", manifest?.agents?.length === 6, "manifest must contain six agents");
record("manifest_owner_hokage", manifest?.owner_role_id === "hokage", "Hokage must remain the public owner role");
record(
  "manifest_parent_tsunade",
  manifest?.parent_role?.id === "hokage" &&
    manifest?.parent_role?.public_identity_id === "tsunade_senju" &&
    manifest?.parent_role?.name === "Tsunade Senju, Fifth Hokage" &&
    manifest?.parent_role?.runtime === "parent_codex_process" &&
    manifest?.parent_role?.bundled_profile === false,
  "Tsunade Senju must be the public Hokage identity without a bundled seventh profile",
);
record(
  "manifest_final_qa_role",
  manifest?.qa_role?.id === "final_qa" &&
    manifest?.qa_role?.runtime_binding === "host_provided" &&
    manifest?.qa_role?.bundled_profile === false &&
    manifest?.qa_role?.required_when === "consequential_result" &&
    manifest?.qa_role?.review_mode === "role_blind_independent" &&
    manifest?.qa_role?.unavailable_policy === "blocked",
  "final QA must be an explicit host-provided, role-blind, fail-closed role",
);
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
record(
  "manifest_training_instance_model",
  manifest?.training_instance_model?.shared_actor_identity_id === "naruto_uzumaki" &&
    manifest?.training_instance_model?.instance_kind === "shadow_clone" &&
    manifest?.training_instance_model?.instance_count === 4 &&
    manifest?.training_instance_model?.method_diversity_required === true &&
    manifest?.training_instance_model?.unique_instance_ids_required === true &&
    manifest?.training_instance_model?.unique_method_profile_ids_required === true &&
    manifest?.training_instance_model?.method_assignment_fixed_before_fanout === true &&
    manifest?.training_instance_model?.subtask_partition_forbidden === true,
  "shared-identity shadow-clone training model missing",
);
record(
  "manifest_supervision_contract",
  manifest?.supervision?.common_training_guidance_required === true &&
    manifest?.supervision?.guidance_byte_identical_required === true &&
    manifest?.supervision?.common_method_matrix_required === true &&
    manifest?.supervision?.method_matrix_byte_identical_required === true &&
    manifest?.supervision?.guidance_must_be_non_solution === true &&
    manifest?.supervision?.yamato_safety_control_required === true &&
    manifest?.supervision?.yamato_full_source_packet_required === true &&
    manifest?.supervision?.instance_specific_coaching_forbidden === true &&
    manifest?.supervision?.blind_phase_content_feedback_forbidden === true &&
    manifest?.supervision?.preflight_hold_repairs_allowed === 1,
  "common guidance or Yamato supervision contract missing",
);

const manifestTrainingInstances = (manifest?.agents ?? [])
  .filter(({ tier }) => tier === "request_only_training_instance")
  .map(({ runtime_id, actor_identity_id, training_instance_id, method_profile_id }) => ({
    instance_id: training_instance_id ?? runtime_id,
    runtime_id,
    actor_identity_id,
    method_profile_id,
  }));
record(
  "manifest_training_instance_assignments",
  JSON.stringify(manifestTrainingInstances) === JSON.stringify(
    expectedTrainingInstances.map(({ instance_id, actor_identity_id, method_profile_id }) => ({
      instance_id,
      runtime_id: instance_id,
      actor_identity_id,
      method_profile_id,
    })),
  ),
  "training-instance identity or method assignments differ from the canonical matrix",
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
  if (expected.actorIdentity) {
    record(
      `agent_manifest_training_instance:${expected.runtime}`,
      manifestAgent?.actor_identity_id === expected.actorIdentity &&
        manifestAgent?.training_instance_id === expected.runtime &&
        manifestAgent?.method_profile_id === expected.methodProfile,
      "manifest training-instance identity or method mismatch",
    );
    record(
      `agent_card_training_instance:${expected.runtime}`,
      yamlScalar(cardText, "actor_identity_id") === expected.actorIdentity &&
        yamlScalar(cardText, "training_instance_id") === expected.runtime &&
        yamlScalar(cardText, "method_profile_id") === expected.methodProfile,
      "card training-instance identity or method mismatch",
    );
    record(
      `agent_runtime_training_instance:${expected.runtime}`,
      runtimeText.includes(`actor_identity_id=${expected.actorIdentity}`) &&
        runtimeText.includes(`instance_id=${expected.runtime}`) &&
        runtimeText.includes(`assigned_method_profile_id=${expected.methodProfile}`),
      "runtime training-instance identity or method mismatch",
    );
  }
  if (expected.runtime === "kakashi_hatake") {
    record(
      "agent_card_moderator_integrity",
      cardText.includes("method_matrix.v1") &&
        cardText.includes("training_guidance_packet.v1") &&
        cardText.includes("protocol_run_manifest.v1") &&
        cardText.includes("anti-groupthink") &&
        cardText.includes("experience-transfer"),
      "Kakashi card lacks common guidance, phase-integrity, groupthink, or transfer ownership",
    );
    record(
      "agent_runtime_moderator_integrity",
      runtimeText.includes("method_matrix.v1") &&
        runtimeText.includes("training_guidance_packet.v1") &&
        runtimeText.includes("protocol_run_manifest.v1") &&
        runtimeText.includes("evidence-independence") &&
        runtimeText.includes("matching thread-handle hashes"),
      "Kakashi runtime lacks common guidance or integrity enforcement",
    );
  } else if (expected.runtime === "yamato") {
    record(
      "agent_card_yamato_safety",
      cardText.includes("full final source_evidence_packet.v1") &&
        cardText.includes("method_matrix.v1") &&
        cardText.includes("four training-instance envelopes") &&
        cardText.includes("safety_control_packet.v1") &&
        cardText.includes("safety_report.v1") &&
        cardText.includes("without solution advice"),
      "Yamato card lacks full source input, safety packets, or non-solution boundary",
    );
    record(
      "agent_runtime_yamato_safety",
      runtimeText.includes("full final source_evidence_packet.v1") &&
        runtimeText.includes("method_matrix.v1") &&
        runtimeText.includes("all four training-instance envelopes") &&
        runtimeText.includes("status pass, hold, or blocked") &&
        runtimeText.includes("phase metadata") &&
        runtimeText.includes("Do not send training instances content feedback"),
      "Yamato runtime lacks full source validation, safety state, or blind-contact guard",
    );
  } else {
    record(
      `agent_card_candidate_learning:${expected.runtime}`,
      cardText.includes("method-matrix hashes") &&
        cardText.includes("pre-reveal self-audit") &&
        cardText.includes("experience-transfer ledger") &&
        cardText.includes("opaque handle hashes") &&
        cardText.includes("no-blind-contact attestation"),
      "candidate card lacks supervision, self-audit, or same-thread experience transfer",
    );
    record(
      `agent_runtime_candidate_learning:${expected.runtime}`,
      runtimeText.includes("same Naruto identity") &&
        runtimeText.includes("method_matrix.v1") &&
        runtimeText.includes("pre-reveal self-audit") &&
        runtimeText.includes("experience-transfer claim map") &&
        runtimeText.includes("opaque thread-handle hashes") &&
        runtimeText.includes("no_blind_phase_supervisor_contact_attestation=true"),
      "candidate runtime lacks supervision, self-audit, or same-thread experience transfer",
    );
  }
}

const empiricalVerifierCardText = read(join(skillRoot, "agents/naruto-clone-verifier.yaml"));
const empiricalVerifierRuntimeText = profileRoot
  ? read(join(profileRoot, "naruto_clone_verifier.toml"))
  : "";
record(
  "empirical_verifier_card_contract",
  empiricalVerifierCardText.includes("Naruto Clone: Empirical Verifier") &&
    empiricalVerifierCardText.includes("operationalization of fixed acceptance criteria") &&
    empiricalVerifierCardText.includes("decision thresholds") &&
    empiricalVerifierCardText.includes("rollback design") &&
    empiricalVerifierCardText.includes("execute tests") &&
    empiricalVerifierCardText.includes("return only a checklist"),
  "Empirical Verifier card must own a complete hypothesis-led solution without changing criteria, executing tests, or becoming QA-only",
);
record(
  "empirical_verifier_runtime_contract",
  empiricalVerifierRuntimeText.includes("Naruto Clone: Empirical Verifier") &&
    empiricalVerifierRuntimeText.includes("explicit hypotheses") &&
    empiricalVerifierRuntimeText.includes("discriminating tests") &&
    empiricalVerifierRuntimeText.includes("decision thresholds") &&
    empiricalVerifierRuntimeText.includes("never change them") &&
    empiricalVerifierRuntimeText.includes("without executing tests or inventing outcomes") &&
    empiricalVerifierRuntimeText.includes("Do not evaluate peers") &&
    empiricalVerifierRuntimeText.includes("perform final QA") &&
    empiricalVerifierRuntimeText.includes("return only a checklist"),
  "Empirical Verifier runtime must design discriminating evidence without peer evaluation, invented results, or final QA",
);

const fixtures = parseJson(join(skillRoot, "fixtures/naruto-fixtures.json"));
record("fixtures_schema_version", fixtures?.schema_version === 3, "fixtures schema_version must be 3");
for (const fixture of fixtures?.trigger_cases ?? []) {
  record(
    `trigger_fixture:${fixture.id}`,
    matchesExactTrigger(fixture.message) === fixture.expected,
    `expected ${fixture.expected}`,
  );
}

const requiredTrainingInstanceCases = new Set([
  "training-instances-ready",
  "training-instances-foreign-identity",
  "training-instances-duplicate-instance",
  "training-instances-duplicate-method",
  "training-instances-method-drift",
  "training-instances-envelope-drift",
]);
const actualTrainingInstanceCases = new Set(
  (fixtures?.training_instance_cases ?? []).map(({ id }) => id),
);
record(
  "training_instance_fixture_coverage",
  [...requiredTrainingInstanceCases].every((id) => actualTrainingInstanceCases.has(id)),
  "required shared-identity, method-diversity, and envelope cases missing",
);
for (const fixture of fixtures?.training_instance_cases ?? []) {
  record(
    `training_instance_fixture_result:${fixture.id}`,
    classifyTrainingInstanceFixture(fixture) === fixture.expected_state,
    `expected ${fixture.expected_state}, got ${classifyTrainingInstanceFixture(fixture)}`,
  );
}

const requiredEmpiricalMethodCases = new Set([
  "empirical-engineering-complete",
  "empirical-creative-complete",
  "empirical-checklist-only",
  "empirical-invented-certification",
]);
const actualEmpiricalMethodCases = new Set(
  (fixtures?.empirical_method_cases ?? []).map(({ id }) => id),
);
record(
  "empirical_method_fixture_coverage",
  [...requiredEmpiricalMethodCases].every((id) => actualEmpiricalMethodCases.has(id)),
  "required complete-solution and QA-boundary empirical method cases missing",
);
for (const fixture of fixtures?.empirical_method_cases ?? []) {
  record(
    `empirical_method_fixture_result:${fixture.id}`,
    validateEmpiricalMethodFixture(fixture) === fixture.expected,
    `expected ${fixture.expected}, got ${validateEmpiricalMethodFixture(fixture)}`,
  );
}

const requiredProtocolCases = new Set([
  "full-verified",
  "three-instance-degraded",
  "two-instance-blocked",
  "hash-mismatch-degrades",
  "early-reveal-blocked",
  "same-thread-unavailable",
  "moderator-unavailable",
  "critical-minority-unresolved",
  "protected-action-requested",
  "safety-supervisor-unavailable",
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
    classifyProtocolFixture(fixture) === fixture.expected_max_result,
    `expected ${fixture.expected_max_result}, got ${classifyProtocolFixture(fixture)}`,
  );
}

const requiredSupervisionCases = new Set([
  "supervision-ready",
  "supervision-one-common-repair",
  "supervision-guidance-byte-mismatch",
  "supervision-solution-direction",
  "supervision-yamato-unavailable",
  "supervision-instance-specific-coaching",
  "supervision-protected-boundary-failure",
  "supervision-second-non-pass",
  "supervision-unverifiable",
  "supervision-source-packet-missing",
  "supervision-source-packet-hash-mismatch",
]);
const actualSupervisionCases = new Set((fixtures?.supervision_cases ?? []).map(({ id }) => id));
record(
  "supervision_fixture_coverage",
  [...requiredSupervisionCases].every((id) => actualSupervisionCases.has(id)),
  "required common-guidance and safety-control cases missing",
);
for (const fixture of fixtures?.supervision_cases ?? []) {
  record(
    `supervision_fixture_result:${fixture.id}`,
    classifySupervisionFixture(fixture) === fixture.expected_state,
    `expected ${fixture.expected_state}, got ${classifySupervisionFixture(fixture)}`,
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
  "integrity-hokage-unsupported-major-claim",
  "integrity-final-qa-non-reproducible",
  "integrity-lost-critical-minority",
  "integrity-experience-transfer-missing",
  "integrity-blind-supervisor-contact",
  "integrity-safety-report-unverifiable",
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
const methodMatrixTemplateText = read(join(skillRoot, "templates/method-matrix.md"));
const trainingInstanceEnvelopeTemplateText = read(join(skillRoot, "templates/training-instance-envelope.md"));
const candidateTemplateText = read(join(skillRoot, "templates/candidate-solution.md"));
const revealTemplateText = read(join(skillRoot, "templates/reveal-transfer.md"));
const revisionTemplateText = read(join(skillRoot, "templates/revision.md"));
const consensusTemplateText = read(join(skillRoot, "templates/consensus-report.md"));
const protocolCheckpointTemplateText = read(join(skillRoot, "templates/protocol-checkpoint.md"));
const runManifestTemplateText = read(join(skillRoot, "templates/protocol-run-manifest.md"));
const trainingGuidanceTemplateText = read(join(skillRoot, "templates/training-guidance.md"));
const safetyControlTemplateText = read(join(skillRoot, "templates/safety-control.md"));
record("contracts_loop_projection", contractsText.includes("## Loop Control Projection") && contractsText.includes("automatic_second_panel_run: false"), "loop projection contract missing");
record("template_source_loop", sourceTemplateText.includes("gate: loop_control_fit") && sourceTemplateText.includes("max_iterations: 1"), "source packet loop binding missing");
record("template_source_independence", sourceTemplateText.includes("independence_key:") && sourceTemplateText.includes("shared_source_counts_once: true"), "source independence fields missing");
record("template_source_supervision", sourceTemplateText.includes("supervision_contract:") && sourceTemplateText.includes("common_method_matrix_required: true") && sourceTemplateText.includes("method_matrix_byte_identical_required: true") && sourceTemplateText.includes("guidance_must_be_non_solution: true") && sourceTemplateText.includes("yamato_full_source_packet_required: true") && sourceTemplateText.includes("preflight_hold_repairs_allowed: 1"), "source supervision contract missing");
record("template_method_matrix", methodMatrixTemplateText.includes("method_matrix.v1") && methodMatrixTemplateText.includes("actor_identity_id: naruto_uzumaki") && expectedTrainingInstances.every(({ instance_id, method_profile_id }) => methodMatrixTemplateText.includes(`instance_id: ${instance_id}`) && methodMatrixTemplateText.includes(`method_profile_id: ${method_profile_id}`)), "canonical method matrix assignments missing");
record("template_training_instance_envelope", trainingInstanceEnvelopeTemplateText.includes("naruto_training_instance_envelope.v1") && trainingInstanceEnvelopeTemplateText.includes("actor_identity_id: naruto_uzumaki") && trainingInstanceEnvelopeTemplateText.includes("method_matrix_sha256:") && trainingInstanceEnvelopeTemplateText.includes("envelope_sha256:"), "training-instance routing envelope fields missing");
record("template_training_guidance", trainingGuidanceTemplateText.includes("training_guidance_packet.v1") && trainingGuidanceTemplateText.includes("instance_specific_content: false") && trainingGuidanceTemplateText.includes("solution_recommendation_included: false") && trainingGuidanceTemplateText.includes("preferred_route_included: false") && trainingGuidanceTemplateText.includes("private_evidence_included: false"), "common non-solution guidance fields missing");
record("template_safety_control", safetyControlTemplateText.includes("safety_control_packet.v1") && safetyControlTemplateText.includes("method_matrix_present_and_hash_valid:") && safetyControlTemplateText.includes("shared_actor_identity_valid:") && safetyControlTemplateText.includes("unique_fixed_method_ids_valid:") && safetyControlTemplateText.includes("envelope_difference_allowlist_valid:") && safetyControlTemplateText.includes("status: pass | hold | blocked") && safetyControlTemplateText.includes("safety_report.v1"), "Yamato source, identity, method, envelope, or safety-report validation fields missing");
record("template_candidate_self_audit", candidateTemplateText.includes("actor_identity_id: naruto_uzumaki") && candidateTemplateText.includes("method_matrix_sha256:") && candidateTemplateText.includes("training_instance_envelope_sha256:") && candidateTemplateText.includes("pre_reveal_self_audit:") && candidateTemplateText.includes("falsification_check:") && candidateTemplateText.includes("source_independence_keys:") && candidateTemplateText.includes("training_guidance_packet_sha256:") && candidateTemplateText.includes("safety_control_packet_sha256:") && candidateTemplateText.includes("no_blind_phase_supervisor_contact_attestation: true"), "candidate evidence, identity, method binding, supervision, or self-audit fields missing");
record("template_reveal_criteria", revealTemplateText.includes("method_matrix_sha256:") && revealTemplateText.includes("acceptance_findings:") && revealTemplateText.includes("root_cause:") && revealTemplateText.includes("training_guidance_packet_sha256:") && revealTemplateText.includes("safety_control_packet_sha256:"), "criterion-level critique or supervision binding missing");
record("template_reveal_groupthink", revealTemplateText.includes("anti_groupthink_checks:") && revealTemplateText.includes("fake_dissent_flags:") && revealTemplateText.includes("shared_source_consensus_claims:"), "anti-groupthink reveal fields missing");
record("template_revision_repair", revisionTemplateText.includes("loop_repair:") && revisionTemplateText.includes("regression_risks:"), "same-thread repair fields missing");
record("template_revision_experience", revisionTemplateText.includes("actor_identity_id: naruto_uzumaki") && revisionTemplateText.includes("method_profile_id:") && revisionTemplateText.includes("method_matrix_sha256:") && revisionTemplateText.includes("training_instance_envelope_sha256:") && revisionTemplateText.includes("experience_transfer:") && revisionTemplateText.includes("original_thread_handle_sha256:") && revisionTemplateText.includes("claim_revision_map:") && revisionTemplateText.includes("training_guidance_packet_sha256:") && revisionTemplateText.includes("safety_control_packet_sha256:"), "same-thread identity, method, experience-transfer, or supervision binding fields missing");
record("template_consensus_regression", consensusTemplateText.includes("loop_summary:") && consensusTemplateText.includes("repair_history:") && consensusTemplateText.includes("regression_check:"), "loop summary, repair history, or regression check missing");
record("template_consensus_provenance", consensusTemplateText.includes("synthesis_provenance:") && consensusTemplateText.includes("hokage_introduced_claims:") && consensusTemplateText.includes("reproducible_next_check:") && consensusTemplateText.includes("protocol_run_manifest_sha256:") && consensusTemplateText.includes("moderator_report_sha256:") && consensusTemplateText.includes("safety_report_sha256:"), "synthesis provenance, safety binding, protocol binding, or reproducible QA fields missing");
record("template_consensus_conditional_final_qa", consensusTemplateText.includes("final_qa:") && consensusTemplateText.includes("required: true | false") && consensusTemplateText.includes("status: pass | fail | not_run"), "consensus template must represent both required and non-required final QA");
record("template_protocol_checkpoint", protocolCheckpointTemplateText.includes("protocol_checkpoint.v1") && protocolCheckpointTemplateText.includes("previous_checkpoint_sha256:") && protocolCheckpointTemplateText.includes("manifest_snapshot:") && protocolCheckpointTemplateText.includes("checkpoint_sha256:"), "immutable protocol checkpoint schema missing");
record("template_protocol_run_manifest", runManifestTemplateText.includes("protocol_run_manifest.v1") && runManifestTemplateText.includes("actor_identity_id: naruto_uzumaki") && runManifestTemplateText.includes("method_matrix_sha256:") && runManifestTemplateText.includes("unique_instance_and_method_ids_verified:") && runManifestTemplateText.includes("training_instance_envelope_sha256:") && runManifestTemplateText.includes("yamato_preflight_passed:") && runManifestTemplateText.includes("blind_supervisor_contact_absent:") && runManifestTemplateText.includes("safety_supervisor:") && runManifestTemplateText.includes("moderator_report_sha256:") && runManifestTemplateText.includes("safety_report_complete:") && runManifestTemplateText.includes("training_control:") && runManifestTemplateText.includes("reveal_byte_identical:") && runManifestTemplateText.includes("same_thread_revisions_verified:") && runManifestTemplateText.includes("checkpoint_hashes:") && runManifestTemplateText.includes("reconcile:") && runManifestTemplateText.includes("safety_report:") && runManifestTemplateText.includes("qa:"), "protocol run manifest identity, method, supervision, report binding, or phase checkpoints missing");
record("contracts_integrity_projection", contractsText.includes("### Artifact Digest Projection") && contractsText.includes("### Manifest Checkpoints And Acyclic Order") && contractsText.includes("method_matrix.v1") && contractsText.includes("naruto_training_instance_envelope.v1") && contractsText.includes("protocol_checkpoint.v1") && contractsText.includes("## Training Guidance") && contractsText.includes("## Safety Control") && contractsText.includes("## Protocol Run Manifest") && contractsText.includes("safety_report.v1") && contractsText.includes("evidence_independence_findings:") && contractsText.includes("synthesis_provenance:") && contractsText.includes("protocol_run_manifest_reconcile_checkpoint_sha256:"), "digest projection, immutable checkpoint, shared-identity supervision, integrity contracts, or phase binding missing from schema reference");
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
record(
  "canonical_hash_golden_vector",
  sha256(packetA) === "05448af54f7165adc455cc30f07ef56ec8c46ef29911ca7a18a6fdb307ad3e4e",
  "canonical JSON SHA-256 golden vector changed",
);

const candidateDigestA = {
  schema: "candidate_solution.v1",
  candidate_id: "candidate-a",
  complete_solution: "route-one",
  candidate_output_sha256: "stored-a",
};
const candidateDigestB = { ...candidateDigestA, candidate_output_sha256: "stored-b" };
const candidateDigestChanged = { ...candidateDigestA, complete_solution: "route-two" };
record(
  "artifact_self_digest_omitted",
  artifactDigest(candidateDigestA, "candidate_output_sha256") ===
    artifactDigest(candidateDigestB, "candidate_output_sha256"),
  "stored self digest changed its own projection",
);
record(
  "artifact_digest_binds_content",
  artifactDigest(candidateDigestA, "candidate_output_sha256") !==
    artifactDigest(candidateDigestChanged, "candidate_output_sha256"),
  "material artifact content did not change its digest",
);

const methodMatrixDigestA = {
  schema: "method_matrix.v1",
  actor_identity_id: "naruto_uzumaki",
  assignments: expectedTrainingInstances,
  method_matrix_sha256: "stored-a",
};
const methodMatrixDigestB = { ...methodMatrixDigestA, method_matrix_sha256: "stored-b" };
const methodMatrixDigestChanged = {
  ...methodMatrixDigestA,
  assignments: expectedTrainingInstances.map((assignment, index) =>
    index === 0 ? { ...assignment, method_profile_id: "changed-method.v1" } : assignment),
};
record(
  "method_matrix_self_digest_omitted",
  artifactDigest(methodMatrixDigestA, "method_matrix_sha256") ===
    artifactDigest(methodMatrixDigestB, "method_matrix_sha256"),
  "stored method-matrix digest changed its own projection",
);
record(
  "method_matrix_digest_binds_assignments",
  artifactDigest(methodMatrixDigestA, "method_matrix_sha256") !==
    artifactDigest(methodMatrixDigestChanged, "method_matrix_sha256"),
  "method assignment change did not change the matrix digest",
);

const envelopeDigestA = {
  schema: "naruto_training_instance_envelope.v1",
  actor_identity_id: "naruto_uzumaki",
  instance_id: "naruto_clone_integrator",
  assigned_method_profile_id: "naruto_integrative_method.v1",
  source_packet_sha256: "source-sha",
  method_matrix_sha256: "matrix-sha",
  training_guidance_packet_sha256: "guidance-sha",
  envelope_sha256: "stored-a",
};
const envelopeDigestB = { ...envelopeDigestA, envelope_sha256: "stored-b" };
const envelopeDigestChanged = {
  ...envelopeDigestA,
  assigned_method_profile_id: "changed-method.v1",
};
record(
  "training_instance_envelope_self_digest_omitted",
  artifactDigest(envelopeDigestA, "envelope_sha256") ===
    artifactDigest(envelopeDigestB, "envelope_sha256"),
  "stored envelope digest changed its own projection",
);
record(
  "training_instance_envelope_digest_binds_assignment",
  artifactDigest(envelopeDigestA, "envelope_sha256") !==
    artifactDigest(envelopeDigestChanged, "envelope_sha256"),
  "envelope method change did not change its digest",
);

const digestManifest = {
  schema: "protocol_run_manifest.v1",
  run_id: "run-1",
  task_id: "task-1",
  source_packet_sha256: "source-sha",
  current_phase: "source_packet",
  phase_integrity: {
    moderator_reconcile_complete: "not_reached",
    safety_report_complete: "not_reached",
    synthesis_provenance_checked: "not_reached",
    final_qa_complete_or_not_required: "not_reached",
  },
  moderator: { moderator_report_sha256: "" },
  safety_supervisor: { preflight_status: "pass", report_complete: false, safety_report_sha256: "" },
  checkpoint_hashes: Object.fromEntries(protocolCheckpointOrder.map((name) => [name, ""])),
  manifest_sha256: "",
};
const checkpointArtifacts = [];
let digestSafetyReport;
for (const phase of protocolCheckpointOrder) {
  digestManifest.current_phase = phase;
  if (phase === "reconcile") {
    digestManifest.phase_integrity.moderator_reconcile_complete = "pass";
    digestManifest.moderator.moderator_report_sha256 = "moderator-report-sha";
  }
  if (phase === "safety_report") {
    digestSafetyReport = {
      schema: "safety_report.v1",
      protocol_run_manifest_reconcile_checkpoint_sha256: digestManifest.checkpoint_hashes.reconcile,
      protected_boundary_status: "pass",
      safety_report_sha256: "stored-value-does-not-participate",
    };
    digestSafetyReport.safety_report_sha256 = artifactDigest(digestSafetyReport, "safety_report_sha256");
    digestManifest.safety_supervisor.safety_report_sha256 = digestSafetyReport.safety_report_sha256;
    digestManifest.safety_supervisor.report_complete = true;
    digestManifest.phase_integrity.safety_report_complete = "pass";
  }
  if (phase === "synthesis") digestManifest.phase_integrity.synthesis_provenance_checked = "pass";
  if (phase === "qa") digestManifest.phase_integrity.final_qa_complete_or_not_required = "pass";
  const checkpoint = createProtocolCheckpoint(digestManifest, phase);
  checkpointArtifacts.push(checkpoint);
  digestManifest.checkpoint_hashes[phase] = checkpoint.checkpoint_sha256;
}
const finalManifestDigest = artifactDigest(digestManifest, "manifest_sha256");
const changedSafetyManifest = JSON.parse(JSON.stringify(digestManifest));
changedSafetyManifest.safety_supervisor.safety_report_sha256 = "changed-safety-digest";
const tamperedCheckpoints = JSON.parse(JSON.stringify(checkpointArtifacts));
tamperedCheckpoints[5].manifest_snapshot.current_phase = "tampered";
const reorderedCheckpoints = JSON.parse(JSON.stringify(checkpointArtifacts));
[reorderedCheckpoints[4], reorderedCheckpoints[5]] = [reorderedCheckpoints[5], reorderedCheckpoints[4]];
record(
  "manifest_reconcile_safety_acyclic",
  digestSafetyReport.protocol_run_manifest_reconcile_checkpoint_sha256 ===
    checkpointArtifacts[protocolCheckpointOrder.indexOf("reconcile")].checkpoint_sha256 &&
    checkpointArtifacts[protocolCheckpointOrder.indexOf("reconcile")].checkpoint_sha256 ===
      artifactDigest(checkpointArtifacts[protocolCheckpointOrder.indexOf("reconcile")], "checkpoint_sha256"),
  "safety report does not bind the preserved reconcile checkpoint",
);
record(
  "protocol_checkpoint_chain_complete",
  verifyProtocolCheckpointChain(checkpointArtifacts, digestManifest),
  "complete nine-phase checkpoint chain failed verification",
);
record(
  "protocol_checkpoint_chain_tamper_detected",
  !verifyProtocolCheckpointChain(tamperedCheckpoints, digestManifest) &&
    !verifyProtocolCheckpointChain(reorderedCheckpoints, digestManifest) &&
    !verifyProtocolCheckpointChain(checkpointArtifacts.slice(0, -1), digestManifest),
  "tampered, reordered, or incomplete checkpoint chain was accepted",
);
record(
  "manifest_final_digest_binds_safety",
  finalManifestDigest !== artifactDigest(changedSafetyManifest, "manifest_sha256"),
  "final manifest digest did not bind the safety report digest",
);
const postQaConsensusDraft = {
  schema: "consensus_report.v1",
  task_id: "task-1",
  protocol_run_manifest_sha256: "",
  moderator_report_sha256: "moderator-report-sha",
  safety_report_sha256: digestSafetyReport.safety_report_sha256,
  result_status: "verified_consensus",
  hokage_synthesis: "final semantic result",
  final_qa: { status: "pass" },
};
const postQaConsensusFinal = {
  ...postQaConsensusDraft,
  protocol_run_manifest_sha256: finalManifestDigest,
};
const postQaChangedFields = Object.keys(postQaConsensusFinal).filter(
  (key) => JSON.stringify(postQaConsensusFinal[key]) !== JSON.stringify(postQaConsensusDraft[key]),
);
record(
  "consensus_post_qa_manifest_hash_only",
  JSON.stringify(postQaChangedFields) === JSON.stringify(["protocol_run_manifest_sha256"]),
  "post-QA consensus finalization changed more than the final manifest hash",
);

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
    ".github/workflows/ci.yml",
    ".gitattributes",
    ".gitignore",
    "CHANGELOG.md",
    "LICENSE",
    "NOTICE.md",
    "README.md",
    "SECURITY.md",
    "SHA256SUMS",
    "assets/naruto-codex-deliberation-council-banner.png",
    "docs/compatibility.md",
    "docs/naming-risk.md",
    "docs/release-acceptance-v1.0.0.md",
    "docs/releases/v1.0.0.md",
    "integrations/framecore-workspace.md",
    "manifest/package-manifest.json",
    "manifest/assets.json",
    "scripts/checksums.mjs",
    "scripts/install.mjs",
    "scripts/release-readiness.mjs",
    "scripts/test-install-lifecycle.mjs",
    "scripts/test-install-security.mjs",
    "scripts/validate.mjs",
  ];
  for (const file of requiredPackageFiles) {
    record(`package_file:${file}`, existsSync(join(workspaceRoot, file)), "missing package file");
  }

  const readme = read(join(workspaceRoot, "README.md"));
  const notice = read(join(workspaceRoot, "NOTICE.md"));
  const packageManifest = parseJson(join(workspaceRoot, "manifest/package-manifest.json"));
  const assetManifest = parseJson(join(workspaceRoot, "manifest/assets.json"));

  record("readme_install", /^## Install$/m.test(readme), "README install section missing");
  record("readme_update", /^## Update$/m.test(readme), "README update section missing");
  record("readme_restart", /restart Codex/i.test(readme), "README restart guidance missing");
  record("readme_positive_trigger", readme.includes("$naruto Review this architecture"), "positive trigger missing");
  record("readme_negative_trigger", readme.includes("$naruto: Review this architecture"), "negative trigger missing");
  record("readme_no_generic_fallback", readme.includes("cannot be replaced by `default`, `worker`, or"), "no-fallback note missing");
  record("readme_validation", readme.includes("npm test"), "single validation command missing");
  record("readme_package_version", readme.includes(`Standalone package version: \`${packageJson?.version}\``), "README package version mismatch");
  record("readme_loop_contract", readme.includes("`loop_control_fit`") && readme.includes("`max_iterations: 1`"), "bounded loop contract missing");
  record("readme_integrity_contract", readme.includes("`protocol_run_manifest.v1`") && /opaque\s+thread-handle hashes/.test(readme) && readme.includes("experience-transfer"), "phase-integrity contract missing");
  record("readme_epistemic_contract", readme.includes("independence key") && readme.includes("anti-groupthink") && readme.includes("role-blind"), "evidence or QA contract missing");
  record("readme_supervision_contract", readme.includes("`training_guidance_packet.v1`") && readme.includes("`safety_control_packet.v1`") && readme.includes("Hokage") && readme.includes("Kakashi") && readme.includes("Yamato"), "public parent or supervision contract missing");
  record("readme_training_instance_contract", readme.includes("`actor_identity_id: naruto_uzumaki`") && readme.includes("`method_matrix.v1`") && readme.includes("`naruto_training_instance_envelope.v1`"), "README shared-identity or method-assignment contract missing");
  record("readme_tsunade_parent", readme.includes("Tsunade Senju, Fifth Hokage") && readme.includes("not a seventh child profile"), "Tsunade must be the parent-process public identity, not a bundled profile");
  record("readme_final_qa_role", readme.includes("independent `final_qa` reviewer") && readme.includes("not bundled"), "README must disclose the conditional host-provided final QA role");
  record("readme_fan_art_scope", /unofficial fan art/i.test(readme) && /excluded from the MIT/i.test(readme), "README fan-art rights scope missing");
  record("notice_no_affiliation", /not affiliated[\s\S]+not endorsed/i.test(notice), "no-affiliation notice missing");
  record(
    "package_manifest_layout",
    packageManifest?.schema === "codex_deliberation_package.v3" &&
      packageManifest?.layout?.skill_root === ".agents/skills/naruto" &&
      packageManifest?.layout?.profile_root === ".codex/agents" &&
      packageManifest?.layout?.asset_manifest === "manifest/assets.json",
    "package manifest layout mismatch",
  );
  record(
    "package_manifest_profiles",
    JSON.stringify([...(packageManifest?.required_profiles ?? [])].sort()) ===
      JSON.stringify(expectedAgents.map(({ runtime }) => `${runtime}.toml`).sort()) &&
      packageManifest?.bundled_profile_count === 6,
    "package manifest must list exactly six read-only profiles",
  );
  record(
    "package_manifest_training_instance_model",
    packageManifest?.training_instance_model?.actor_identity_id === "naruto_uzumaki" &&
      packageManifest?.training_instance_model?.instance_kind === "shadow_clone" &&
      packageManifest?.training_instance_model?.task_scope === "complete" &&
      JSON.stringify(packageManifest?.training_instance_model?.assignments) ===
        JSON.stringify(expectedTrainingInstances.map(({ instance_id, method_profile_id }) => [instance_id, method_profile_id])),
    "package manifest training-instance identity or assignments mismatch",
  );
  record(
    "package_profile_files",
    JSON.stringify(listFiles(join(workspaceRoot, ".codex/agents")).filter((file) => file.endsWith(".toml")).sort()) ===
      JSON.stringify(expectedAgents.map(({ runtime }) => `${runtime}.toml`).sort()),
    "package must bundle exactly the six manifest profiles",
  );
  record(
    "package_manifest_protocol_artifacts",
    JSON.stringify([...(packageManifest?.required_protocol_artifacts ?? [])].sort()) ===
      JSON.stringify([
        "references/prior-art-assimilation.md",
        "templates/candidate-solution.md",
        "templates/consensus-report.md",
        "templates/method-matrix.md",
        "templates/protocol-checkpoint.md",
        "templates/protocol-run-manifest.md",
        "templates/safety-control.md",
        "templates/training-guidance.md",
        "templates/training-instance-envelope.md",
      ].sort()),
    "package manifest omits or adds protocol artifacts outside the 1.0 contract",
  );
  record(
    "package_manifest_public_parent",
    packageManifest?.public_parent_role_id === "hokage" &&
      packageManifest?.public_parent_identity_id === "tsunade_senju" &&
      packageManifest?.parent_role_profile_bundled === false,
    "Tsunade as Hokage must be the unbundled public parent identity",
  );
  record(
    "package_manifest_version",
    packageJson?.version === "1.0.0" &&
      packageManifest?.package_version === packageJson?.version,
    "package and manifest must use the exact 1.0.0 version",
  );
  record(
    "package_manifest_release",
    packageManifest?.release?.status === "stable" &&
      packageManifest?.release?.contract_version === "1.0.0" &&
      packageManifest?.release?.node_minimum_major === 22 &&
      JSON.stringify(packageManifest?.release?.ci_node_majors) === JSON.stringify([22, 24]) &&
      packageManifest?.release?.runtime_capability_policy === "fail_closed",
    "stable release metadata, Node matrix, or runtime capability policy mismatch",
  );
  record(
    "package_manifest_banner",
    packageManifest?.assets?.length === 1 &&
      packageManifest?.assets?.[0]?.path === "assets/naruto-codex-deliberation-council-banner.png" &&
      packageManifest?.assets?.[0]?.asset_id === "naruto_codex_deliberation_council_banner" &&
      packageManifest?.assets?.[0]?.version === 3 &&
      packageManifest?.assets?.[0]?.kind === "readme_banner" &&
      packageManifest?.assets?.[0]?.media_type === "image/png" &&
      packageManifest?.assets?.[0]?.license_scope === "unofficial_fan_art_excluded_from_mit" &&
      packageManifest?.fan_art_included_in_mit === false,
    "banner manifest or fan-art license scope mismatch",
  );
  record(
    "package_asset_traceability",
    assetManifest?.schema === "codex_deliberation_asset_manifest.v1" &&
      assetManifest?.assets?.length === 1 &&
      assetManifest?.assets?.[0]?.asset_id === packageManifest?.assets?.[0]?.asset_id &&
      assetManifest?.assets?.[0]?.version === packageManifest?.assets?.[0]?.version &&
      assetManifest?.assets?.[0]?.path === packageManifest?.assets?.[0]?.path &&
      assetManifest?.assets?.[0]?.sha256 === "fdd77292c3778aee20d0a4bc608b4b5567223fd44de6e443ebff82228ae00c46" &&
      assetManifest?.assets?.[0]?.sha256 ===
        sha256(readFileSync(join(workspaceRoot, "assets/naruto-codex-deliberation-council-banner.png"))) &&
      assetManifest?.assets?.[0]?.qa?.status === "accepted" &&
      assetManifest?.assets?.[0]?.distribution?.delivery_status === "local_repository_only" &&
      assetManifest?.assets?.[0]?.distribution?.rights_clearance === "not_cleared",
    "asset identity, digest, QA, delivery, or rights traceability mismatch",
  );
  record(
    "package_manifest_distribution",
    packageManifest?.distribution?.github_source_ready === true &&
      packageManifest?.distribution?.remote_included === false &&
      packageManifest?.distribution?.remote_meaning === "no_remote_configuration_or_push_automation",
    "GitHub source-ready distribution metadata mismatch",
  );
  record(
    "package_manifest_host_final_qa",
    packageManifest?.host_role_requirements?.length === 1 &&
      packageManifest?.host_role_requirements?.[0]?.role_id === "final_qa" &&
      packageManifest?.host_role_requirements?.[0]?.runtime_binding === "host_provided" &&
      packageManifest?.host_role_requirements?.[0]?.bundled_profile === false &&
      packageManifest?.host_role_requirements?.[0]?.required_when === "consequential_result" &&
      packageManifest?.host_role_requirements?.[0]?.review_mode === "role_blind_independent" &&
      packageManifest?.host_role_requirements?.[0]?.unavailable_policy === "blocked",
    "conditional host-provided final QA requirement mismatch",
  );
  record(
    "package_manifest_legacy_migration",
    packageManifest?.migration?.legacy_0_3_installation_policy === "fail_closed_manual_cleanup" &&
      packageManifest?.migration?.legacy_profile_paths?.length === 8 &&
      JSON.stringify(packageManifest?.migration?.supported_in_place_from) === JSON.stringify(["0.4.x"]),
    "package manifest must declare fail-closed manual cleanup for eight legacy 0.3 paths",
  );
  record("package_private", packageJson?.private === true, "package must not be npm-publishable");
  record("package_no_dependencies", !packageJson?.dependencies && !packageJson?.devDependencies, "package must stay dependency-free");
  record("package_node_version", packageJson?.engines?.node === ">=22", "Node engine requirement mismatch");

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

  const textExtensions = new Set(["", ".json", ".md", ".mjs", ".toml", ".yaml", ".yml"]);
  const textFiles = allPackageFiles.filter(
    (path) =>
      !path.startsWith(".git/") &&
      path !== "SHA256SUMS" &&
      textExtensions.has(extname(path).toLowerCase()),
  );
  const privatePathHits = [];
  const secretHits = [];
  const internalRoleNameHits = [];
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
      path !== "integrations/framecore-workspace.md" &&
      forbiddenInternalRolePattern.test(text)
    ) {
      internalRoleNameHits.push(path);
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
  record("package_internal_role_name_absent", internalRoleNameHits.length === 0, internalRoleNameHits.join(", "));
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
