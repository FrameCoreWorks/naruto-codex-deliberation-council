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
    contracts: ["naruto_candidate.v1", "naruto_integrative_method.v1"],
  },
  {
    card: "sasuke-uchiha.yaml",
    runtime: "sasuke_uchiha",
    contracts: ["naruto_candidate.v1", "naruto_adversarial_method.v1"],
  },
  {
    card: "shikamaru-nara.yaml",
    runtime: "shikamaru_nara",
    contracts: ["naruto_candidate.v1", "naruto_systems_method.v1"],
  },
  {
    card: "sakura-haruno.yaml",
    runtime: "sakura_haruno",
    contracts: ["naruto_candidate.v1", "naruto_empirical_method.v1"],
  },
  {
    card: "kakashi-hatake.yaml",
    runtime: "kakashi_hatake",
    contracts: ["naruto_moderator.v1", "naruto_commit_barrier.v1"],
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
  "templates/source-packet.md",
  "templates/candidate-solution.md",
  "templates/reveal-transfer.md",
  "templates/revision.md",
  "templates/consensus-report.md",
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
  if (fixture.protected_action_without_normal_gate) return "blocked";
  if (fixture.barrier !== "pass") return "blocked";
  if (fixture.moderator !== "available") return "blocked";
  if (fixture.valid_commits < 3) return "blocked";
  if (fixture.valid_same_thread_revisions < fixture.valid_commits) return "blocked";
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

const packageJsonPath = join(workspaceRoot, "package.json");
const packageJson = existsSync(packageJsonPath) ? parseJson(packageJsonPath) : null;
const packageMode = packageJson?.name === "codex-deliberation-council";

const profileRootCandidates = [
  join(workspaceRoot, ".codex/agents"),
  process.env.CODEX_HOME ? join(resolve(process.env.CODEX_HOME), "agents") : null,
  join(homedir(), ".codex/agents"),
].filter(Boolean);
const uniqueProfileRoots = [...new Set(profileRootCandidates)];
const profileRoot = uniqueProfileRoots.find((root) =>
  expectedAgents.every(({ runtime }) => existsSync(join(root, `${runtime}.toml`))),
);

record(
  "profile_root_available",
  Boolean(profileRoot),
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

for (const expected of expectedAgents) {
  const cardPath = join(skillRoot, "agents", expected.card);
  const cardText = read(cardPath);
  const manifestAgent = manifest?.agents?.find((agent) => agent.runtime_id === expected.runtime);
  const cardContracts = yamlList(cardText, "behavior_contract_ids").sort();
  const canonicalContracts = [...expected.contracts].sort();

  record(`agent_manifest:${expected.runtime}`, Boolean(manifestAgent), "runtime missing from manifest");
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
}

const fixtures = parseJson(join(skillRoot, "fixtures/naruto-fixtures.json"));
for (const fixture of fixtures?.trigger_cases ?? []) {
  record(
    `trigger_fixture:${fixture.id}`,
    matchesExactTrigger(fixture.message) === fixture.expected,
    `expected ${fixture.expected}`,
  );
}

for (const fixture of fixtures?.protocol_cases ?? []) {
  record(
    `protocol_fixture:${fixture.id}`,
    protocolResult(fixture) === fixture.expected_max_result,
    `expected ${fixture.expected_max_result}, got ${protocolResult(fixture)}`,
  );
}

record(
  "protocol_fixture_coverage",
  (fixtures?.protocol_cases ?? []).length >= 9,
  "required protocol edge cases missing",
);
record(
  "domain_fixture_coverage",
  (fixtures?.frozen_domain_cases ?? []).length >= 4 &&
    (fixtures?.frozen_domain_cases ?? []).every(
      ({ required_observables }) => Array.isArray(required_observables) && required_observables.length > 0,
    ),
  "four complete frozen domain cases required",
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
      skillText.includes("Speed, majority, verbosity"),
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
  record("package_private", packageJson?.private === true, "package must not be npm-publishable");
  record("package_no_dependencies", !packageJson?.dependencies && !packageJson?.devDependencies, "package must stay dependency-free");
  record("package_node_version", packageJson?.engines?.node === ">=18", "Node engine requirement mismatch");

  const allPackageFiles = listFiles(workspaceRoot, "", {
    ignoredDirectories: [".git", "node_modules", "__MACOSX"],
  });
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
