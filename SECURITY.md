# Security Policy

## Supported Versions

Security fixes are maintained for the latest `1.0.x` release line.

| Version | Supported |
|---|---|
| `1.0.x` | Yes |
| `< 1.0` | No |

## Reporting A Vulnerability

If the repository host exposes private vulnerability reporting, use its
private security-advisory form. Include the affected version, reproducible
steps, expected and observed behavior, impact, and the smallest useful test
case.

If private reporting is unavailable, do not publish exploit details, secrets,
private paths, or sensitive logs in a public issue. Open a minimal issue asking
the maintainer to provide a private reporting channel, without including the
vulnerability details.

Do not send credentials, API keys, tokens, cookies, private keys, or unrelated
user data with a report. There is no published response-time or remediation
SLA.

## Security Boundaries

- The package has no runtime dependency on external providers or services.
- All six bundled custom-agent profiles are read-only.
- `$naruto` does not authorize file writes, provider or API calls, MCP access,
  uploads, pushes, installation, deletion, or nested-agent delegation.
- The installer is expected to stay within its declared project or user roots,
  reject unsafe destinations and legacy conflicts, preserve unrelated files,
  and avoid silent overwrite unless `--force` is explicitly supplied.
- Copying is sequential and post-copy verified, but not transactional. A rare
  filesystem failure can leave a partial target; inspect the reported paths and
  rerun a dry run before recovery.
- `SHA256SUMS` covers package files except the checksum file itself. It detects
  drift only when the checksum file or commit comes from a trusted channel; a
  checksum stored beside an untrusted checkout does not authenticate that
  checkout. This package does not include a cryptographic release signature.
- Missing profiles, supervision, capacity, or same-thread continuation must
  fail closed with `blocked`; generic substitute agents are not permitted.

## Out Of Scope

Questions about franchise names, character artwork, fan-art distribution, or
other third-party rights are legal and licensing matters, not security
vulnerabilities. Review `NOTICE.md` and `docs/naming-risk.md` for those risks.
