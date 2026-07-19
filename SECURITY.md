# Security Policy

## Supported Versions

Security fixes are maintained for the latest `1.x` release.

| Version | Supported |
|---|---|
| `1.1.0` | Yes |
| `1.0.0`–`1.0.1` | Upgrade to `1.1.0` |
| `< 1.0` | No |

## Reporting A Vulnerability

Use the repository host's private security-advisory form when it is available.
Include the affected version, reproducible steps, expected and observed
behavior, impact, and the smallest useful test case.

If private reporting is unavailable, do not publish exploit details, secrets,
private paths, or sensitive logs in a public issue. Open a minimal issue asking
the maintainer to provide a private reporting channel without including the
vulnerability details.

Do not send credentials, API keys, tokens, cookies, private keys, or unrelated
user data with a report. There is no published response-time or remediation
SLA.

## Source And Project Trust

- Obtain a specific release tag from the public repository and inspect its
  project-scoped skill, profiles, scripts, and checksums before opening it as a
  trusted Codex project.
- `SHA256SUMS` detects drift only when the checksum file or commit comes from a
  trusted channel. A checksum stored beside an untrusted checkout does not
  authenticate that checkout.
- The package does not currently include a cryptographic release signature.
  Check the release page and workflow evidence for the exact tag being used.
- Do not run the installer from an untrusted or modified source tree.
- Do not run the installer with `sudo`, as Administrator, or into a target that
  another account or process can modify during installation.

## Runtime Boundaries

- The package has no runtime dependency on external providers or services.
- All six profiles declare `sandbox_mode = "read-only"` and
  `approval_policy = "never"` as profile defaults. Effective child permissions
  are controlled by the live parent override, managed policy, and host tool
  surface, so the protocol must verify both effective values and return
  `blocked` when it cannot.
- Child creation must not inherit parent conversation history. Same-thread
  revision must use successful follow-up receipts to the exact targets returned
  at spawn.
- `$naruto` does not authorize file writes, provider or API calls, MCP access,
  uploads, pushes, installation, deletion, or child-initiated nested-agent
  delegation. The parent Hokage fan-out to the six declared profiles remains
  part of the protocol.
- Missing profiles, supervision, effective permissions, capacity, source
  isolation, or same-target continuation must fail closed with `blocked`.
  Generic substitute agents are not permitted.
- Repository self-checks do not prove behavior of a particular Codex host or
  parse an arbitrary live protocol run.
- The package does not bundle a host orchestration adapter or tamper-evident
  event log. Base live acceptance retains unmodified host-tool targets and
  receipts in a parent-owned logical sidecar. Model-authored IDs, hashes, or
  attestations are not substitutes for those runtime facts, and the sidecar
  must not be described as host-enforced or tamper-evident.

## Installer Boundaries

The `1.1.0` installer:

- rejects unknown, duplicated, missing-value, and scope-incompatible options
  before writing
- verifies an exact source inventory against package metadata and checksums
- retains descriptor-verified source bytes and modes for copying instead of
  reopening mutable source paths
- rejects unsafe ancestor, directory, nested, final-component, and dangling
  destination symlinks
- rejects source and destination hard links, including forced replacement
- refuses unexpected files in the package-owned Naruto skill directory
- avoids silent replacement unless `--force` is explicitly supplied
- validates the installed skill from a private verified validator snapshot
  before reporting `installed`

Copies are sequential and post-copy verified, but not transactional. A
filesystem or final-validation failure can leave a partial set of copied
files. Inspect the reported paths and rerun a dry run before recovery. Version
`1.1.0` does not claim automatic rollback or uninstall.

Node.js does not expose a portable `openat`-style API, so checks of destination
ancestor directories cannot be atomic with the final open on every supported
platform. A concurrent writer could swap an ancestor after a check. Keep the
target quiescent and exclusively controlled by the installer user for the
entire command; elevated or shared-writable installs are outside the supported
trust boundary.

## Out Of Scope

Questions about franchise names, character artwork, fan-art distribution, or
other third-party rights are legal and licensing matters, not security
vulnerabilities. Review [`NOTICE.md`](NOTICE.md) and
[`docs/naming-risk.md`](docs/naming-risk.md) for those risks.
