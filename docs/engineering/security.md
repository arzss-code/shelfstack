# Security Hardening

## Objective

Establish server-side security controls appropriate for a production-oriented
e-commerce application.

## Required Review

### Authentication

Identify which routes are:

- public
- authenticated
- admin
- internal/system

### Authorization

Authorization must be enforced on the server.

Review:

- RBAC
- resource ownership
- admin endpoints
- object-level access
- privilege escalation

### Input Validation

Validate every external input at the server boundary.

Use Zod or the repository's established validation mechanism.

Validate:

- body
- query parameters
- route parameters
- uploaded files
- webhook payloads

### Rate Limiting

Identify abuse-prone endpoints:

- login
- registration
- search
- checkout
- payment initiation
- webhook
- admin APIs

Choose limits based on actual behavior. Do not invent arbitrary limits without
documenting the assumption.

### Secrets

Never expose:

- service-role keys
- database credentials
- Midtrans secrets
- JWT secrets
- Redis credentials
- deployment secrets

Do not log secrets or authentication tokens.

### Webhook Security

Verify signatures before processing payment notifications.

Do not trust client-supplied payment status.

### File Uploads

If uploads exist, review:

- MIME validation
- extension validation
- file size
- filename handling
- storage permissions
- content-type handling

### Security Headers

Review:

- CSP
- HSTS
- X-Content-Type-Options
- Referrer-Policy
- frame protections
- appropriate CORS

Do not add headers blindly; verify compatibility with the application.

## Tests

Add tests for:

- unauthenticated access
- unauthorized role
- valid authorized access
- ownership violation
- malformed payload
- oversized payload
- rate limiting
- invalid webhook signature
- privilege escalation attempts

## Definition of Done

Every sensitive endpoint has explicit server-side authorization and validation,
secrets are protected, webhook signatures are verified, and security tests
cover critical failure paths.
