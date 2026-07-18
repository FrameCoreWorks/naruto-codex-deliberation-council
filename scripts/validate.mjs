#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const commands = [
  [join(repoRoot, ".agents/skills/naruto/scripts/validate-naruto.mjs")],
  [join(repoRoot, "scripts/test-install-security.mjs")],
  [join(repoRoot, "scripts/checksums.mjs"), "--check"],
];

for (const args of commands) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(
  JSON.stringify(
    {
      status: "pass",
      package: "codex-deliberation-council",
      standalone: true,
    },
    null,
    2,
  ),
);
