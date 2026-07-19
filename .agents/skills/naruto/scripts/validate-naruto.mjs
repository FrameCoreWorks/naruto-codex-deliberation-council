#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const installValidationMode = process.env.NARUTO_INSTALL_VALIDATION_MODE === "1";
const installValidationRoots = {
  skill: process.env.NARUTO_INSTALL_VALIDATOR_SKILL_ROOT,
  profile: process.env.NARUTO_INSTALL_VALIDATOR_PROFILE_ROOT,
  workspace: process.env.NARUTO_INSTALL_VALIDATOR_WORKSPACE_ROOT,
};
if (installValidationMode && Object.values(installValidationRoots).some((value) => !value)) {
  console.error("Installer validation mode requires explicit skill, profile, and workspace roots.");
  process.exit(2);
}
const skillRoot = installValidationMode
  ? resolve(installValidationRoots.skill)
  : resolve(scriptDir, "..");
const workspaceRoot = installValidationMode
  ? resolve(installValidationRoots.workspace)
  : resolve(skillRoot, "../../..");
const installProfileRoot = installValidationMode
  ? resolve(installValidationRoots.profile)
  : null;
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
    contracts: ["naruto_moderator.v1", "naruto_training_guidance.v1", "naruto_commit_barrier.v1", "naruto_phase_integrity.v1", "naruto_groupthink_audit.v1", "naruto_semantic_redundancy_audit.v1"],
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

function own(value, key) {
  return Object.prototype.hasOwnProperty.call(value ?? {}, key);
}

function parseQuotedScalar(value, context) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(context + ": empty scalar");
  if (trimmed.startsWith('"')) {
    if (!trimmed.endsWith('"')) throw new Error(context + ": unclosed double-quoted scalar");
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed !== "string") throw new Error("not a string");
      return parsed;
    } catch (error) {
      throw new Error(context + ": invalid double-quoted scalar (" + error.message + ")");
    }
  }
  if (trimmed.startsWith("'")) {
    if (!trimmed.endsWith("'")) throw new Error(context + ": unclosed single-quoted scalar");
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  if (trimmed.includes(" #")) {
    throw new Error(context + ": inline comments are outside the accepted profile/card subset");
  }
  return trimmed;
}

const agentCardScalarKeys = new Set([
  "id",
  "runtime_id",
  "name",
  "actor_identity_id",
  "training_instance_id",
  "method_profile_id",
  "function",
  "tier",
  "activation",
  "done_when",
]);
const agentCardListKeys = new Set([
  "behavior_contract_ids",
  "owns",
  "inputs",
  "outputs",
  "handoff_to",
  "forbidden",
]);

function parseStrictAgentCardYaml(text) {
  const result = {};
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (line.includes("\t")) throw new Error("line " + (index + 1) + ": tabs are forbidden");
    const match = line.match(/^([a-z][a-z0-9_]*):(?:\s*(.*))?$/);
    if (!match) throw new Error("line " + (index + 1) + ": unsupported YAML structure");
    const [, key, rawValue = ""] = match;
    if (!agentCardScalarKeys.has(key) && !agentCardListKeys.has(key)) {
      throw new Error("line " + (index + 1) + ": unknown top-level key " + key);
    }
    if (own(result, key)) throw new Error("line " + (index + 1) + ": duplicate key " + key);
    if (agentCardScalarKeys.has(key)) {
      if (!rawValue.trim()) throw new Error("line " + (index + 1) + ": " + key + " requires a scalar");
      result[key] = parseQuotedScalar(rawValue, "line " + (index + 1) + " " + key);
      continue;
    }
    if (rawValue.trim()) throw new Error("line " + (index + 1) + ": " + key + " must be a block list");
    const items = [];
    while (index + 1 < lines.length) {
      const next = lines[index + 1];
      if (!next.trim()) {
        index += 1;
        continue;
      }
      const itemMatch = next.match(/^  -\s+(.+)$/);
      if (!itemMatch) break;
      index += 1;
      items.push(parseQuotedScalar(itemMatch[1], "line " + (index + 1) + " " + key));
    }
    if (items.length === 0) throw new Error("line " + (index + 1) + ": " + key + " requires at least one item");
    result[key] = items;
  }
  const required = [
    "id",
    "runtime_id",
    "name",
    "function",
    "tier",
    "behavior_contract_ids",
    "activation",
    "owns",
    "inputs",
    "outputs",
    "handoff_to",
    "forbidden",
    "done_when",
  ];
  for (const key of required) {
    if (!own(result, key)) throw new Error("missing required key " + key);
  }
  const trainingKeys = ["actor_identity_id", "training_instance_id", "method_profile_id"];
  const trainingKeyCount = trainingKeys.filter((key) => own(result, key)).length;
  if (trainingKeyCount !== 0 && trainingKeyCount !== trainingKeys.length) {
    throw new Error("training-instance identity keys must be present as one complete set");
  }
  return result;
}

function parseStrictOpenAiYaml(text) {
  const result = {};
  const allowed = {
    interface: new Set(["display_name", "short_description", "default_prompt"]),
    policy: new Set(["allow_implicit_invocation"]),
  };
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  let section = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (line.includes("\t")) throw new Error("line " + (index + 1) + ": tabs are forbidden");
    const sectionMatch = line.match(/^([a-z][a-z0-9_]*):\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      if (!own(allowed, section)) throw new Error("line " + (index + 1) + ": unknown section " + section);
      if (own(result, section)) throw new Error("line " + (index + 1) + ": duplicate section " + section);
      result[section] = {};
      continue;
    }
    const valueMatch = line.match(/^  ([a-z][a-z0-9_]*):\s*(.+)$/);
    if (!valueMatch || !section) throw new Error("line " + (index + 1) + ": unsupported YAML structure");
    const [, key, rawValue] = valueMatch;
    if (!allowed[section].has(key)) {
      throw new Error("line " + (index + 1) + ": unknown " + section + " key " + key);
    }
    if (own(result[section], key)) {
      throw new Error("line " + (index + 1) + ": duplicate " + section + "." + key);
    }
    if (section === "policy" && key === "allow_implicit_invocation") {
      if (!/^(?:true|false)$/.test(rawValue.trim())) {
        throw new Error("line " + (index + 1) + ": " + section + "." + key + " must be boolean");
      }
      result[section][key] = rawValue.trim() === "true";
    } else {
      result[section][key] = parseQuotedScalar(
        rawValue,
        "line " + (index + 1) + " " + section + "." + key,
      );
    }
  }
  if (JSON.stringify(Object.keys(result)) !== JSON.stringify(["interface", "policy"])) {
    throw new Error("openai.yaml must contain exactly interface then policy");
  }
  for (const key of allowed.interface) {
    if (!own(result.interface, key)) throw new Error("missing interface." + key);
  }
  if (!own(result.policy, "allow_implicit_invocation")) {
    throw new Error("missing policy.allow_implicit_invocation");
  }
  return result;
}

const profileTomlSchema = {
  name: "string",
  description: "string",
  sandbox_mode: "string",
  approval_policy: "string",
  nickname_candidates: "string_array",
  developer_instructions: "multiline_string",
};

function parseStrictProfileToml(text) {
  const result = {};
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (line.includes("\t")) throw new Error("line " + (index + 1) + ": tabs are forbidden");
    const match = line.match(/^([a-z][a-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) throw new Error("line " + (index + 1) + ": unsupported TOML structure");
    const [, key, rawValue] = match;
    const type = profileTomlSchema[key];
    if (!type) throw new Error("line " + (index + 1) + ": unknown top-level key " + key);
    if (own(result, key)) throw new Error("line " + (index + 1) + ": duplicate key " + key);
    if (type === "multiline_string") {
      if (rawValue !== '"""') {
        throw new Error("line " + (index + 1) + ": " + key + " must start with triple quotes");
      }
      const body = [];
      let closed = false;
      while (index + 1 < lines.length) {
        index += 1;
        if (lines[index] === '"""') {
          closed = true;
          break;
        }
        body.push(lines[index]);
      }
      if (!closed) throw new Error("line " + (index + 1) + ": unclosed multiline string " + key);
      result[key] = body.join("\n");
      continue;
    }
    if (type === "string_array") {
      let parsed;
      try {
        parsed = JSON.parse(rawValue);
      } catch {
        throw new Error("line " + (index + 1) + ": invalid or unclosed string array " + key);
      }
      if (
        !Array.isArray(parsed) ||
        parsed.length === 0 ||
        parsed.some((item) => typeof item !== "string" || !item)
      ) {
        throw new Error("line " + (index + 1) + ": " + key + " must be a non-empty string array");
      }
      result[key] = parsed;
      continue;
    }
    if (
      !(
        (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'"))
      )
    ) {
      throw new Error("line " + (index + 1) + ": " + key + " must be a quoted TOML string");
    }
    result[key] = parseQuotedScalar(rawValue, "line " + (index + 1) + " " + key);
  }
  for (const key of Object.keys(profileTomlSchema)) {
    if (!own(result, key)) throw new Error("missing required key " + key);
  }
  return result;
}

function parseAndRecord(name, parser, text) {
  try {
    const value = parser(text);
    record(name, true);
    return value;
  } catch (error) {
    record(name, false, error.message);
    return null;
  }
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

function finalQaReviewArtifactProjection(consensusReport) {
  const projection = JSON.parse(JSON.stringify(consensusReport));
  delete projection.protocol_run_manifest_sha256;
  delete projection.final_qa;
  return projection;
}

function finalQaReviewArtifactDigest(consensusReport) {
  return sha256(finalQaReviewArtifactProjection(consensusReport));
}

const allowedFinalQaBoundaryKeys = new Set([
  "candidate_role_identities_excluded",
  "role_prestige_excluded",
  "completion_order_excluded",
  "vote_counts_excluded",
  "raw_reasoning_included",
]);
const finalQaRequestKeys = new Set([
  "schema",
  "request_id",
  "task_id",
  "consequential_reason",
  "final_artifact_ref",
  "final_artifact_sha256",
  "acceptance_criteria",
  "evidence_refs",
  "candidate_role_identities_excluded",
  "role_prestige_excluded",
  "completion_order_excluded",
  "vote_counts_excluded",
  "raw_reasoning_included",
  "request_sha256",
]);
const finalQaResultKeys = new Set([
  "schema",
  "request_id",
  "task_id",
  "request_sha256",
  "final_artifact_sha256",
  "reviewer_binding",
  "independent_reviewer_attestation",
  "role_blind_attestation",
  "status",
  "findings",
  "raw_reasoning_included",
  "result_sha256",
]);
const finalQaFindingKeys = new Set([
  "criterion_id",
  "observed",
  "expected",
  "evidence_refs",
  "reproducible_next_check",
]);
const consensusFinalQaKeys = new Set([
  "required",
  "status",
  "effective_result_status",
  "request_id",
  "request_sha256",
  "result_sha256",
  "final_artifact_sha256",
  "reviewer_binding",
  "request_result_artifact_binding_verified",
  "independent_reviewer_attestation",
  "role_blind_attestation",
  "review_packet_scope",
  "candidate_role_identities_excluded",
  "findings",
]);
const manifestFinalQaKeys = new Set([
  "required",
  "request_id",
  "request_sha256",
  "result_sha256",
  "final_artifact_sha256",
  "reviewer_binding",
  "request_result_artifact_binding_verified",
  "independent_reviewer_attestation",
  "role_blind_attestation",
  "status",
  "effective_result_status",
]);

function hasExactKeys(value, allowedKeys) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => allowedKeys.has(key))
  );
}

function hasForbiddenFinalQaPayloadKey(value) {
  if (Array.isArray(value)) return value.some(hasForbiddenFinalQaPayloadKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => {
    const normalized = key
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const carriesExcludedContent =
      /(^|_)(candidate_role_identities|candidate_role_ids|candidate_identities|candidate_outputs?|candidate_profiles?|candidate_methods?|role_assignments?|method_assignments?|actor_identity_ids?|instance_ids?|role_prestige|completion_order|vote_counts?|raw_reasoning|raw_transcripts?|raw_outputs?|blind_outputs?|candidate_transcripts?)(_|$)/.test(
        normalized,
      );
    return (
      (carriesExcludedContent && !allowedFinalQaBoundaryKeys.has(normalized)) ||
      hasForbiddenFinalQaPayloadKey(nested)
    );
  });
}

function validatesFinalQaBinding(request, result, consensusReport) {
  const nonEmpty = (value) => typeof value === "string" && value.length > 0;
  const sha = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
  const stringArray = (value) =>
    Array.isArray(value) && value.every((item) => typeof item === "string");
  const requestValid =
    hasExactKeys(request, finalQaRequestKeys) &&
    request?.schema === "final_qa_review_request.v1" &&
    nonEmpty(request.request_id) &&
    nonEmpty(request.task_id) &&
    request.task_id === consensusReport?.task_id &&
    nonEmpty(request.consequential_reason) &&
    request.final_artifact_ref === "consensus_report.qa_review_projection" &&
    sha(request.final_artifact_sha256) &&
    consensusReport?.schema === "consensus_report.v1" &&
    !hasForbiddenFinalQaPayloadKey(finalQaReviewArtifactProjection(consensusReport)) &&
    request.final_artifact_sha256 === finalQaReviewArtifactDigest(consensusReport) &&
    stringArray(request.acceptance_criteria) &&
    request.acceptance_criteria.length > 0 &&
    request.acceptance_criteria.every(nonEmpty) &&
    stringArray(request.evidence_refs) &&
    request.candidate_role_identities_excluded === true &&
    request.role_prestige_excluded === true &&
    request.completion_order_excluded === true &&
    request.vote_counts_excluded === true &&
    request.raw_reasoning_included === false &&
    !hasForbiddenFinalQaPayloadKey(request) &&
    sha(request.request_sha256) &&
    request.request_sha256 === artifactDigest(request, "request_sha256");
  const findingsValid =
    Array.isArray(result?.findings) &&
    result.findings.every(
      (finding) =>
        hasExactKeys(finding, finalQaFindingKeys) &&
        nonEmpty(finding?.criterion_id) &&
        nonEmpty(finding?.observed) &&
        nonEmpty(finding?.expected) &&
        stringArray(finding?.evidence_refs) &&
        nonEmpty(finding?.reproducible_next_check),
    ) &&
    ((result?.status === "pass" && result.findings.length === 0) ||
      (["fail", "blocked"].includes(result?.status) && result.findings.length > 0));
  const resultValid =
    hasExactKeys(result, finalQaResultKeys) &&
    result?.schema === "final_qa_review_result.v1" &&
    result?.reviewer_binding === "host_provided" &&
    result?.independent_reviewer_attestation === true &&
    result?.role_blind_attestation === true &&
    ["pass", "fail", "blocked"].includes(result?.status) &&
    findingsValid &&
    result?.raw_reasoning_included === false &&
    !hasForbiddenFinalQaPayloadKey(result) &&
    sha(result?.result_sha256) &&
    result.result_sha256 === artifactDigest(result, "result_sha256");
  return (
    requestValid &&
    resultValid &&
    result.request_id === request.request_id &&
    result.task_id === request.task_id &&
    result.request_sha256 === request.request_sha256 &&
    result.final_artifact_sha256 === request.final_artifact_sha256
  );
}

