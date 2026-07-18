# Release Acceptance: 1.0.0

This document defines the evidence boundary for version `1.0.0`. It separates
what repository and isolated-install tests can prove from behavior that only a
target Codex host can prove.

## Claim Boundary

Version `1.0.0` is a stable file, package, installer, and static protocol
contract. It is not a blanket claim that every Codex build supports six custom
profiles, the required concurrent capacity, or same-thread follow-up.

The following matrix is the supported release claim. A released checkout must
reproduce both local `PASS` lanes. Host acceptance remains explicitly
unproven until a target-build run records its evidence.

| Lane | 1.0.0 status | What the status means |
|---|---|---|
| Static package contract | `PASS` required | The canonical and portable validators, schemas, fixtures, six read-only profiles, public IDs, Tsunade parent-role metadata, Empirical Verifier contract, package layout, banner metadata, and checksums agree. |
| Isolated installer contract | `PASS` required | Fresh project and user installs, dry-run no-write behavior, idempotency, conflict handling, explicit force replacement, path and symlink rejection, legacy migration blocking, and installed-skill validation succeed in temporary roots. |
| Host custom-profile discovery | `NOT PROVEN BY PACKAGE` | Static files cannot prove that the target Codex build discovers and invokes all six dedicated profiles. |
| Host same-thread revision | `NOT PROVEN BY PACKAGE` | Static files cannot prove that the target build re-contacts the same four open Naruto instance threads after the common reveal. |
| Host independent final QA | `CONDITIONAL, NOT BUNDLED` | Consequential results require a host-provided, role-blind `final_qa` reviewer. If unavailable, the protocol returns `blocked`. |
| External publication | `NOT RUN BY DESIGN` | The release workflow does not create a remote, push, upload, publish, or create a Git tag. |
| Fan-art rights | `NOT CLEARED` | Technical validation does not grant permission or constitute copyright or trademark clearance. |

`PASS required` is a release gate, not a substitute for current command output.
Do not distribute a checkout that does not reproduce the required passes.

## Reproduce Static And Isolated Acceptance

Run from the repository root with Node.js 22 or newer:

```bash
npm test
npm run checksums:check
git diff --check
```

The release suite must return a zero exit status and no checksum drift. The
committed GitHub Actions workflow is configured to run the same gates on
Node.js 22 and 24; no hosted run is claimed or recorded here. The final
delivery record should name the tested Node versions and command results rather
than copying transient logs into this document.

The static lane must cover at least:

- exact trigger activation and documented negative cases
- one shared actor identity and four unique, fixed method assignments
- Integrator, Challenger, Strategist, and Empirical Verifier semantics
- Kakashi guidance and common reveal integrity
- Yamato preflight, protected boundaries, and final safety report
- packet, envelope, commit, revision, checkpoint, and synthesis invariants
- Tsunade Senju as public Hokage identity on the parent process only
- six read-only TOML profiles and no bundled seventh Hokage profile
- neutral optional packet/source roles and a host-provided `final_qa` contract
- package version, required files, banner PNG contract, and checksums

The isolated lane must cover at least:

- fresh project installation
- fresh user-scope installation
- dry-run with no filesystem writes
- a second identical installation returning unchanged results
- differing destination content blocked without `--force`
- reviewed package-owned content replaced with `--force`
- destination and ancestor symlinks rejected
- legacy pre-`0.4` installation blocked even with `--force`
- validation of the installed skill outside the repository checkout

## Target-host Acceptance

Run host acceptance after installation, any required restart, and creation of a
new Codex task. Record the Codex build and target scope. The run must prove:

1. The exact `$naruto` token activates the skill and the documented near-miss
   forms do not.
2. All six dedicated custom profiles are discovered and remain read-only.
3. No separate Hokage profile exists; the parent process assumes Tsunade
   Senju's public Hokage role.
4. Four Naruto instances share `actor_identity_id: naruto_uzumaki` and retain
   four unique method assignments.
5. Kakashi issues one common non-solution guidance packet and one byte-identical
   reveal. Yamato passes identity, packet, boundary, and phase-safety checks.
6. All four instances commit before reveal and solve the complete task through
   their assigned method.
7. Revision returns to the same four original threads. Original and revision
   thread-handle hashes, actor, instance, method, matrix, and envelope bindings
   match.
8. Every revision includes a traceable experience-transfer ledger and the run
   stops after one reveal/revision cycle.
9. Hokage synthesis preserves evidence-backed minority objections and traces
   material claims to evidence and revisions.
10. `$naruto` grants no provider, upload, write, push, install, delete, or other
    authority outside deliberation.
11. When the result is consequential, an independent host-provided `final_qa`
    reviewer receives a role-blind packet and returns reproducible findings.

Until all target-host evidence is recorded, report host acceptance as
`NOT PROVEN`, not `PASS`.

## Fail-closed Rule

If a dedicated profile, Kakashi, Yamato, required capacity, common packet
integrity, blind barrier, opaque thread continuity, or same-thread follow-up is
missing or ambiguous, return `blocked`.

Do not substitute `default`, `worker`, or `explorer`; do not rebuild a revision
in a new thread; do not infer thread continuity from similar prose; and do not
downgrade a missing host capability into a static validation success.
