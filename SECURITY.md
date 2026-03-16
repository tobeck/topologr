# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Topologr, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email: **security@topologr.dev** (or open a [private security advisory](https://github.com/tobeck/topologr/security/advisories/new) on GitHub).

Include:

- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

You should receive a response within 48 hours. We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Scope

This policy applies to the Topologr application code in this repository. It does not cover third-party dependencies — please report those to the respective maintainers.

### In Scope

- SQL injection or database manipulation
- Cross-site scripting (XSS)
- YAML parsing vulnerabilities (e.g., billion laughs, arbitrary code execution)
- Path traversal in file operations
- Authentication/authorization bypass (when auth is implemented)
- Information disclosure

### Out of Scope

- Denial of service via resource exhaustion (Topologr is a self-hosted tool)
- Vulnerabilities in upstream dependencies (report to those projects directly)
- Issues requiring physical access to the host

## Current Security Considerations

- **No authentication in MVP** — Topologr is designed for internal/trusted networks. Do not expose it to the public internet without adding your own auth layer (e.g., reverse proxy with SSO).
- **SQLite** — The database file should be protected by filesystem permissions.
- **YAML parsing** — Input is validated via Zod schemas before processing. The YAML parser does not execute arbitrary code.