function validatesRecordedFinalQaBinding(request, result, consensusReport, runManifest) {
  if (!validatesFinalQaBinding(request, result, consensusReport)) return false;
  const consensusQa = consensusReport?.final_qa;
  const manifestQa = runManifest?.qa;
  const expectedEffectiveResultStatus =
    result.status === "pass" ? consensusReport?.result_status : "blocked";
  const commonBindingMatches = (qa) =>
    qa?.request_id === request.request_id &&
    qa?.request_sha256 === request.request_sha256 &&
    qa?.result_sha256 === result.result_sha256 &&
    qa?.final_artifact_sha256 === request.final_artifact_sha256 &&
    qa?.reviewer_binding === result.reviewer_binding &&
    qa?.request_result_artifact_binding_verified === true &&
    qa?.independent_reviewer_attestation === result.independent_reviewer_attestation &&
    qa?.role_blind_attestation === result.role_blind_attestation &&
    qa?.status === result.status &&
    qa?.effective_result_status === expectedEffectiveResultStatus;
  return (
    hasExactKeys(consensusQa, consensusFinalQaKeys) &&
    hasExactKeys(manifestQa, manifestFinalQaKeys) &&
    consensusQa?.required === true &&
    manifestQa?.required === true &&
    consensusQa?.review_packet_scope === "final_artifact_criteria_evidence_only" &&
    consensusQa?.candidate_role_identities_excluded === true &&
    typeof runManifest?.run_id === "string" &&
    runManifest.run_id.length > 0 &&
    runManifest?.task_id === request.task_id &&
    typeof runManifest?.manifest_sha256 === "string" &&
    /^[a-f0-9]{64}$/.test(runManifest.manifest_sha256) &&
    runManifest.manifest_sha256 === artifactDigest(runManifest, "manifest_sha256") &&
    consensusReport?.protocol_run_manifest_sha256 === runManifest.manifest_sha256 &&
    runManifest?.phase_integrity?.final_qa_complete_or_not_required === "pass" &&
    commonBindingMatches(consensusQa) &&
    commonBindingMatches(manifestQa) &&
    JSON.stringify(consensusQa.findings) === JSON.stringify(result.findings)
  );
}

function validatesNotRequiredFinalQaRecord(consensusReport, runManifest) {
  const consensusQa = consensusReport?.final_qa;
  const manifestQa = runManifest?.qa;
  const qaIsNotRequired = (qa) =>
    qa?.required === false &&
    qa?.status === "not_required" &&
    qa?.effective_result_status === consensusReport?.result_status &&
    qa?.request_id === "" &&
    qa?.request_sha256 === "" &&
    qa?.result_sha256 === "" &&
    qa?.final_artifact_sha256 === "" &&
    qa?.reviewer_binding === "not_required" &&
    qa?.request_result_artifact_binding_verified === "not_required" &&
    qa?.independent_reviewer_attestation === "not_required" &&
    qa?.role_blind_attestation === "not_required";
  return (
    hasExactKeys(consensusQa, consensusFinalQaKeys) &&
    hasExactKeys(manifestQa, manifestFinalQaKeys) &&
    qaIsNotRequired(consensusQa) &&
    qaIsNotRequired(manifestQa) &&
    consensusQa.review_packet_scope === "not_required" &&
    consensusQa.candidate_role_identities_excluded === true &&
    Array.isArray(consensusQa.findings) &&
    consensusQa.findings.length === 0 &&
    runManifest?.task_id === consensusReport?.task_id &&
    runManifest?.phase_integrity?.final_qa_complete_or_not_required === "pass" &&
    /^[a-f0-9]{64}$/.test(runManifest?.manifest_sha256 ?? "") &&
    runManifest.manifest_sha256 === artifactDigest(runManifest, "manifest_sha256") &&
    consensusReport?.protocol_run_manifest_sha256 === runManifest.manifest_sha256
  );
}

function finalDeliveryView(consensusReport) {
  const qa = consensusReport?.final_qa;
  const resultStatus = consensusReport?.result_status;
  const validResultStatuses = new Set([
    "verified_consensus",
    "provisional_consensus",
    "structured_dispute",
    "blocked",
  ]);
  const boundReview =
    qa?.request_result_artifact_binding_verified === true &&
    qa?.reviewer_binding === "host_provided" &&
    qa?.independent_reviewer_attestation === true &&
    qa?.role_blind_attestation === true;
  const requiredPass =
    qa?.required === true &&
    qa?.status === "pass" &&
    boundReview &&
    validResultStatuses.has(qa?.effective_result_status) &&
    qa.effective_result_status === resultStatus;
  const notRequired =
    qa?.required === false &&
    qa?.status === "not_required" &&
    qa?.request_result_artifact_binding_verified === "not_required" &&
    qa?.reviewer_binding === "not_required" &&
    qa?.independent_reviewer_attestation === "not_required" &&
    qa?.role_blind_attestation === "not_required" &&
    validResultStatuses.has(qa?.effective_result_status) &&
    qa.effective_result_status === resultStatus;
  if (!requiredPass && !notRequired) {
    return {
      result_status: "blocked",
      stop_decision: "blocked",
      next_action: "address_final_qa_findings_or_rerun",
    };
  }
  if (qa.effective_result_status === "blocked") {
    return {
      result_status: "blocked",
      stop_decision: "blocked",
      next_action: "address_final_qa_findings_or_rerun",
    };
  }
  return {
    result_status: qa.effective_result_status,
    stop_decision: consensusReport?.stop_decision,
    next_action: consensusReport?.next_action,
  };
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
  if (!Array.isArray(checkpoints) || checkpoints.length !== protocolCheckpointOrder.length) return false;
  const chainValid = checkpoints.every((checkpoint, index) => {
    const expectedPrevious = index === 0 ? null : checkpoints[index - 1].checkpoint_sha256;
    const snapshot = checkpoint?.manifest_snapshot;
    return checkpoint.schema === "protocol_checkpoint.v1" &&
      checkpoint.run_id === manifest.run_id &&
      checkpoint.task_id === manifest.task_id &&
      checkpoint.sequence === index + 1 &&
      checkpoint.phase === protocolCheckpointOrder[index] &&
      checkpoint.previous_checkpoint_sha256 === expectedPrevious &&
      checkpoint.checkpoint_sha256 === artifactDigest(checkpoint, "checkpoint_sha256") &&
      manifest.checkpoint_hashes?.[checkpoint.phase] === checkpoint.checkpoint_sha256 &&
      snapshot &&
      typeof snapshot === "object" &&
      !Array.isArray(snapshot) &&
      snapshot.schema === manifest.schema &&
      snapshot.run_id === manifest.run_id &&
      snapshot.task_id === manifest.task_id &&
      snapshot.current_phase === checkpoint.phase &&
      !own(snapshot, "checkpoint_hashes") &&
      !own(snapshot, "manifest_sha256");
  });
  if (!chainValid) return false;
  const finalManifestSnapshot = JSON.parse(JSON.stringify(manifest));
  delete finalManifestSnapshot.checkpoint_hashes;
  delete finalManifestSnapshot.manifest_sha256;
  return sha256(checkpoints.at(-1)?.manifest_snapshot) === sha256(finalManifestSnapshot);
}

function rehashCheckpointChainForProbe(checkpoints, manifest) {
  for (let index = 0; index < checkpoints.length; index += 1) {
    checkpoints[index].previous_checkpoint_sha256 =
      index === 0 ? null : checkpoints[index - 1].checkpoint_sha256;
    checkpoints[index].checkpoint_sha256 = artifactDigest(
      checkpoints[index],
      "checkpoint_sha256",
    );
    manifest.checkpoint_hashes[checkpoints[index].phase] =
      checkpoints[index].checkpoint_sha256;
  }
}

function rebuildFinalQaCheckpoint(checkpoints, manifest) {
  const rebuilt = JSON.parse(JSON.stringify(checkpoints));
  const qaIndex = protocolCheckpointOrder.indexOf("qa");
  manifest.current_phase = "qa";
  manifest.manifest_sha256 = "";
  const qaCheckpoint = createProtocolCheckpoint(manifest, "qa");
  rebuilt[qaIndex] = qaCheckpoint;
  manifest.checkpoint_hashes.qa = qaCheckpoint.checkpoint_sha256;
  manifest.manifest_sha256 = artifactDigest(manifest, "manifest_sha256");
  return rebuilt;
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
  return fixture && typeof fixture === "object" &&
    fixture.has_complete_solution === true &&
    fixture.fixed_acceptance_criteria_preserved === true &&
    Number.isInteger(fixture.hypothesis_count) && fixture.hypothesis_count > 0 &&
    Number.isInteger(fixture.discriminating_test_count) && fixture.discriminating_test_count > 0 &&
    Number.isInteger(fixture.observable_count) && fixture.observable_count > 0 &&
    Number.isInteger(fixture.decision_threshold_count) && fixture.decision_threshold_count > 0 &&
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
  const requiredTypesValid =
    fixture &&
    typeof fixture === "object" &&
    typeof fixture.protected_action_without_normal_gate === "boolean" &&
    ["available", "unavailable"].includes(fixture.safety_supervisor) &&
    ["pass", "fail"].includes(fixture.training_control) &&
    ["pass", "fail", "fail_early_reveal", "not_reached"].includes(fixture.barrier) &&
    ["available", "unavailable"].includes(fixture.moderator) &&
    Number.isInteger(fixture.valid_commits) &&
    fixture.valid_commits >= 0 &&
    fixture.valid_commits <= 4 &&
    Number.isInteger(fixture.valid_same_target_followup_receipts) &&
    fixture.valid_same_target_followup_receipts >= 0 &&
    fixture.valid_same_target_followup_receipts <= 4 &&
    ["complete", "partial", "incomplete", "conflicting", "contaminated"].includes(
      fixture.evidence,
    ) &&
    ["none", "resolved", "unknown", "evidence_backed_unresolved"].includes(
      fixture.critical_objection,
    );
  if (!requiredTypesValid) return "blocked";
  if (
    fixture.protected_action_without_normal_gate === true ||
    fixture.safety_supervisor === "unavailable" ||
    fixture.training_control === "fail" ||
    fixture.barrier !== "pass" ||
    fixture.moderator !== "available" ||
    fixture.valid_commits < 3 ||
    fixture.valid_same_target_followup_receipts < 4
  ) {
    return "blocked";
  }
  if (fixture.critical_objection === "evidence_backed_unresolved") {
    return "structured_dispute";
  }
  if (
    fixture.valid_commits === 4 &&
    fixture.valid_same_target_followup_receipts === 4 &&
    fixture.evidence === "complete"
  ) {
    return "verified_consensus";
  }
  return "provisional_consensus";
}

function classifySupervisionFixture(fixture) {
  const requiredTypesValid =
    fixture &&
    typeof fixture === "object" &&
    ["available", "unavailable"].includes(fixture.safety_supervisor) &&
    typeof fixture.source_packet_available === "boolean" &&
    typeof fixture.source_packet_hash_matches === "boolean" &&
    typeof fixture.guidance_byte_identical === "boolean" &&
    typeof fixture.guidance_non_solution === "boolean" &&
    typeof fixture.instance_specific_coaching === "boolean" &&
    ["pass", "fail", "unverifiable"].includes(fixture.protected_boundaries) &&
    ["pass", "hold", "blocked"].includes(fixture.safety_status) &&
    Number.isInteger(fixture.hold_count) &&
    fixture.hold_count >= 0 &&
    fixture.hold_count <= 1;
  if (!requiredTypesValid) return "blocked";
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
  const requiredTypesValid =
    fixture &&
    typeof fixture === "object" &&
    typeof fixture.user_input_required === "boolean" &&
    typeof fixture.automatic_second_panel_requested === "boolean" &&
    Number.isInteger(fixture.required_failures) &&
    fixture.required_failures >= 0 &&
    typeof fixture.regression_clean === "boolean" &&
    typeof fixture.root_cause_known === "boolean" &&
    typeof fixture.bounded_repair_available === "boolean" &&
    Number.isInteger(fixture.iteration_count) &&
    fixture.iteration_count >= 0 &&
    Number.isInteger(fixture.max_iterations) &&
    fixture.max_iterations >= 0;
  if (!requiredTypesValid) return "blocked";
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
  const coreTypesValid =
    fixture &&
    typeof fixture === "object" &&
    Number.isInteger(fixture.valid_training_instances) &&
    fixture.valid_training_instances >= 0 &&
    fixture.valid_training_instances <= 4 &&
    Number.isInteger(fixture.pre_reveal_self_audits) &&
    fixture.pre_reveal_self_audits >= 0 &&
    fixture.pre_reveal_self_audits <= 4 &&
    Number.isInteger(fixture.same_target_followup_receipts) &&
    fixture.same_target_followup_receipts >= 0 &&
    fixture.same_target_followup_receipts <= 4 &&
    Number.isInteger(fixture.experience_transfer_ledgers) &&
    fixture.experience_transfer_ledgers >= 0 &&
    fixture.experience_transfer_ledgers <= 4 &&
    Number.isInteger(fixture.no_blind_phase_supervisor_contact_attestations) &&
    fixture.no_blind_phase_supervisor_contact_attestations >= 0 &&
    fixture.no_blind_phase_supervisor_contact_attestations <= 4 &&
    ["pass", "fail"].includes(fixture.barrier) &&
    typeof fixture.reveal_byte_identical === "boolean" &&
    ["pass", "fail"].includes(fixture.anti_groupthink_audit) &&
    ["sufficient", "insufficient", "unverifiable"].includes(
      fixture.semantic_redundancy_audit,
    ) &&
    typeof fixture.semantic_redundancy_case_id === "string" &&
    fixture.semantic_redundancy_case_id.length > 0 &&
    typeof fixture.consequential === "boolean" &&
    ["pass_reproducible", "fail_non_reproducible", "fail", "not_required"].includes(
      fixture.final_qa,
    ) &&
    ["none", "resolved", "evidence_backed_unresolved", "lost"].includes(
      fixture.critical_minority,
    ) &&
    ["complete_independent", "shared_lineage_only", "conflicting", "partial", "incomplete"].includes(
      fixture.evidence,
    );
  if (!coreTypesValid) return "blocked";
  const completeIntegrityEvidence =
    typeof fixture.guidance_byte_identical === "boolean" &&
    typeof fixture.safety_control_byte_identical === "boolean" &&
    typeof fixture.instance_specific_coaching_detected === "boolean" &&
    typeof fixture.blind_phase_content_feedback_detected === "boolean" &&
    ["pass", "fail", "unverifiable"].includes(fixture.safety_report) &&
    typeof fixture.critical_shared_lineage_only === "boolean" &&
    typeof fixture.quick_surrender_unresolved === "boolean" &&
    Number.isInteger(fixture.hokage_unverified_critical_or_major_claims);
  const usableInstances = Math.min(
    fixture.valid_training_instances,
    fixture.pre_reveal_self_audits,
    fixture.same_target_followup_receipts,
    fixture.experience_transfer_ledgers,
    fixture.no_blind_phase_supervisor_contact_attestations,
  );
  if (
    fixture.barrier !== "pass" ||
    fixture.reveal_byte_identical !== true ||
    fixture.same_target_followup_receipts < 4 ||
    fixture.experience_transfer_ledgers < 4 ||
    fixture.guidance_byte_identical === false ||
    fixture.safety_control_byte_identical === false ||
    fixture.instance_specific_coaching_detected === true ||
    fixture.blind_phase_content_feedback_detected === true ||
    (fixture.safety_report != null && fixture.safety_report !== "pass") ||
    fixture.anti_groupthink_audit !== "pass" ||
    (fixture.consequential === true && fixture.final_qa !== "pass_reproducible") ||
    (fixture.consequential === false && fixture.final_qa !== "not_required")
  ) {
    return "blocked";
  }
  if (!completeIntegrityEvidence) return "blocked";
  if (usableInstances < 3) return "blocked";
  if (
    fixture.critical_minority === "evidence_backed_unresolved" ||
    fixture.critical_minority === "lost"
  ) {
    return "structured_dispute";
  }
  if (
    usableInstances < 4 ||
    fixture.critical_shared_lineage_only === true ||
    fixture.quick_surrender_unresolved === true ||
    fixture.hokage_unverified_critical_or_major_claims > 0 ||
    fixture.semantic_redundancy_audit !== "sufficient" ||
    fixture.evidence !== "complete_independent"
  ) {
    return "provisional_consensus";
  }
  return "verified_consensus";
}

