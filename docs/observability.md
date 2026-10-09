# Observability & Operational Readiness

Please refer to the comprehensive operational runbook in:
[Observability Runbook](file:///docs/engineering/observability.md)

See `docs/engineering/observability.md` for full documentation on:

- Structured JSON logging schema and zero-leak redaction rules
- Distributed request tracing via `X-Request-ID` and correlation IDs
- Liveness vs. Readiness health probes (`/healthz`, `/readyz`, `/api/health`, `/api/ready`)
- In-memory operational metrics telemetry
- Incident triage runbooks for payment webhooks, refunds, database degradation, and service failures
- Environment configuration matrix
