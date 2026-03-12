# Security & Configuration

- Never commit secrets; use environment variables.
- Confirm auth, error handling, and sensitive-data safety before merge.
- Enforce authorization at the resource level (not only route-level); validate token issuer, audience, and expiry.
- Validate all external input at trust boundaries; use strict schemas (reject unknown fields) and parameterized queries.
- Apply rate limits, payload size limits, and timeouts to reduce abuse and DoS risk.
- Do not log secrets or sensitive data; use structured logging and safe error responses (no stack traces in prod).
- Separate dev/staging/prod environments; never reuse credentials or production data.