function classifySemanticRedundancyFixture(fixture) {
  const stringArray = (value) =>
    Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0);
  if (!fixture || typeof fixture !== "object") return "invalid";
  const candidateIds = fixture.candidate_ids;
  const knownClaimRefs = fixture.known_claim_refs;
  const knownEvidenceRefs = fixture.known_evidence_refs;
  const knownEvidenceLineageRefs = fixture.known_evidence_lineage_refs;
  const pairs = fixture.pair_assessments;
  const contributions = fixture.unique_verified_contributions;
  if (
    !stringArray(candidateIds) ||
    ![3, 4].includes(candidateIds.length) ||
    new Set(candidateIds).size !== candidateIds.length ||
    !stringArray(knownClaimRefs) ||
    new Set(knownClaimRefs).size !== knownClaimRefs.length ||
    !stringArray(knownEvidenceRefs) ||
    new Set(knownEvidenceRefs).size !== knownEvidenceRefs.length ||
    !stringArray(knownEvidenceLineageRefs) ||
    new Set(knownEvidenceLineageRefs).size !== knownEvidenceLineageRefs.length ||
    !Array.isArray(pairs) ||
    !Array.isArray(contributions) ||
    ![true, false, "unverifiable"].includes(
      fixture.all_core_claims_materially_equivalent,
    ) ||
    ![true, false, "unverifiable"].includes(
      fixture.all_evidence_lineages_equivalent,
    ) ||
    !["sufficient", "insufficient", "unverifiable"].includes(fixture.status) ||
    !["none", "provisional_only"].includes(fixture.result_ceiling_effect) ||
    typeof fixture.exact_resolution_need !== "string"
  ) {
    return "invalid";
  }

  const candidateSet = new Set(candidateIds);
  const claimSet = new Set(knownClaimRefs);
  const evidenceSet = new Set(knownEvidenceRefs);
  const evidenceLineageSet = new Set(knownEvidenceLineageRefs);
  const expectedPairKeys = new Set();
  for (let left = 0; left < candidateIds.length; left += 1) {
    for (let right = left + 1; right < candidateIds.length; right += 1) {
      expectedPairKeys.add([candidateIds[left], candidateIds[right]].sort().join("::"));
    }
  }
  const actualPairKeys = new Set();
  for (const pair of pairs) {
    if (
      !pair ||
      typeof pair !== "object" ||
      !stringArray(pair.candidate_ids) ||
      pair.candidate_ids.length !== 2 ||
      pair.candidate_ids[0] === pair.candidate_ids[1] ||
      !pair.candidate_ids.every((id) => candidateSet.has(id)) ||
      !["materially_distinct", "partially_overlapping", "substantially_redundant", "unverifiable"].includes(
        pair.relation,
      ) ||
      !stringArray(pair.overlapping_claim_refs) ||
      !stringArray(pair.unique_claim_refs) ||
      !stringArray(pair.evidence_lineage_delta) ||
      !pair.overlapping_claim_refs.every((ref) => claimSet.has(ref)) ||
      !pair.unique_claim_refs.every((ref) => claimSet.has(ref)) ||
      !pair.evidence_lineage_delta.every((ref) => evidenceLineageSet.has(ref))
    ) {
      return "invalid";
    }
    const overlapSet = new Set(pair.overlapping_claim_refs);
    if (pair.unique_claim_refs.some((ref) => overlapSet.has(ref))) return "invalid";
    if (
      pair.relation === "substantially_redundant" &&
      (pair.overlapping_claim_refs.length === 0 ||
        pair.unique_claim_refs.length > 0 ||
        pair.evidence_lineage_delta.length > 0)
    ) {
      return "invalid";
    }
    if (
      pair.relation === "materially_distinct" &&
      (pair.overlapping_claim_refs.length > 0 ||
        pair.unique_claim_refs.length === 0)
    ) {
      return "invalid";
    }
    if (
      pair.relation === "partially_overlapping" &&
      (pair.overlapping_claim_refs.length === 0 ||
        (pair.unique_claim_refs.length === 0 && pair.evidence_lineage_delta.length === 0))
    ) {
      return "invalid";
    }
    if (
      pair.relation === "unverifiable" &&
      (pair.overlapping_claim_refs.length > 0 ||
        pair.unique_claim_refs.length > 0 ||
        pair.evidence_lineage_delta.length > 0)
    ) {
      return "invalid";
    }
    actualPairKeys.add([...pair.candidate_ids].sort().join("::"));
  }
  if (
    pairs.length !== expectedPairKeys.size ||
    actualPairKeys.size !== expectedPairKeys.size ||
    ![...expectedPairKeys].every((key) => actualPairKeys.has(key))
  ) {
    return "invalid";
  }

  for (const contribution of contributions) {
    if (
      !contribution ||
      typeof contribution !== "object" ||
      !candidateSet.has(contribution.candidate_id) ||
      !stringArray(contribution.claim_refs) ||
      contribution.claim_refs.length === 0 ||
      !stringArray(contribution.evidence_refs) ||
      contribution.evidence_refs.length === 0 ||
      !contribution.claim_refs.every((ref) => claimSet.has(ref)) ||
      !contribution.evidence_refs.every((ref) => evidenceSet.has(ref))
    ) {
      return "invalid";
    }
    const candidatePairs = pairs.filter(({ candidate_ids }) =>
      candidate_ids.includes(contribution.candidate_id),
    );
    const otherPairs = pairs.filter(
      ({ candidate_ids }) => !candidate_ids.includes(contribution.candidate_id),
    );
    if (
      !contribution.claim_refs.every(
        (ref) =>
          candidatePairs.every(({ unique_claim_refs }) => unique_claim_refs.includes(ref)) &&
          otherPairs.every(({ unique_claim_refs }) => !unique_claim_refs.includes(ref)),
      )
    ) {
      return "invalid";
    }
  }

  const hasUnverifiableRelation = pairs.some(({ relation }) => relation === "unverifiable");
  const equivalenceUnverifiable =
    fixture.all_core_claims_materially_equivalent === "unverifiable" ||
    fixture.all_evidence_lineages_equivalent === "unverifiable";
  if (hasUnverifiableRelation || equivalenceUnverifiable) {
    if (
      !pairs.every(({ relation }) => relation === "unverifiable") ||
      fixture.all_core_claims_materially_equivalent !== "unverifiable" ||
      fixture.all_evidence_lineages_equivalent !== "unverifiable"
    ) {
      return "invalid";
    }
  } else {
    const derivedClaimsEquivalent = pairs.every(
      ({ unique_claim_refs }) => unique_claim_refs.length === 0,
    );
    const derivedLineagesEquivalent = pairs.every(
      ({ evidence_lineage_delta }) => evidence_lineage_delta.length === 0,
    );
    if (
      fixture.all_core_claims_materially_equivalent !== derivedClaimsEquivalent ||
      fixture.all_evidence_lineages_equivalent !== derivedLineagesEquivalent
    ) {
      return "invalid";
    }
  }
  let derivedStatus;
  let derivedCeiling;
  if (hasUnverifiableRelation || equivalenceUnverifiable) {
    if (fixture.exact_resolution_need.trim().length === 0) return "invalid";
    derivedStatus = "unverifiable";
    derivedCeiling = "provisional_only";
  } else if (
    pairs.every(({ relation }) => relation === "substantially_redundant") &&
    fixture.all_core_claims_materially_equivalent === true &&
    fixture.all_evidence_lineages_equivalent === true &&
    contributions.length === 0
  ) {
    derivedStatus = "insufficient";
    derivedCeiling = "provisional_only";
  } else if (
    pairs.some(({ relation }) =>
      ["materially_distinct", "partially_overlapping"].includes(relation)) &&
    contributions.length > 0 &&
    fixture.all_core_claims_materially_equivalent === false &&
    fixture.all_evidence_lineages_equivalent === false
  ) {
    derivedStatus = "sufficient";
    derivedCeiling = "none";
  } else {
    derivedStatus = "insufficient";
    derivedCeiling = "provisional_only";
  }
  if (fixture.status !== derivedStatus || fixture.result_ceiling_effect !== derivedCeiling) {
    return "invalid";
  }
  return `valid_${derivedStatus}`;
}

const packageJsonPath = join(workspaceRoot, "package.json");
const packageJson = existsSync(packageJsonPath) ? parseJson(packageJsonPath) : null;
const packageMode =
  !installValidationMode && packageJson?.name === "naruto-codex-deliberation-council";

const profileRootCandidates = installValidationMode
  ? [installProfileRoot]
  : packageMode
  ? [join(workspaceRoot, ".codex/agents")]
  : [
      join(workspaceRoot, ".codex/agents"),
      process.env.CODEX_HOME ? join(resolve(process.env.CODEX_HOME), "agents") : null,
      join(homedir(), ".codex/agents"),
    ].filter(Boolean);
const uniqueProfileRoots = [...new Set(profileRootCandidates)];
const profileRoot = installValidationMode
  ? installProfileRoot
  : packageMode
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
  skillText.includes("`protocol_run_manifest.v1`") &&
    skillText.includes("same-target follow-up receipt") &&
    skillText.includes('fork_turns: "none"'),
  "phase-integrity manifest, isolated spawn, or same-target receipt rule missing",
);
record(
  "skill_evidence_independence",
  skillText.includes("`independence_key`") && skillText.includes("count never increases evidence independence"),
  "evidence-independence rule missing",
);
record(
  "skill_experience_transfer",
  skillText.includes("`experience_transfer`") &&
    skillText.includes("successful same-target follow-up provenance"),
  "experience-transfer or same-target provenance rule missing",
);
record(
  "skill_groupthink",
  skillText.includes("quick surrender") && skillText.includes("unsupported dissent"),
  "anti-groupthink balance missing",
);
record(
  "skill_semantic_redundancy",
  skillText.includes("blind-output semantic-redundancy audit") &&
    skillText.includes("claim and evidence-lineage level") &&
    skillText.includes("verified material differences in both core claims and evidence lineages") &&
    skillText.includes("candidate-specific unique verified contribution") &&
    skillText.includes("maximum result at `provisional_consensus`") &&
    skillText.includes("Post-reveal convergence is assessed separately"),
  "blind semantic-redundancy audit or fail-closed result ceiling missing",
);
record(
  "skill_synthesis_provenance",
  skillText.includes("synthesis provenance") && skillText.includes("reproducible next check"),
  "Hokage provenance or reproducible final QA missing",
);
record(
  "skill_final_qa_delivery_authority",
  skillText.includes("`final_qa.effective_result_status` is the\nonly delivery status") &&
    skillText.includes("ignore the frozen `result_status`") &&
    skillText.includes("never the proposed action"),
  "effective final-QA status is not authoritative for delivery",
);

