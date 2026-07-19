# Release Acceptance: 1.0.0

Published 2026-07-18. Publication evidence corrected 2026-07-19.

This is the historical evidence boundary for `v1.0.0`. It separates what the
repository and isolated-install tests proved from behavior that only a target
Codex host could prove.

## Claim Boundary

Version `1.0.0` was a stable file, package, installer, and static protocol
contract. It was not a blanket claim that every Codex build supported six
custom profiles, the required concurrent capacity, effective read-only child
permissions, or same-thread follow-up.

| Lane | Recorded `v1.0.0` status | Meaning |
|---|---|---|
| Static package contract | `PASS` | Canonical and portable validators, schemas, fixtures, six profile files, public IDs, package layout, banner metadata, and checksums agreed for commit `7cd400389eada8d39321d0d9d308e8c8b3e02b33`. |
| Isolated installer contract | `PASS` | The published suite passed its original fresh-install, dry-run, conflict, force, path, symlink, migration, and installed-skill cases. Later hardening gaps are addressed by `1.0.1`. |
| Hosted CI | `PASS` | Node 22 and 24 passed in both the main and tag workflow runs linked below. |
| Host custom-profile discovery | `NOT PROVEN` | No recorded target-host run proves invocation of all six dedicated profiles. |
| Host effective read-only permissions | `NOT PROVEN` | Profile defaults existed, but no recorded live evidence proves the effective child result. |
| Host same-thread revision | `NOT PROVEN` | Static files and hosted CI did not prove follow-up to the same four instance threads. |
| Host independent final QA | `CONDITIONAL, NOT BUNDLED` | Consequential results required a host-provided role-blind reviewer. |
| External publication | `PUBLIC` | The repository and GitHub Release were published after local preparation. |
| Fan-art rights | `NOT CLEARED` | Technical validation did not grant permission or constitute rights clearance. |

## Published Evidence

- Public repository:
  [FrameCoreWorks/naruto-codex-deliberation-council](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council)
- Release:
  [`v1.0.0`](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/releases/tag/v1.0.0)
- Main workflow:
  [Actions run 29687294043](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/actions/runs/29687294043)
- Tag workflow:
  [Actions run 29687369374](https://github.com/FrameCoreWorks/naruto-codex-deliberation-council/actions/runs/29687369374)

Both hosted runs tested Node.js 22 and 24 at commit
`7cd400389eada8d39321d0d9d308e8c8b3e02b33`. They are evidence for that exact
commit, not for later working trees or tags.

## Reproduce The Historical Checkout

```bash
git clone --branch v1.0.0 --depth 1 \
  https://github.com/FrameCoreWorks/naruto-codex-deliberation-council.git
cd naruto-codex-deliberation-council
git describe --tags --exact-match
npm test
npm run checksums:check
git diff --check
```

The original static lane covered:

- exact trigger fixtures
- one shared actor identity and four fixed method assignments
- Kakashi guidance and common reveal integrity
- Yamato preflight and final safety-report scaffolding
- packet, envelope, commit, revision, checkpoint, and synthesis invariants
- Tsunade Senju as the parent Hokage identity only
- six read-only-default TOML profiles and no seventh Hokage profile
- package files, banner PNG metadata, and checksums

The original installer lane covered:

- fresh project and user installation
- dry-run no-write behavior
- idempotency, conflict handling, and explicit force replacement
- tested path and symlink rejection cases
- legacy pre-`0.4` migration blocking
- installed-skill validation outside the repository checkout

Version `1.0.1` adds stricter CLI parsing, dangling and nested symlink
protection, exact inventories, installed-target validation, and hardened
runtime preflight and receipt contracts. Those improvements must not be retroactively attributed
to `v1.0.0`.

## Target-host Acceptance Was Not Recorded

No public `v1.0.0` evidence proves:

1. discovery and invocation of all six profiles
2. effective child read-only permissions after parent and host policy
3. fresh-context child creation and protected candidate isolation
4. capacity for four Naruto instances, Kakashi, and Yamato
5. follow-up to the exact same four targets after reveal
6. a complete validated protocol artifact bundle
7. independent host-provided final QA for a consequential result

The correct historical host status therefore remains `NOT PROVEN`. If any
required capability was absent or ambiguous, the protocol outcome was
`blocked`; generic substitutes and replacement revision threads were not valid.