const openaiText = read(join(skillRoot, "agents/openai.yaml"));
const openaiConfig = parseAndRecord(
  "openai_yaml_strict_schema",
  parseStrictOpenAiYaml,
  openaiText,
);
const defaultPrompt = openaiConfig?.interface?.default_prompt;
const shortDescription = openaiConfig?.interface?.short_description ?? "";
record("openai_display_name", Boolean(openaiConfig?.interface?.display_name), "display_name missing");
record(
  "openai_short_description_length",
  shortDescription.length >= 25 && shortDescription.length <= 64,
  "short_description must be 25-64 characters",
);
record(
  "openai_implicit_false",
  openaiConfig?.policy?.allow_implicit_invocation === false,
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
const malformedOpenAiYamlCases = [
  openaiText + "\npolicy:\n  allow_implicit_invocation: false\n",
  openaiText.replace("display_name:", "unknown_display_name:"),
  openaiText.replace('default_prompt: "$naruto', 'default_prompt: "$naruto').replace(/"\n\npolicy:/, "\n\npolicy:"),
];
record(
  "openai_yaml_malformed_rejected",
  malformedOpenAiYamlCases.every((text) => {
    try {
      parseStrictOpenAiYaml(text);
      return false;
    } catch {
      return true;
    }
  }),
  "duplicate, unknown, or unclosed openai.yaml value was accepted",
);

const manifest = parseJson(join(skillRoot, "agent_manifest.json"));
record("manifest_schema_version", manifest?.schema_version === 6, "manifest schema_version must be 6");
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
    manifest?.qa_role?.part_of_six_profile_preflight === false &&
    manifest?.qa_role?.required_when === "consequential_result" &&
    manifest?.qa_role?.review_mode === "role_blind_independent" &&
    manifest?.qa_role?.interoperability_template ===
      "templates/consensus-report.md#host-provided-final-qa-interoperability-example" &&
    manifest?.qa_role?.request_result_binding_required === true &&
    manifest?.qa_role?.final_artifact_digest_binding_required === true &&
    manifest?.qa_role?.closed_v1_envelope_required === true &&
    manifest?.qa_role?.effective_result_status_binding_required === true &&
    manifest?.qa_role?.effective_result_status_is_delivery_authority === true &&
    manifest?.qa_role?.frozen_proposal_actions_ignored_when_blocked === true &&
    manifest?.qa_role?.non_pass_effective_result_status === "blocked" &&
    manifest?.qa_role?.binding_mismatch_policy === "blocked" &&
    manifest?.qa_role?.unavailable_policy === "blocked",
  "final QA must be an explicit host-provided, role-blind, fail-closed role",
);
record(
  "manifest_host_runtime_preflight",
  manifest?.host_runtime_preflight?.required_before_packet_build === true &&
    manifest?.host_runtime_preflight?.project_trust_required === true &&
    manifest?.host_runtime_preflight?.project_agent_layer_must_be_loaded === true &&
    JSON.stringify([...(manifest?.host_runtime_preflight?.required_runtime_ids ?? [])].sort()) ===
      JSON.stringify(expectedAgents.map(({ runtime }) => runtime).sort()) &&
    manifest?.host_runtime_preflight?.open_child_thread_capacity_required === 6 &&
    manifest?.host_runtime_preflight?.parent_live_sandbox_mode_required === "read-only" &&
    manifest?.host_runtime_preflight?.parent_live_approval_policy_required === "never" &&
    manifest?.host_runtime_preflight?.child_effective_sandbox_mode_required === "read-only" &&
    manifest?.host_runtime_preflight?.child_effective_approval_policy_required === "never" &&
    manifest?.host_runtime_preflight?.profile_sandbox_mode_is_default_not_enforcement === true &&
    manifest?.host_runtime_preflight?.profile_approval_policy_is_default_not_enforcement === true &&
    manifest?.host_runtime_preflight?.fork_turns_required === "none" &&
    manifest?.host_runtime_preflight?.spawn_all_training_instances_before_wait === true &&
    manifest?.host_runtime_preflight?.same_target_followup_capability_required === true &&
    manifest?.host_runtime_preflight?.successful_delivery_receipt_required === true &&
    manifest?.host_runtime_preflight?.successful_delivery_receipt_count_required === 4 &&
    manifest?.host_runtime_preflight?.unverifiable_policy === "blocked",
  "live host discovery, effective permission, fork, capacity, or receipt preflight mismatch",
);
record(
  "manifest_parent_artifact_ownership",
  manifest?.artifact_ownership?.owner_role_id === "hokage" &&
    manifest?.artifact_ownership?.runtime_owner === "parent_codex_process" &&
    manifest?.artifact_ownership?.storage === "parent_orchestration_state" &&
    manifest?.artifact_ownership?.filesystem_persistence_required === false &&
    manifest?.artifact_ownership?.child_artifact_write_forbidden === true &&
    manifest?.artifact_ownership?.canonical_values_retained_until_classification === true &&
    manifest?.artifact_ownership?.spawn_targets_and_delivery_receipts_parent_only === true &&
    manifest?.artifact_ownership?.delivery_receipt_source === "host_followup_tool_result" &&
    manifest?.artifact_ownership?.child_authored_receipt_is_provenance === false &&
    manifest?.artifact_ownership?.retention_unavailable_policy === "blocked",
  "parent-owned logical artifact or host receipt provenance contract mismatch",
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
  manifest?.moderation?.same_target_followup_receipt_required === true &&
    manifest?.moderation?.opaque_runtime_handle_hash_forbidden === true &&
    manifest?.moderation?.byte_identical_reveal_required === true &&
    manifest?.moderation?.experience_transfer_required === true,
  "same-thread, reveal, or experience-transfer requirement missing",
);
record(
  "manifest_semantic_redundancy_contract",
  manifest?.moderation?.blind_semantic_redundancy_audit_required === true &&
    manifest?.moderation?.semantic_comparison_basis === "claim_meaning_and_evidence_lineage" &&
    manifest?.moderation?.complete_unordered_pair_matrix_required === true &&
    manifest?.moderation?.semantic_reference_integrity_required === true &&
    manifest?.moderation?.sufficient_requires_claim_and_lineage_diversity === true &&
    manifest?.moderation?.one_dimensional_difference_result_ceiling ===
      "provisional_consensus" &&
    manifest?.moderation?.experience_transfer_ledger_count_required === 4 &&
    manifest?.moderation?.method_ids_prove_output_diversity === false &&
    manifest?.moderation?.invented_similarity_scores_forbidden === true &&
    manifest?.moderation?.insufficient_or_unverifiable_result_ceiling ===
      "provisional_consensus" &&
    manifest?.moderation?.post_revision_convergence_assessed_separately === true,
  "blind semantic-redundancy or post-reveal convergence contract mismatch",
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
  const card = parseAndRecord(
    `agent_card_strict_schema:${expected.runtime}`,
    parseStrictAgentCardYaml,
    cardText,
  );
  const manifestAgent = manifest?.agents?.find((agent) => agent.runtime_id === expected.runtime);
  const cardContracts = [...(card?.behavior_contract_ids ?? [])].sort();
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
    card?.runtime_id === expected.runtime,
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
  const runtime = parseAndRecord(
    `agent_runtime_strict_schema:${expected.runtime}`,
    parseStrictProfileToml,
    runtimeText,
  );
  const runtimeContracts =
    runtime?.developer_instructions
      .match(/^Behavior contract IDs:\s*([^\n]+)$/m)?.[1]
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .sort() ?? [];

  record(`agent_runtime_exists:${expected.runtime}`, Boolean(runtimeText), "runtime profile missing");
  record(
    `agent_runtime_name:${expected.runtime}`,
    runtime?.name === expected.runtime,
    "runtime name mismatch",
  );
  record(
    `agent_runtime_description:${expected.runtime}`,
    Boolean(runtime?.description),
    "runtime description missing",
  );
  record(
    `agent_runtime_instructions:${expected.runtime}`,
    Boolean(runtime?.developer_instructions),
    "developer_instructions missing",
  );
  record(
    `agent_runtime_read_only:${expected.runtime}`,
    runtime?.sandbox_mode === "read-only",
    "runtime must be read-only",
  );
  record(
    `agent_runtime_approval_never:${expected.runtime}`,
    runtime?.approval_policy === "never",
    "runtime approval_policy must be never",
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
      card?.actor_identity_id === expected.actorIdentity &&
        card?.training_instance_id === expected.runtime &&
        card?.method_profile_id === expected.methodProfile,
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
        cardText.includes("semantic redundancy") &&
        cardText.includes("experience-transfer"),
      "Kakashi card lacks common guidance, phase-integrity, groupthink, or transfer ownership",
    );
    record(
      "agent_runtime_moderator_integrity",
      runtimeText.includes("method_matrix.v1") &&
        runtimeText.includes("training_guidance_packet.v1") &&
        runtimeText.includes("protocol_run_manifest.v1") &&
        runtimeText.includes("evidence-independence") &&
        runtimeText.includes("semantic") &&
        runtimeText.includes("provisional_consensus") &&
        runtimeText.includes("same-target follow-up receipt"),
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
        cardText.includes("successful host receipt") &&
        cardText.includes("no-blind-contact attestation"),
      "candidate card lacks supervision, self-audit, or same-thread experience transfer",
    );
    record(
      `agent_runtime_candidate_learning:${expected.runtime}`,
      runtimeText.includes("same Naruto identity") &&
      runtimeText.includes("method_matrix.v1") &&
        runtimeText.includes("pre-reveal self-audit") &&
        runtimeText.includes("experience-transfer claim map") &&
        runtimeText.includes("successful same-target follow-up receipt") &&
        runtimeText.includes("no_blind_phase_supervisor_contact_attestation=true"),
      "candidate runtime lacks supervision, self-audit, or same-thread experience transfer",
    );
  }
}

const strictProfileProbeText = read(join(profileRoot, "naruto_clone_integrator.toml"));
const malformedProfileCases = [
  strictProfileProbeText + '\ninvalid_unclosed_array = [',
  strictProfileProbeText.replace(
    'description = "',
    'name = "duplicate"\ndescription = "',
  ),
  strictProfileProbeText.replace(
    'nickname_candidates = ["Naruto Clone Integrator"]',
    'nickname_candidates = ["Naruto Clone Integrator"',
  ),
  strictProfileProbeText.replace(
    'sandbox_mode = "read-only"',
    "sandbox_mode = read-only",
  ),
  strictProfileProbeText.replace(/\n"""\s*$/, ""),
];
record(
  "agent_runtime_malformed_profiles_rejected",
  malformedProfileCases.every((text) => {
    try {
      parseStrictProfileToml(text);
      return false;
    } catch {
      return true;
    }
  }),
  "unknown, duplicate, unquoted string, unclosed array, or unclosed multiline TOML was accepted",
);
const strictCardProbeText = read(join(skillRoot, "agents/naruto-clone-integrator.yaml"));
const malformedCardCases = [
  strictCardProbeText + "\nunknown_top_level: rejected",
  strictCardProbeText.replace(
    "runtime_id: naruto_clone_integrator",
    "runtime_id: naruto_clone_integrator\nruntime_id: duplicate",
  ),
  strictCardProbeText.replace(
    'name: "Naruto Clone: Integrator"',
    'name: "Naruto Clone: Integrator',
  ),
  strictCardProbeText.replace("behavior_contract_ids:\n", "behavior_contract_ids: []\n"),
];
record(
  "agent_card_malformed_yaml_rejected",
  malformedCardCases.every((text) => {
    try {
      parseStrictAgentCardYaml(text);
      return false;
    } catch {
      return true;
    }
  }),
  "unknown, duplicate, unclosed, or flow-style agent-card YAML was accepted",
);

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
record("fixtures_schema_version", fixtures?.schema_version === 6, "fixtures schema_version must be 6");
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
  "same-target-receipt-unavailable",
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

const semanticRedundancyCaseById = new Map(
  (fixtures?.semantic_redundancy_cases ?? []).map((fixture) => [fixture.id, fixture]),
);
const requiredIntegrityCases = new Set([
  "integrity-full-verified",
  "integrity-reveal-byte-mismatch",
  "integrity-same-target-receipt-missing",
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
  "integrity-blind-semantic-redundancy",
  "integrity-blind-semantic-comparison-unverifiable",
]);
const actualIntegrityCases = new Set((fixtures?.integrity_cases ?? []).map(({ id }) => id));
record(
  "integrity_fixture_coverage",
  [...requiredIntegrityCases].every((id) => actualIntegrityCases.has(id)),
  "required phase-integrity cases missing",
);
for (const fixture of fixtures?.integrity_cases ?? []) {
  const semanticFixture = semanticRedundancyCaseById.get(
    fixture.semantic_redundancy_case_id,
  );
  const usableInstanceCount = Math.min(
    fixture.valid_training_instances,
    fixture.pre_reveal_self_audits,
    fixture.same_target_followup_receipts,
    fixture.experience_transfer_ledgers,
    fixture.no_blind_phase_supervisor_contact_attestations,
  );
  const integrityState = classifyIntegrityFixture(fixture);
  const semanticFixtureState = classifySemanticRedundancyFixture(semanticFixture);
  const semanticCandidateCountMatches =
    integrityState === "blocked" ||
    semanticFixture?.candidate_ids?.length === usableInstanceCount;
  record(
    `integrity_fixture_result:${fixture.id}`,
    integrityState === fixture.expected_max_result &&
      semanticFixtureState === `valid_${fixture.semantic_redundancy_audit}` &&
      semanticCandidateCountMatches,
    `expected ${fixture.expected_max_result} with linked ${fixture.semantic_redundancy_audit} for ${usableInstanceCount} usable instances; got ${integrityState}, ${semanticFixtureState}, and ${semanticFixture?.candidate_ids?.length ?? 0} semantic candidates`,
  );
}

const requiredSemanticRedundancyCases = new Set([
  "semantic-distinct-valid",
  "semantic-distinct-three-valid",
  "semantic-redundant-valid",
  "semantic-unverifiable-valid",
  "semantic-inconsistent-status-rejected",
  "semantic-missing-pair-rejected",
  "semantic-unknown-reference-rejected",
  "semantic-contradictory-pair-rejected",
]);
const actualSemanticRedundancyCases = new Set(
  (fixtures?.semantic_redundancy_cases ?? []).map(({ id }) => id),
);
record(
  "semantic_redundancy_fixture_coverage",
  [...requiredSemanticRedundancyCases].every((id) => actualSemanticRedundancyCases.has(id)),
  "required semantic pair, reference, status, and ceiling cases missing",
);
for (const fixture of fixtures?.semantic_redundancy_cases ?? []) {
  const actual = classifySemanticRedundancyFixture(fixture);
  record(
    `semantic_redundancy_fixture_result:${fixture.id}`,
    actual === fixture.expected_state,
    `expected ${fixture.expected_state}, got ${actual}`,
  );
}
const semanticRedundancyRequiredFields = [
  "candidate_ids",
  "known_claim_refs",
  "known_evidence_refs",
  "known_evidence_lineage_refs",
  "pair_assessments",
  "unique_verified_contributions",
  "all_core_claims_materially_equivalent",
  "all_evidence_lineages_equivalent",
  "status",
  "result_ceiling_effect",
  "exact_resolution_need",
];
const semanticRedundancyBaseline = fixtures?.semantic_redundancy_cases?.find(
  ({ id }) => id === "semantic-distinct-valid",
);
record(
  "semantic_redundancy_fixture_baseline_complete",
  semanticRedundancyRequiredFields.every((field) => own(semanticRedundancyBaseline, field)),
  "semantic-redundancy baseline is missing a required field",
);
for (const field of semanticRedundancyRequiredFields) {
  const result = classifySemanticRedundancyFixture(
    fixtureWithoutField(semanticRedundancyBaseline, field),
  );
  record(
    `semantic_redundancy_required_field_deletion_rejected:${field}`,
    result === "invalid",
    `deleting ${field} returned ${result}`,
  );
}
const semanticUnknownEvidenceReference = JSON.parse(
  JSON.stringify(semanticRedundancyBaseline),
);
semanticUnknownEvidenceReference.unique_verified_contributions[0].evidence_refs = [
  "evidence-unknown",
];
record(
  "semantic_redundancy_unknown_evidence_reference_rejected",
  classifySemanticRedundancyFixture(semanticUnknownEvidenceReference) === "invalid",
  "unknown evidence reference was accepted",
);
const semanticUnknownLineageReference = JSON.parse(
  JSON.stringify(semanticRedundancyBaseline),
);
semanticUnknownLineageReference.pair_assessments[0].evidence_lineage_delta = [
  "lineage-unknown",
];
record(
  "semantic_redundancy_unknown_lineage_reference_rejected",
  classifySemanticRedundancyFixture(semanticUnknownLineageReference) === "invalid",
  "unknown evidence-lineage reference was accepted",
);
const semanticWrongClaimOwner = JSON.parse(JSON.stringify(semanticRedundancyBaseline));
semanticWrongClaimOwner.unique_verified_contributions[0].claim_refs = ["claim-c2"];
record(
  "semantic_redundancy_wrong_claim_owner_rejected",
  classifySemanticRedundancyFixture(semanticWrongClaimOwner) === "invalid",
  "candidate contribution claimed another candidate's unique claim",
);
const semanticDistinctClaimsSharedLineage = JSON.parse(JSON.stringify(semanticRedundancyBaseline));
for (const pair of semanticDistinctClaimsSharedLineage.pair_assessments) {
  pair.evidence_lineage_delta = [];
}
semanticDistinctClaimsSharedLineage.all_evidence_lineages_equivalent = true;
semanticDistinctClaimsSharedLineage.status = "insufficient";
semanticDistinctClaimsSharedLineage.result_ceiling_effect = "provisional_only";
const semanticEquivalentClaimsDistinctLineage = JSON.parse(JSON.stringify(semanticRedundancyBaseline));
for (const pair of semanticEquivalentClaimsDistinctLineage.pair_assessments) {
  pair.unique_claim_refs = [];
  if (pair.relation === "materially_distinct") {
    pair.relation = "partially_overlapping";
    pair.overlapping_claim_refs = ["claim-shared"];
  }
}
semanticEquivalentClaimsDistinctLineage.unique_verified_contributions = [];
semanticEquivalentClaimsDistinctLineage.all_core_claims_materially_equivalent = true;
semanticEquivalentClaimsDistinctLineage.status = "insufficient";
semanticEquivalentClaimsDistinctLineage.result_ceiling_effect = "provisional_only";
record(
  "semantic_redundancy_single_dimension_difference_capped",
  classifySemanticRedundancyFixture(semanticDistinctClaimsSharedLineage) ===
    "valid_insufficient" &&
    classifySemanticRedundancyFixture(semanticEquivalentClaimsDistinctLineage) ===
      "valid_insufficient",
  "a one-dimensional semantic difference escaped the provisional ceiling",
);
const semanticClaimlessDistinctPair = JSON.parse(
  JSON.stringify(semanticRedundancyBaseline),
);
semanticClaimlessDistinctPair.pair_assessments[1].unique_claim_refs = [];
record(
  "semantic_redundancy_claimless_distinct_pair_rejected",
  classifySemanticRedundancyFixture(semanticClaimlessDistinctPair) === "invalid",
  "materially distinct pair without any claim reference was accepted",
);

function fixtureWithoutField(fixture, field) {
  const copy = JSON.parse(JSON.stringify(fixture));
  delete copy[field];
  return copy;
}

const requiredFieldDeletionSuites = [
  {
    id: "training_instance",
    baseline: fixtures.training_instance_cases.find(({ id }) => id === "training-instances-ready"),
    requiredFields: [
      "actor_identity_ids",
      "instance_ids",
      "method_profile_ids",
      "revision_method_profile_ids",
      "method_matrix_byte_identical",
      "envelope_difference_allowlist_valid",
    ],
    classify: classifyTrainingInstanceFixture,
  },
  {
    id: "protocol",
    baseline: fixtures.protocol_cases.find(({ id }) => id === "full-verified"),
    requiredFields: [
      "protected_action_without_normal_gate",
      "safety_supervisor",
      "training_control",
      "barrier",
      "moderator",
      "valid_commits",
      "valid_same_target_followup_receipts",
      "evidence",
      "critical_objection",
    ],
    classify: classifyProtocolFixture,
  },
  {
    id: "supervision",
    baseline: fixtures.supervision_cases.find(({ id }) => id === "supervision-ready"),
    requiredFields: [
      "safety_supervisor",
      "source_packet_available",
      "source_packet_hash_matches",
      "guidance_byte_identical",
      "guidance_non_solution",
      "instance_specific_coaching",
      "protected_boundaries",
      "safety_status",
      "hold_count",
    ],
    classify: classifySupervisionFixture,
  },
  {
    id: "integrity",
    baseline: fixtures.integrity_cases.find(({ id }) => id === "integrity-full-verified"),
    requiredFields: [
      "barrier",
      "reveal_byte_identical",
      "valid_training_instances",
      "pre_reveal_self_audits",
      "same_target_followup_receipts",
      "experience_transfer_ledgers",
      "no_blind_phase_supervisor_contact_attestations",
      "guidance_byte_identical",
      "safety_control_byte_identical",
      "instance_specific_coaching_detected",
      "blind_phase_content_feedback_detected",
      "safety_report",
      "anti_groupthink_audit",
      "semantic_redundancy_audit",
      "semantic_redundancy_case_id",
      "consequential",
      "final_qa",
      "critical_minority",
      "critical_shared_lineage_only",
      "quick_surrender_unresolved",
      "hokage_unverified_critical_or_major_claims",
      "evidence",
    ],
    classify: classifyIntegrityFixture,
  },
];
for (const suite of requiredFieldDeletionSuites) {
  record(
    `fixture_baseline_complete:${suite.id}`,
    suite.requiredFields.every((field) => own(suite.baseline, field)),
    "representative valid baseline is missing a required field",
  );
  for (const field of suite.requiredFields) {
    const result = suite.classify(fixtureWithoutField(suite.baseline, field));
    record(
      `required_field_deletion_rejected:${suite.id}:${field}`,
      result === "blocked",
      `deleting ${field} returned ${result}`,
    );
  }
}

const fixtureSchemaSuites = [
  { group: "protocol", cases: fixtures.protocol_cases, fields: requiredFieldDeletionSuites[1].requiredFields },
  { group: "supervision", cases: fixtures.supervision_cases, fields: requiredFieldDeletionSuites[2].requiredFields },
  { group: "integrity", cases: fixtures.integrity_cases, fields: requiredFieldDeletionSuites[3].requiredFields },
];
for (const suite of fixtureSchemaSuites) {
  for (const fixture of suite.cases) {
    record(
      `fixture_required_fields_complete:${suite.group}:${fixture.id}`,
      suite.fields.every((field) => own(fixture, field)),
      "negative fixture is not a complete baseline-derived oracle",
    );
  }
}

function requiredFieldDelta(fixture, baseline, fields) {
  return fields
    .filter((field) => JSON.stringify(fixture[field]) !== JSON.stringify(baseline[field]))
    .sort();
}

const protocolOracleBaseline = {
  protected_action_without_normal_gate: false,
  safety_supervisor: "available",
  training_control: "pass",
  barrier: "pass",
  moderator: "available",
  valid_commits: 4,
  valid_same_target_followup_receipts: 4,
  evidence: "complete",
  critical_objection: "none",
};
const supervisionOracleBaseline = {
  safety_supervisor: "available",
  source_packet_available: true,
  source_packet_hash_matches: true,
  guidance_byte_identical: true,
  guidance_non_solution: true,
  instance_specific_coaching: false,
  protected_boundaries: "pass",
  safety_status: "pass",
  hold_count: 0,
};
const integrityOracleBaseline = {
  barrier: "pass",
  reveal_byte_identical: true,
  valid_training_instances: 4,
  pre_reveal_self_audits: 4,
  same_target_followup_receipts: 4,
  experience_transfer_ledgers: 4,
  no_blind_phase_supervisor_contact_attestations: 4,
  guidance_byte_identical: true,
  safety_control_byte_identical: true,
  instance_specific_coaching_detected: false,
  blind_phase_content_feedback_detected: false,
  safety_report: "pass",
  anti_groupthink_audit: "pass",
  semantic_redundancy_audit: "sufficient",
  semantic_redundancy_case_id: "semantic-distinct-valid",
  consequential: false,
  final_qa: "not_required",
  critical_minority: "resolved",
  critical_shared_lineage_only: false,
  quick_surrender_unresolved: false,
  hokage_unverified_critical_or_major_claims: 0,
  evidence: "complete_independent",
};
const fixtureOracleSuites = [
  {
    group: "protocol",
    cases: fixtures.protocol_cases,
    fields: requiredFieldDeletionSuites[1].requiredFields,
    baseline: protocolOracleBaseline,
    allowedDeltas: {
      "full-verified": ["critical_objection"],
      "three-instance-degraded": ["valid_commits"],
      "two-instance-blocked": ["valid_commits"],
      "hash-mismatch-degrades": ["valid_commits"],
      "early-reveal-blocked": ["barrier"],
      "same-target-receipt-unavailable": ["valid_same_target_followup_receipts"],
      "moderator-unavailable": ["moderator"],
      "critical-minority-unresolved": ["critical_objection", "evidence"],
      "protected-action-requested": ["protected_action_without_normal_gate"],
      "safety-supervisor-unavailable": ["safety_supervisor"],
    },
  },
  {
    group: "supervision",
    cases: fixtures.supervision_cases,
    fields: requiredFieldDeletionSuites[2].requiredFields,
    baseline: supervisionOracleBaseline,
    allowedDeltas: {
      "supervision-ready": [],
      "supervision-one-common-repair": ["hold_count", "safety_status"],
      "supervision-guidance-byte-mismatch": ["guidance_byte_identical"],
      "supervision-solution-direction": ["guidance_non_solution"],
      "supervision-yamato-unavailable": ["safety_status", "safety_supervisor"],
      "supervision-instance-specific-coaching": ["instance_specific_coaching"],
      "supervision-protected-boundary-failure": ["protected_boundaries"],
      "supervision-second-non-pass": ["hold_count", "safety_status"],
      "supervision-unverifiable": ["safety_status"],
      "supervision-source-packet-missing": [
        "source_packet_available",
        "source_packet_hash_matches",
      ],
      "supervision-source-packet-hash-mismatch": ["source_packet_hash_matches"],
    },
  },
  {
    group: "integrity",
    cases: fixtures.integrity_cases,
    fields: requiredFieldDeletionSuites[3].requiredFields,
    baseline: integrityOracleBaseline,
    allowedDeltas: {
      "integrity-full-verified": ["consequential", "final_qa"],
      "integrity-reveal-byte-mismatch": ["reveal_byte_identical"],
      "integrity-same-target-receipt-missing": ["same_target_followup_receipts"],
      "integrity-one-missing-pre-audit": [
        "pre_reveal_self_audits",
        "semantic_redundancy_case_id",
      ],
      "integrity-shared-source-critical-convergence": [
        "critical_minority",
        "critical_shared_lineage_only",
        "evidence",
      ],
      "integrity-canonical-minority-over-unsupported-majority": [
        "critical_minority",
        "evidence",
      ],
      "integrity-quick-surrender-without-evidence": ["quick_surrender_unresolved"],
      "integrity-fake-dissent-rejected": [],
      "integrity-hokage-unsupported-major-claim": [
        "hokage_unverified_critical_or_major_claims",
      ],
      "integrity-final-qa-non-reproducible": ["consequential", "final_qa"],
      "integrity-lost-critical-minority": ["critical_minority", "evidence"],
      "integrity-experience-transfer-missing": ["experience_transfer_ledgers"],
      "integrity-blind-supervisor-contact": ["instance_specific_coaching_detected"],
      "integrity-safety-report-unverifiable": ["safety_report"],
      "integrity-blind-semantic-redundancy": [
        "semantic_redundancy_audit",
        "semantic_redundancy_case_id",
      ],
      "integrity-blind-semantic-comparison-unverifiable": [
        "semantic_redundancy_audit",
        "semantic_redundancy_case_id",
      ],
    },
  },
];
for (const suite of fixtureOracleSuites) {
  for (const fixture of suite.cases) {
    const actual = requiredFieldDelta(fixture, suite.baseline, suite.fields);
    const expected = [...(suite.allowedDeltas[fixture.id] ?? [])].sort();
    record(
      `fixture_single_fault_oracle:${suite.group}:${fixture.id}`,
      JSON.stringify(actual) === JSON.stringify(expected),
      `expected deltas ${expected.join(",")}; got ${actual.join(",")}`,
    );
  }
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
const deliberationProtocolText = read(join(skillRoot, "references/deliberation-protocol.md"));
const roleMethodsText = read(join(skillRoot, "references/role-methods.md"));
const examplesText = read(join(skillRoot, "references/examples-and-failure-modes.md"));
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
record(
  "template_reveal_semantic_redundancy",
  revealTemplateText.includes("blind_semantic_redundancy_audit:") &&
    revealTemplateText.includes("comparison_basis: claim_meaning_and_evidence_lineage") &&
    revealTemplateText.includes("pair_assessments:") &&
    revealTemplateText.includes("unique_verified_contributions:") &&
    revealTemplateText.includes("result_ceiling_effect: none | provisional_only") &&
    revealTemplateText.includes("every unique unordered pair") &&
    revealTemplateText.includes("six pair assessments") &&
    revealTemplateText.includes("Do not infer\ndiversity from method IDs"),
  "claim-level semantic-redundancy audit fields or guardrails missing",
);
record("template_revision_repair", revisionTemplateText.includes("loop_repair:") && revisionTemplateText.includes("regression_risks:"), "same-thread repair fields missing");
record("template_revision_experience", revisionTemplateText.includes("actor_identity_id: naruto_uzumaki") && revisionTemplateText.includes("method_profile_id:") && revisionTemplateText.includes("method_matrix_sha256:") && revisionTemplateText.includes("training_instance_envelope_sha256:") && revisionTemplateText.includes("experience_transfer:") && revisionTemplateText.includes("same_thread_revision_attestation:") && revisionTemplateText.includes("successful") && revisionTemplateText.includes("host-tool delivery receipt") && revisionTemplateText.includes("claim_revision_map:") && revisionTemplateText.includes("training_guidance_packet_sha256:") && revisionTemplateText.includes("safety_control_packet_sha256:"), "same-thread identity, method, host receipt, experience-transfer, or supervision binding fields missing");
record("template_consensus_regression", consensusTemplateText.includes("loop_summary:") && consensusTemplateText.includes("repair_history:") && consensusTemplateText.includes("regression_check:"), "loop summary, repair history, or regression check missing");
record("template_consensus_provenance", consensusTemplateText.includes("synthesis_provenance:") && consensusTemplateText.includes("hokage_introduced_claims:") && consensusTemplateText.includes("reproducible_next_check:") && consensusTemplateText.includes("protocol_run_manifest_sha256:") && consensusTemplateText.includes("moderator_report_sha256:") && consensusTemplateText.includes("safety_report_sha256:"), "synthesis provenance, safety binding, protocol binding, or reproducible QA fields missing");
record(
  "template_consensus_conditional_final_qa",
  consensusTemplateText.includes("final_qa:") &&
    consensusTemplateText.includes("required: true | false") &&
    consensusTemplateText.includes("status: pass | fail | blocked | not_required | not_run") &&
    consensusTemplateText.includes("effective_result_status:") &&
    consensusTemplateText.includes("request_result_artifact_binding_verified:") &&
    consensusTemplateText.includes("independent_reviewer_attestation:") &&
    consensusTemplateText.includes("role_blind_attestation:"),
  "consensus template must represent bound required and non-required final QA",
);
record(
  "template_consensus_final_qa_interoperability",
  consensusTemplateText.includes("Host-provided Final QA Interoperability Example") &&
    consensusTemplateText.includes("final_qa_review_request.v1") &&
    consensusTemplateText.includes("final_qa_review_result.v1") &&
    consensusTemplateText.includes("request_id:") &&
    consensusTemplateText.includes("request_sha256:") &&
    consensusTemplateText.includes("final_artifact_sha256:") &&
    consensusTemplateText.includes("result_sha256:") &&
    consensusTemplateText.includes("consensus_report.qa_review_projection") &&
    consensusTemplateText.includes("circular dependency") &&
    consensusTemplateText.includes("independent_reviewer_attestation: true") &&
    consensusTemplateText.includes("role_blind_attestation: true") &&
    consensusTemplateText.includes("mismatch or replay") &&
    consensusTemplateText.includes("as the only delivery status") &&
    consensusTemplateText.includes("not a seventh runtime profile"),
  "non-bundled final-QA interoperability example missing or ambiguous",
);
record("template_protocol_checkpoint", protocolCheckpointTemplateText.includes("protocol_checkpoint.v1") && protocolCheckpointTemplateText.includes("previous_checkpoint_sha256:") && protocolCheckpointTemplateText.includes("manifest_snapshot:") && protocolCheckpointTemplateText.includes("checkpoint_sha256:"), "immutable protocol checkpoint schema missing");
record(
  "template_protocol_run_manifest",
  runManifestTemplateText.includes("protocol_run_manifest.v1") &&
    runManifestTemplateText.includes("actor_identity_id: naruto_uzumaki") &&
    runManifestTemplateText.includes("method_matrix_sha256:") &&
    runManifestTemplateText.includes("unique_instance_and_method_ids_verified:") &&
    runManifestTemplateText.includes("training_instance_envelope_sha256:") &&
    runManifestTemplateText.includes("yamato_preflight_passed:") &&
    runManifestTemplateText.includes("blind_supervisor_contact_absent:") &&
    runManifestTemplateText.includes("safety_supervisor:") &&
    runManifestTemplateText.includes("moderator_report_sha256:") &&
    runManifestTemplateText.includes("safety_report_complete:") &&
    runManifestTemplateText.includes("training_control:") &&
    runManifestTemplateText.includes("reveal_byte_identical:") &&
    runManifestTemplateText.includes("same_target_followup_receipts_verified:") &&
    runManifestTemplateText.includes("same_target_followup_receipt_status:") &&
    runManifestTemplateText.includes("blind_semantic_redundancy_audit_complete:") &&
    runManifestTemplateText.includes("blind_semantic_redundancy_status:") &&
    runManifestTemplateText.includes("reviewer_binding: host_provided | not_required | unavailable") &&
    runManifestTemplateText.includes("effective_result_status:") &&
    runManifestTemplateText.includes("request_result_artifact_binding_verified:") &&
    runManifestTemplateText.includes("result_sha256:") &&
    runManifestTemplateText.includes("checkpoint_hashes:") &&
    runManifestTemplateText.includes("reconcile:") &&
    runManifestTemplateText.includes("safety_report:") &&
    runManifestTemplateText.includes("qa:"),
  "protocol run manifest identity, method, supervision, redundancy, QA binding, receipt, or checkpoint contract missing",
);
record(
  "contracts_integrity_projection",
    contractsText.includes("### Artifact Digest Projection") &&
    contractsText.includes("### Additive 1.1 Extension Rule") &&
    contractsText.includes("### Final-QA Review Artifact Projection") &&
    contractsText.includes("### Manifest Checkpoints And Acyclic Order") &&
    contractsText.includes("method_matrix.v1") &&
    contractsText.includes("naruto_training_instance_envelope.v1") &&
    contractsText.includes("protocol_checkpoint.v1") &&
    contractsText.includes("final_qa_review_request.v1") &&
    contractsText.includes("final_qa_review_result.v1") &&
    contractsText.includes("## Training Guidance") &&
    contractsText.includes("## Safety Control") &&
    contractsText.includes("## Protocol Run Manifest") &&
    contractsText.includes("## Final-QA Request And Result") &&
    contractsText.includes("sole consumer-facing delivery status") &&
    contractsText.includes("safety_report.v1") &&
    contractsText.includes("evidence_independence_findings:") &&
    contractsText.includes("synthesis_provenance:") &&
    contractsText.includes("protocol_run_manifest_reconcile_checkpoint_sha256:"),
  "digest projection, additive compatibility, final QA, checkpoint, supervision, or phase binding missing from schema reference",
);
record(
  "prior_art_assimilation",
  ["Agent Review Panel", "Agent Council", "oh-my-codex", "Captain Claw", "Zeroshot", "Mixture-of-Agents"].every((name) => priorArtText.includes(name)) &&
    priorArtText.includes("same complete task") &&
    priorArtText.includes("not runtime dependencies"),
  "prior-art decisions or invariants missing",
);
const staleOpaqueHandleRequirements = [
  "opaque original/revision thread-handle hashes",
  "same-thread revision through opaque hashes",
  "same-thread runtime-handle hashes differ or are unverifiable",
  "opaque original/revision handle hashes are missing",
  "it proves phase order and identity",
];
const currentProtocolReferences = [
  contractsText,
  deliberationProtocolText,
  roleMethodsText,
  examplesText,
  priorArtText,
];
record(
  "references_no_stale_opaque_handle_requirement",
  currentProtocolReferences.every((text) =>
    staleOpaqueHandleRequirements.every((phrase) => !text.toLowerCase().includes(phrase)),
  ),
  "a current reference still requires model-visible opaque handle hashes or overclaims sidecar proof",
);
record(
  "references_host_receipt_provenance",
  roleMethodsText.includes("parent-retained original spawn target") &&
    roleMethodsText.includes("successful host same-target") &&
    examplesText.includes("original spawn-target mapping") &&
    examplesText.includes("successful host follow-up receipt") &&
    priorArtText.includes("parent-retained spawn targets") &&
    priorArtText.includes("successful host same-target") &&
    contractsText.includes("not host-enforced or tamper-evident proof"),
  "current references do not consistently bind revision provenance to host receipts",
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

const finalQaReviewArtifact = {
  schema: "consensus_report.v1",
  task_id: "task-1",
  protocol_run_manifest_sha256: "",
  moderator_report_sha256: "moderator-report-sha",
  safety_report_sha256: "safety-report-sha",
  result_status: "verified_consensus",
  hokage_synthesis: "final semantic result",
  stop_decision: "stop_sufficient",
  next_action: "execute proposed route",
  final_qa: { required: true, status: "not_run", effective_result_status: "blocked" },
};
const finalQaRequest = {
  schema: "final_qa_review_request.v1",
  request_id: "qa-request-1",
  task_id: "task-1",
  consequential_reason: "release decision",
  final_artifact_ref: "consensus_report.qa_review_projection",
  final_artifact_sha256: finalQaReviewArtifactDigest(finalQaReviewArtifact),
  acceptance_criteria: ["criterion-1"],
  evidence_refs: ["evidence-1"],
  candidate_role_identities_excluded: true,
  role_prestige_excluded: true,
  completion_order_excluded: true,
  vote_counts_excluded: true,
  raw_reasoning_included: false,
  request_sha256: "",
};
finalQaRequest.request_sha256 = artifactDigest(finalQaRequest, "request_sha256");
const finalQaResult = {
  schema: "final_qa_review_result.v1",
  request_id: finalQaRequest.request_id,
  task_id: finalQaRequest.task_id,
  request_sha256: finalQaRequest.request_sha256,
  final_artifact_sha256: finalQaRequest.final_artifact_sha256,
  reviewer_binding: "host_provided",
  independent_reviewer_attestation: true,
  role_blind_attestation: true,
  status: "pass",
  findings: [],
  raw_reasoning_included: false,
  result_sha256: "",
};
finalQaResult.result_sha256 = artifactDigest(finalQaResult, "result_sha256");
record(
  "final_qa_request_result_binding_valid",
  validatesFinalQaBinding(finalQaRequest, finalQaResult, finalQaReviewArtifact),
  "valid final-QA request/result binding was rejected",
);
function changedFinalQaResult(mutator) {
  const changed = JSON.parse(JSON.stringify(finalQaResult));
  mutator(changed);
  changed.result_sha256 = artifactDigest(changed, "result_sha256");
  return changed;
}
const finalQaBindingMismatches = [
  changedFinalQaResult((result) => { result.request_id = "qa-request-other"; }),
  changedFinalQaResult((result) => { result.task_id = "task-other"; }),
  changedFinalQaResult((result) => { result.request_sha256 = sha256("other request"); }),
  changedFinalQaResult((result) => { result.final_artifact_sha256 = sha256("other artifact"); }),
  changedFinalQaResult((result) => { result.independent_reviewer_attestation = false; }),
  changedFinalQaResult((result) => { result.role_blind_attestation = false; }),
  changedFinalQaResult((result) => { result.status = "fail"; }),
];
const staleDigestFinalQaResult = { ...finalQaResult, status: "fail" };
const replayQaReviewArtifact = {
  ...finalQaReviewArtifact,
  task_id: "task-2",
  hokage_synthesis: "other final semantic result",
};
const replayQaRequest = {
  ...finalQaRequest,
  request_id: "qa-request-2",
  task_id: "task-2",
  final_artifact_sha256: finalQaReviewArtifactDigest(replayQaReviewArtifact),
  request_sha256: "",
};
replayQaRequest.request_sha256 = artifactDigest(replayQaRequest, "request_sha256");
const replayQaResult = {
  ...finalQaResult,
  request_id: replayQaRequest.request_id,
  task_id: replayQaRequest.task_id,
  request_sha256: replayQaRequest.request_sha256,
  final_artifact_sha256: replayQaRequest.final_artifact_sha256,
  result_sha256: "",
};
replayQaResult.result_sha256 = artifactDigest(replayQaResult, "result_sha256");
const wrongTaskQaRequest = {
  ...finalQaRequest,
  task_id: "task-other",
  request_sha256: "",
};
wrongTaskQaRequest.request_sha256 = artifactDigest(wrongTaskQaRequest, "request_sha256");
const wrongTaskQaResult = {
  ...finalQaResult,
  task_id: wrongTaskQaRequest.task_id,
  request_sha256: wrongTaskQaRequest.request_sha256,
  result_sha256: "",
};
wrongTaskQaResult.result_sha256 = artifactDigest(wrongTaskQaResult, "result_sha256");
const leakedQaRequest = {
  ...finalQaRequest,
  candidate_outputs: [{ role: "integrator", output: "blind answer" }],
  request_sha256: "",
};
leakedQaRequest.request_sha256 = artifactDigest(leakedQaRequest, "request_sha256");
const leakedQaRequestResult = {
  ...finalQaResult,
  request_sha256: leakedQaRequest.request_sha256,
  result_sha256: "",
};
leakedQaRequestResult.result_sha256 = artifactDigest(
  leakedQaRequestResult,
  "result_sha256",
);
const leakedQaFindingResult = {
  ...finalQaResult,
  status: "fail",
  findings: [
    {
      criterion_id: "criterion-1",
      observed: "mismatch",
      expected: "match",
      evidence_refs: ["evidence-1"],
      reproducible_next_check: "repeat check",
      role_assignments: ["integrator"],
    },
  ],
  result_sha256: "",
};
leakedQaFindingResult.result_sha256 = artifactDigest(
  leakedQaFindingResult,
  "result_sha256",
);
const leakedQaArtifact = {
  ...finalQaReviewArtifact,
  candidate_outputs: [{ role: "integrator", output: "blind answer" }],
};
const leakedQaArtifactRequest = {
  ...finalQaRequest,
  final_artifact_sha256: finalQaReviewArtifactDigest(leakedQaArtifact),
  request_sha256: "",
};
leakedQaArtifactRequest.request_sha256 = artifactDigest(
  leakedQaArtifactRequest,
  "request_sha256",
);
const leakedQaArtifactResult = {
  ...finalQaResult,
  request_sha256: leakedQaArtifactRequest.request_sha256,
  final_artifact_sha256: leakedQaArtifactRequest.final_artifact_sha256,
  result_sha256: "",
};
leakedQaArtifactResult.result_sha256 = artifactDigest(
  leakedQaArtifactResult,
  "result_sha256",
);
const emptyCriteriaQaRequest = {
  ...finalQaRequest,
  acceptance_criteria: [""],
  request_sha256: "",
};
emptyCriteriaQaRequest.request_sha256 = artifactDigest(
  emptyCriteriaQaRequest,
  "request_sha256",
);
const emptyCriteriaQaResult = {
  ...finalQaResult,
  request_sha256: emptyCriteriaQaRequest.request_sha256,
  result_sha256: "",
};
emptyCriteriaQaResult.result_sha256 = artifactDigest(
  emptyCriteriaQaResult,
  "result_sha256",
);
const validFailureFinding = {
  criterion_id: "criterion-1",
  observed: "mismatch",
  expected: "match",
  evidence_refs: ["evidence-1"],
  reproducible_next_check: "repeat check",
};
const passWithFindingsQaResult = {
  ...finalQaResult,
  findings: [validFailureFinding],
  result_sha256: "",
};
passWithFindingsQaResult.result_sha256 = artifactDigest(
  passWithFindingsQaResult,
  "result_sha256",
);
const emptyMismatchQaResult = {
  ...finalQaResult,
  status: "fail",
  findings: [{ ...validFailureFinding, observed: "", expected: "" }],
  result_sha256: "",
};
emptyMismatchQaResult.result_sha256 = artifactDigest(
  emptyMismatchQaResult,
  "result_sha256",
);
const qaMetadataOnlyArtifact = {
  ...finalQaReviewArtifact,
  protocol_run_manifest_sha256: "post-qa-manifest-sha",
  final_qa: {
    required: true,
    status: "pass",
    effective_result_status: "verified_consensus",
    request_sha256: finalQaRequest.request_sha256,
    result_sha256: finalQaResult.result_sha256,
  },
};
const qaSemanticChangeArtifact = {
  ...qaMetadataOnlyArtifact,
  hokage_synthesis: "changed after QA",
};
record(
  "final_qa_review_artifact_projection",
  finalQaReviewArtifactDigest(finalQaReviewArtifact) ===
    finalQaReviewArtifactDigest(qaMetadataOnlyArtifact) &&
    finalQaReviewArtifactDigest(finalQaReviewArtifact) !==
      finalQaReviewArtifactDigest(qaSemanticChangeArtifact),
  "QA metadata affected the review projection or a semantic edit did not",
);
record(
  "final_qa_binding_mismatch_and_replay_rejected",
  finalQaBindingMismatches.every(
    (result) => !validatesFinalQaBinding(finalQaRequest, result, finalQaReviewArtifact),
  ) &&
    !validatesFinalQaBinding(finalQaRequest, staleDigestFinalQaResult, finalQaReviewArtifact) &&
    !validatesFinalQaBinding(finalQaRequest, finalQaResult, {
      ...finalQaReviewArtifact,
      hokage_synthesis: "artifact changed before validation",
    }) &&
    !validatesFinalQaBinding(wrongTaskQaRequest, wrongTaskQaResult, finalQaReviewArtifact) &&
    validatesFinalQaBinding(replayQaRequest, replayQaResult, replayQaReviewArtifact) &&
    !validatesFinalQaBinding(finalQaRequest, replayQaResult, finalQaReviewArtifact),
  "mismatched, replayed, unattested, or stale-digest final QA was accepted",
);
record(
  "final_qa_role_blind_payload_guard",
  !validatesFinalQaBinding(
    leakedQaRequest,
    leakedQaRequestResult,
    finalQaReviewArtifact,
  ) &&
    !validatesFinalQaBinding(
      finalQaRequest,
      leakedQaFindingResult,
      finalQaReviewArtifact,
    ) &&
    !validatesFinalQaBinding(
      leakedQaArtifactRequest,
      leakedQaArtifactResult,
      leakedQaArtifact,
    ),
  "role-bearing request, finding, or reviewed artifact payload was accepted",
);
record(
  "final_qa_criteria_and_findings_semantics",
  !validatesFinalQaBinding(
    emptyCriteriaQaRequest,
    emptyCriteriaQaResult,
    finalQaReviewArtifact,
  ) &&
    !validatesFinalQaBinding(
      finalQaRequest,
      passWithFindingsQaResult,
      finalQaReviewArtifact,
    ) &&
    !validatesFinalQaBinding(
      finalQaRequest,
      emptyMismatchQaResult,
      finalQaReviewArtifact,
    ),
  "empty criteria, pass-with-findings, or empty mismatch details were accepted",
);

const digestManifest = {
  schema: "protocol_run_manifest.v1",
  run_id: "run-1",
  task_id: "task-1",
  source_packet_sha256: "source-sha",
  current_phase: "source_packet",
  phase_integrity: {
    blind_semantic_redundancy_audit_complete: "not_reached",
    moderator_reconcile_complete: "not_reached",
    safety_report_complete: "not_reached",
    synthesis_provenance_checked: "not_reached",
    final_qa_complete_or_not_required: "not_reached",
  },
  moderator: { moderator_report_sha256: "" },
  safety_supervisor: { preflight_status: "pass", report_complete: false, safety_report_sha256: "" },
  qa: {
    required: true,
    request_id: "",
    request_sha256: "",
    result_sha256: "",
    final_artifact_sha256: "",
    reviewer_binding: "unavailable",
    request_result_artifact_binding_verified: false,
    independent_reviewer_attestation: false,
    role_blind_attestation: false,
    status: "not_reached",
    effective_result_status: "not_reached",
  },
  checkpoint_hashes: Object.fromEntries(protocolCheckpointOrder.map((name) => [name, ""])),
  blind_semantic_redundancy_status: "not_reached",
  manifest_sha256: "",
};
const checkpointArtifacts = [];
let digestSafetyReport;
for (const phase of protocolCheckpointOrder) {
  digestManifest.current_phase = phase;
  if (phase === "reveal") {
    digestManifest.phase_integrity.blind_semantic_redundancy_audit_complete = "pass";
    digestManifest.blind_semantic_redundancy_status = "sufficient";
  }
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
  if (phase === "qa") {
    finalQaReviewArtifact.safety_report_sha256 = digestSafetyReport.safety_report_sha256;
    finalQaRequest.final_artifact_sha256 = finalQaReviewArtifactDigest(
      finalQaReviewArtifact,
    );
    finalQaRequest.request_sha256 = artifactDigest(finalQaRequest, "request_sha256");
    finalQaResult.request_sha256 = finalQaRequest.request_sha256;
    finalQaResult.final_artifact_sha256 = finalQaRequest.final_artifact_sha256;
    finalQaResult.result_sha256 = artifactDigest(finalQaResult, "result_sha256");
    digestManifest.phase_integrity.final_qa_complete_or_not_required = "pass";
    digestManifest.qa = {
      required: true,
      request_id: finalQaRequest.request_id,
      request_sha256: finalQaRequest.request_sha256,
      result_sha256: finalQaResult.result_sha256,
      final_artifact_sha256: finalQaRequest.final_artifact_sha256,
      reviewer_binding: "host_provided",
      request_result_artifact_binding_verified: true,
      independent_reviewer_attestation: true,
      role_blind_attestation: true,
      status: "pass",
      effective_result_status: "verified_consensus",
    };
  }
  const checkpoint = createProtocolCheckpoint(digestManifest, phase);
  checkpointArtifacts.push(checkpoint);
  digestManifest.checkpoint_hashes[phase] = checkpoint.checkpoint_sha256;
}
const finalManifestDigest = artifactDigest(digestManifest, "manifest_sha256");
digestManifest.manifest_sha256 = finalManifestDigest;
const changedSafetyManifest = JSON.parse(JSON.stringify(digestManifest));
changedSafetyManifest.safety_supervisor.safety_report_sha256 = "changed-safety-digest";
const changedSemanticRedundancyManifest = JSON.parse(JSON.stringify(digestManifest));
changedSemanticRedundancyManifest.blind_semantic_redundancy_status = "insufficient";
const changedFinalQaManifest = JSON.parse(JSON.stringify(digestManifest));
changedFinalQaManifest.qa.result_sha256 = sha256("other QA result");
const changedEffectiveResultManifest = JSON.parse(JSON.stringify(digestManifest));
changedEffectiveResultManifest.qa.effective_result_status = "blocked";
function buildRehashedCheckpointTamper(mutator) {
  const checkpoints = JSON.parse(JSON.stringify(checkpointArtifacts));
  const manifest = JSON.parse(JSON.stringify(digestManifest));
  mutator(checkpoints);
  rehashCheckpointChainForProbe(checkpoints, manifest);
  return { checkpoints, manifest };
}
const checkpointBindingTampers = [
  buildRehashedCheckpointTamper((checkpoints) => {
    checkpoints[5].manifest_snapshot.current_phase = "tampered";
  }),
  buildRehashedCheckpointTamper((checkpoints) => {
    checkpoints[2].run_id = "other-run";
  }),
  buildRehashedCheckpointTamper((checkpoints) => {
    checkpoints[3].manifest_snapshot.task_id = "other-task";
  }),
  buildRehashedCheckpointTamper((checkpoints) => {
    checkpoints[4].manifest_snapshot.schema = "other_manifest.v1";
  }),
  buildRehashedCheckpointTamper((checkpoints) => {
    checkpoints[6].manifest_snapshot.checkpoint_hashes = {};
  }),
];
const reorderedCheckpoints = JSON.parse(JSON.stringify(checkpointArtifacts));
[reorderedCheckpoints[4], reorderedCheckpoints[5]] = [reorderedCheckpoints[5], reorderedCheckpoints[4]];
const reorderedDigestManifest = Object.fromEntries(
  Object.entries(digestManifest).reverse(),
);
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
  verifyProtocolCheckpointChain(checkpointArtifacts, digestManifest) &&
    verifyProtocolCheckpointChain(checkpointArtifacts, reorderedDigestManifest),
  "complete nine-phase checkpoint chain failed verification",
);
record(
  "protocol_checkpoint_chain_tamper_detected",
  checkpointBindingTampers.every(
    ({ checkpoints, manifest }) => !verifyProtocolCheckpointChain(checkpoints, manifest),
  ) &&
    !verifyProtocolCheckpointChain(reorderedCheckpoints, digestManifest) &&
    !verifyProtocolCheckpointChain(checkpointArtifacts.slice(0, -1), digestManifest),
  "rehashed run/task/schema/phase/snapshot tamper, reordering, or incomplete chain was accepted",
);
record(
  "manifest_final_digest_binds_safety",
  finalManifestDigest !== artifactDigest(changedSafetyManifest, "manifest_sha256"),
  "final manifest digest did not bind the safety report digest",
);
record(
  "manifest_final_digest_binds_semantic_redundancy",
  finalManifestDigest !==
    artifactDigest(changedSemanticRedundancyManifest, "manifest_sha256"),
  "final manifest digest did not bind the semantic-redundancy status",
);
record(
  "manifest_final_digest_binds_final_qa",
  finalManifestDigest !== artifactDigest(changedFinalQaManifest, "manifest_sha256") &&
    finalManifestDigest !==
      artifactDigest(changedEffectiveResultManifest, "manifest_sha256"),
  "final manifest digest did not bind the final-QA result and effective status",
);
const postQaConsensusDraft = {
  schema: "consensus_report.v1",
  task_id: "task-1",
  protocol_run_manifest_sha256: "",
  moderator_report_sha256: "moderator-report-sha",
  safety_report_sha256: digestSafetyReport.safety_report_sha256,
  result_status: "verified_consensus",
  hokage_synthesis: "final semantic result",
  stop_decision: "stop_sufficient",
  next_action: "execute proposed route",
  final_qa: {
    required: true,
    status: "pass",
    effective_result_status: "verified_consensus",
    request_id: finalQaRequest.request_id,
    request_sha256: finalQaRequest.request_sha256,
    result_sha256: finalQaResult.result_sha256,
    final_artifact_sha256: finalQaRequest.final_artifact_sha256,
    reviewer_binding: "host_provided",
    request_result_artifact_binding_verified: true,
    independent_reviewer_attestation: true,
    role_blind_attestation: true,
    review_packet_scope: "final_artifact_criteria_evidence_only",
    candidate_role_identities_excluded: true,
    findings: finalQaResult.findings,
  },
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
const blockedFinalQaResult = {
  ...finalQaResult,
  status: "blocked",
  findings: [
    {
      criterion_id: "criterion-1",
      observed: "required evidence unavailable",
      expected: "required evidence available",
      evidence_refs: ["evidence-1"],
      reproducible_next_check: "provide the missing evidence and repeat QA",
    },
  ],
  result_sha256: "",
};
blockedFinalQaResult.result_sha256 = artifactDigest(
  blockedFinalQaResult,
  "result_sha256",
);
const blockedConsensus = JSON.parse(JSON.stringify(postQaConsensusDraft));
blockedConsensus.final_qa.status = "blocked";
blockedConsensus.final_qa.effective_result_status = "blocked";
blockedConsensus.final_qa.result_sha256 = blockedFinalQaResult.result_sha256;
blockedConsensus.final_qa.findings = blockedFinalQaResult.findings;
const blockedManifest = JSON.parse(JSON.stringify(digestManifest));
blockedManifest.qa.status = "blocked";
blockedManifest.qa.effective_result_status = "blocked";
blockedManifest.qa.result_sha256 = blockedFinalQaResult.result_sha256;
const blockedCheckpointArtifacts = rebuildFinalQaCheckpoint(
  checkpointArtifacts,
  blockedManifest,
);
blockedConsensus.protocol_run_manifest_sha256 = blockedManifest.manifest_sha256;
const staleQaSnapshotManifest = JSON.parse(JSON.stringify(digestManifest));
staleQaSnapshotManifest.qa.status = "blocked";
staleQaSnapshotManifest.qa.effective_result_status = "blocked";
staleQaSnapshotManifest.qa.result_sha256 = blockedFinalQaResult.result_sha256;
staleQaSnapshotManifest.manifest_sha256 = artifactDigest(
  staleQaSnapshotManifest,
  "manifest_sha256",
);
const mismatchedConsensusQaStatus = JSON.parse(JSON.stringify(postQaConsensusFinal));
mismatchedConsensusQaStatus.final_qa.status = "blocked";
const blockedQaWithIncorrectEffectiveStatus = JSON.parse(
  JSON.stringify(blockedConsensus),
);
blockedQaWithIncorrectEffectiveStatus.final_qa.effective_result_status =
  "verified_consensus";
const mismatchedManifestReviewer = JSON.parse(JSON.stringify(digestManifest));
mismatchedManifestReviewer.qa.reviewer_binding = "unavailable";
mismatchedManifestReviewer.manifest_sha256 = artifactDigest(
  mismatchedManifestReviewer,
  "manifest_sha256",
);
const mismatchedManifestReviewerConsensus = JSON.parse(
  JSON.stringify(postQaConsensusFinal),
);
mismatchedManifestReviewerConsensus.protocol_run_manifest_sha256 =
  mismatchedManifestReviewer.manifest_sha256;
const otherTaskManifest = JSON.parse(JSON.stringify(digestManifest));
otherTaskManifest.task_id = "task-other";
otherTaskManifest.manifest_sha256 = artifactDigest(otherTaskManifest, "manifest_sha256");
const otherTaskManifestConsensus = JSON.parse(JSON.stringify(postQaConsensusFinal));
otherTaskManifestConsensus.protocol_run_manifest_sha256 = otherTaskManifest.manifest_sha256;
const missingConsensusQaScope = JSON.parse(JSON.stringify(postQaConsensusFinal));
delete missingConsensusQaScope.final_qa.review_packet_scope;
const missingConsensusQaExclusion = JSON.parse(JSON.stringify(postQaConsensusFinal));
delete missingConsensusQaExclusion.final_qa.candidate_role_identities_excluded;
const notRequiredManifest = JSON.parse(JSON.stringify(digestManifest));
notRequiredManifest.qa = {
  required: false,
  request_id: "",
  request_sha256: "",
  result_sha256: "",
  final_artifact_sha256: "",
  reviewer_binding: "not_required",
  request_result_artifact_binding_verified: "not_required",
  independent_reviewer_attestation: "not_required",
  role_blind_attestation: "not_required",
  status: "not_required",
  effective_result_status: "verified_consensus",
};
const notRequiredCheckpointArtifacts = rebuildFinalQaCheckpoint(
  checkpointArtifacts,
  notRequiredManifest,
);
const notRequiredConsensus = JSON.parse(JSON.stringify(postQaConsensusFinal));
notRequiredConsensus.protocol_run_manifest_sha256 = notRequiredManifest.manifest_sha256;
notRequiredConsensus.final_qa = {
  required: false,
  status: "not_required",
  effective_result_status: "verified_consensus",
  request_id: "",
  request_sha256: "",
  result_sha256: "",
  final_artifact_sha256: "",
  reviewer_binding: "not_required",
  request_result_artifact_binding_verified: "not_required",
  independent_reviewer_attestation: "not_required",
  role_blind_attestation: "not_required",
  review_packet_scope: "not_required",
  candidate_role_identities_excluded: true,
  findings: [],
};
const invalidNotRequiredConsensus = JSON.parse(JSON.stringify(notRequiredConsensus));
invalidNotRequiredConsensus.final_qa.effective_result_status = "blocked";
const invalidNotRequiredManifest = JSON.parse(JSON.stringify(notRequiredManifest));
invalidNotRequiredManifest.qa.request_id = "unexpected-request";
invalidNotRequiredManifest.manifest_sha256 = artifactDigest(
  invalidNotRequiredManifest,
  "manifest_sha256",
);
const invalidNotRequiredManifestConsensus = JSON.parse(
  JSON.stringify(notRequiredConsensus),
);
invalidNotRequiredManifestConsensus.protocol_run_manifest_sha256 =
  invalidNotRequiredManifest.manifest_sha256;
record(
  "final_qa_consensus_manifest_binding_consistent",
  validatesRecordedFinalQaBinding(
      finalQaRequest,
      finalQaResult,
      postQaConsensusFinal,
      digestManifest,
  ) &&
    validatesRecordedFinalQaBinding(
      finalQaRequest,
      blockedFinalQaResult,
      blockedConsensus,
      blockedManifest,
    ) &&
    !validatesRecordedFinalQaBinding(
      finalQaRequest,
      finalQaResult,
      mismatchedConsensusQaStatus,
      digestManifest,
    ) &&
    !validatesRecordedFinalQaBinding(
      finalQaRequest,
      blockedFinalQaResult,
      blockedQaWithIncorrectEffectiveStatus,
      blockedManifest,
    ) &&
    !validatesRecordedFinalQaBinding(
      finalQaRequest,
      finalQaResult,
      mismatchedManifestReviewerConsensus,
      mismatchedManifestReviewer,
    ) &&
    !validatesRecordedFinalQaBinding(
      finalQaRequest,
      finalQaResult,
      otherTaskManifestConsensus,
      otherTaskManifest,
    ) &&
    !validatesRecordedFinalQaBinding(
      finalQaRequest,
      finalQaResult,
      missingConsensusQaScope,
      digestManifest,
    ) &&
    !validatesRecordedFinalQaBinding(
      finalQaRequest,
      finalQaResult,
      missingConsensusQaExclusion,
      digestManifest,
    ),
  "consensus and manifest accepted a mismatched QA status or reviewer binding",
);
record(
  "final_qa_not_required_binding_consistent",
  validatesNotRequiredFinalQaRecord(notRequiredConsensus, notRequiredManifest) &&
    !validatesNotRequiredFinalQaRecord(
      invalidNotRequiredConsensus,
      notRequiredManifest,
    ) &&
    !validatesNotRequiredFinalQaRecord(
      invalidNotRequiredManifestConsensus,
      invalidNotRequiredManifest,
    ),
  "not-required QA accepted stale binding data or an incorrect effective status",
);
record(
  "protocol_checkpoint_final_qa_snapshot_binding",
  verifyProtocolCheckpointChain(blockedCheckpointArtifacts, blockedManifest) &&
    verifyProtocolCheckpointChain(
      notRequiredCheckpointArtifacts,
      notRequiredManifest,
    ) &&
    !verifyProtocolCheckpointChain(checkpointArtifacts, staleQaSnapshotManifest),
  "final QA checkpoint did not bind the final manifest snapshot",
);
const passedDeliveryView = finalDeliveryView(postQaConsensusFinal);
const blockedDeliveryView = finalDeliveryView(blockedConsensus);
const notRequiredDeliveryView = finalDeliveryView(notRequiredConsensus);
const missingEffectiveDeliveryConsensus = JSON.parse(
  JSON.stringify(postQaConsensusFinal),
);
delete missingEffectiveDeliveryConsensus.final_qa.effective_result_status;
const invalidEffectiveDeliveryConsensus = JSON.parse(
  JSON.stringify(postQaConsensusFinal),
);
invalidEffectiveDeliveryConsensus.final_qa.effective_result_status = "unknown";
const notRunDeliveryConsensus = JSON.parse(JSON.stringify(postQaConsensusFinal));
notRunDeliveryConsensus.final_qa.status = "not_run";
notRunDeliveryConsensus.final_qa.effective_result_status = "blocked";
notRunDeliveryConsensus.final_qa.request_result_artifact_binding_verified = false;
notRunDeliveryConsensus.final_qa.reviewer_binding = "unavailable";
notRunDeliveryConsensus.final_qa.independent_reviewer_attestation = false;
notRunDeliveryConsensus.final_qa.role_blind_attestation = false;
const passedBlockedDeliveryConsensus = JSON.parse(
  JSON.stringify(postQaConsensusFinal),
);
passedBlockedDeliveryConsensus.result_status = "blocked";
passedBlockedDeliveryConsensus.final_qa.effective_result_status = "blocked";
const notRequiredBlockedDeliveryConsensus = JSON.parse(
  JSON.stringify(notRequiredConsensus),
);
notRequiredBlockedDeliveryConsensus.result_status = "blocked";
notRequiredBlockedDeliveryConsensus.final_qa.effective_result_status = "blocked";
record(
  "final_qa_effective_delivery_status_authoritative",
  passedDeliveryView.result_status === "verified_consensus" &&
    passedDeliveryView.stop_decision === "stop_sufficient" &&
    blockedDeliveryView.result_status === "blocked" &&
    blockedDeliveryView.stop_decision === "blocked" &&
    blockedDeliveryView.next_action === "address_final_qa_findings_or_rerun" &&
    blockedDeliveryView.next_action !== blockedConsensus.next_action &&
    notRequiredDeliveryView.result_status === "verified_consensus" &&
    notRequiredDeliveryView.stop_decision === "stop_sufficient" &&
    finalDeliveryView(missingEffectiveDeliveryConsensus).result_status === "blocked" &&
    finalDeliveryView(invalidEffectiveDeliveryConsensus).result_status === "blocked" &&
    finalDeliveryView(blockedQaWithIncorrectEffectiveStatus).result_status ===
      "blocked" &&
    finalDeliveryView(notRunDeliveryConsensus).result_status === "blocked" &&
    finalDeliveryView(passedBlockedDeliveryConsensus).stop_decision === "blocked" &&
    finalDeliveryView(passedBlockedDeliveryConsensus).next_action !==
      passedBlockedDeliveryConsensus.next_action &&
    finalDeliveryView(notRequiredBlockedDeliveryConsensus).stop_decision ===
      "blocked",
  "frozen proposal status, stop, or next action overrode the effective QA delivery gate",
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
    "docs/release-acceptance-v1.0.1.md",
    "docs/release-acceptance-v1.1.0.md",
    "docs/releases/v1.0.0.md",
    "docs/releases/v1.0.1.md",
    "docs/releases/v1.1.0.md",
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
  const compatibility = read(join(workspaceRoot, "docs/compatibility.md"));
  const namingRisk = read(join(workspaceRoot, "docs/naming-risk.md"));
  const packageManifest = parseJson(join(workspaceRoot, "manifest/package-manifest.json"));
  const assetManifest = parseJson(join(workspaceRoot, "manifest/assets.json"));

  record(
    "readme_install_update",
    /^## Install And Update$/m.test(readme) &&
      readme.includes("node scripts/install.mjs --scope project") &&
      readme.includes("node scripts/install.mjs --scope user"),
    "README install/update section or commands missing",
  );
  record("readme_restart", /restart Codex/i.test(readme), "README restart guidance missing");
  record("readme_positive_trigger", readme.includes("$naruto Review this architecture"), "positive trigger missing");
  record("readme_negative_trigger", readme.includes("$naruto: Review this architecture"), "negative trigger missing");
  record("readme_no_generic_fallback", readme.includes("cannot be replaced by generic agents"), "no-fallback note missing");
  record("readme_validation", readme.includes("npm test"), "single validation command missing");
  record("readme_package_version", readme.includes("| Package contract | `" + packageJson?.version + "`"), "README package version mismatch");
  record("readme_loop_contract", readme.includes("one reveal/revision cycle only"), "bounded loop contract missing");
  record("readme_integrity_contract", readme.includes("`protocol_run_manifest.v1`") && readme.includes("same-target follow-up") && readme.includes("experience-transfer"), "phase-integrity or host receipt contract missing");
  record("readme_epistemic_contract", readme.includes("independence key") && readme.includes("quick surrender") && readme.includes("role-blind independent final QA"), "evidence or QA contract missing");
  record("readme_supervision_contract", readme.includes("`training_guidance_packet.v1`") && readme.includes("Yamato produces a final") && readme.includes("Hokage synthesizes"), "public parent or supervision contract missing");
  record("readme_training_instance_contract", readme.includes("`actor_identity_id: naruto_uzumaki`") && readme.includes("`method_matrix.v1`") && readme.includes("training envelopes bind each runtime"), "README shared-identity or method-assignment contract missing");
  record("readme_tsunade_parent", readme.includes("Tsunade Senju, Fifth Hokage") && readme.includes("not a seventh child profile"), "Tsunade must be the parent-process public identity, not a bundled profile");
  record("readme_final_qa_role", readme.includes("host-provided, role-blind `final_qa` reviewer") && readme.includes("CONDITIONAL, NOT BUNDLED"), "README must disclose the conditional host-provided final QA role");
  record(
    "readme_semantic_redundancy_boundary",
    readme.includes("Blind semantic-redundancy audit") &&
      readme.includes("BUNDLED, HEURISTIC") &&
      readme.includes("provisional_consensus"),
    "README must disclose the heuristic semantic-redundancy audit and its result ceiling",
  );
  record(
    "readme_final_qa_interoperability",
    readme.includes("The closed-envelope example binds request, result, task") &&
      readme.includes("manifest, and effective outcome") &&
      readme.includes("effective_result_status` as the sole delivery") &&
      readme.includes("without adding a seventh profile") &&
      readme.includes("mismatch, replay, or non-pass QA blocks delivery"),
    "README must identify the non-bundled final QA interoperability example",
  );
  record(
    "package_additive_1_1_compatibility",
    compatibility.includes("### Additive Artifact Extension Rule") &&
      compatibility.includes("wire-level parse compatibility") &&
      /No `\.v1` field is\s+renamed or removed/.test(compatibility),
    "additive 1.1 artifact reader and producer rules missing",
  );
  record(
    "package_rights_confirmation_pending",
    namingRisk.includes("## Current Distribution State") &&
      namingRisk.includes("Explicit publisher confirmation") &&
      namingRisk.includes("remains pending") &&
      !namingRisk.includes("FrameCoreWorks selected route 3"),
    "rights status must not infer publisher acceptance from asset selection",
  );
  record("readme_fan_art_scope", /unofficial fan art/i.test(readme) && /expressly excluded from that license/i.test(readme), "README fan-art rights scope missing");
  record("notice_no_affiliation", /not affiliated with, endorsed by, sponsored by, or approved by/i.test(notice), "no-affiliation notice missing");
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
    packageJson?.version === "1.1.0" &&
      packageManifest?.package_version === packageJson?.version,
    "package and manifest must use the exact 1.1.0 version",
  );
  record(
    "package_manifest_release",
    packageManifest?.release?.status === "stable" &&
      packageManifest?.release?.contract_version === packageJson?.version &&
      packageManifest?.release?.node_minimum_major === 22 &&
      JSON.stringify(packageManifest?.release?.ci_node_majors) === JSON.stringify([22, 24]) &&
      packageManifest?.release?.runtime_capability_policy === "fail_closed" &&
      packageManifest?.release?.fan_art_rights_clearance === "not_cleared" &&
      packageManifest?.release?.publisher_legal_risk_route_confirmation === "pending",
    "stable release metadata, Node matrix, or runtime capability policy mismatch",
  );
  record(
    "package_manifest_semantic_redundancy",
      packageManifest?.release?.blind_semantic_redundancy_audit ===
      "required_claim_level_heuristic" &&
      packageManifest?.release?.semantic_sufficient_requires_claim_and_lineage_diversity === true &&
      packageManifest?.release?.semantic_one_dimensional_difference_ceiling ===
        "provisional_consensus" &&
      packageManifest?.release?.semantic_redundancy_benchmark_calibrated === false &&
      packageManifest?.validation_surfaces?.stale_opaque_handle_requirement_rejected === true &&
      packageManifest?.validation_surfaces?.blind_semantic_redundancy_fixtures === true &&
      packageManifest?.validation_surfaces?.semantic_pair_matrix_and_reference_integrity === true &&
      packageManifest?.validation_surfaces?.semantic_fixture_status_linkage === true &&
      packageManifest?.validation_surfaces?.final_qa_closed_envelope_validation === true &&
      packageManifest?.validation_surfaces?.final_qa_effective_result_binding === true,
    "semantic-redundancy release or validation metadata mismatch",
  );
  record(
    "package_manifest_same_target_continuity",
    packageManifest?.runtime_preflight?.same_target_followup_receipt_required === true &&
      packageManifest?.runtime_preflight?.same_target_followup_receipt_count_required === 4 &&
      packageManifest?.runtime_preflight?.opaque_runtime_handle_hash_forbidden === true,
    "package manifest must require four same-target receipts without opaque handles",
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
      assetManifest?.assets?.[0]?.qa?.status === "accepted_with_known_deviation" &&
      assetManifest?.assets?.[0]?.qa?.exact_spaced_title_compliance === false &&
      assetManifest?.assets?.[0]?.distribution?.delivery_status === "public_github_repository" &&
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
      packageManifest?.host_role_requirements?.[0]?.interoperability_template ===
        "templates/consensus-report.md#host-provided-final-qa-interoperability-example" &&
      packageManifest?.host_role_requirements?.[0]?.request_result_binding_required === true &&
      packageManifest?.host_role_requirements?.[0]?.final_artifact_digest_binding_required === true &&
      packageManifest?.host_role_requirements?.[0]?.closed_v1_envelope_required === true &&
      packageManifest?.host_role_requirements?.[0]?.effective_result_status_binding_required === true &&
      packageManifest?.host_role_requirements?.[0]
        ?.effective_result_status_is_delivery_authority === true &&
      packageManifest?.host_role_requirements?.[0]
        ?.frozen_proposal_actions_ignored_when_blocked === true &&
      packageManifest?.host_role_requirements?.[0]?.non_pass_effective_result_status === "blocked" &&
      packageManifest?.host_role_requirements?.[0]?.binding_mismatch_policy === "blocked" &&
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
