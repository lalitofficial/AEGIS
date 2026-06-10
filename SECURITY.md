# Security Policy

## Supported versions

The `main` branch and the latest published Docker images receive security fixes.

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report privately via [GitHub Security Advisories](https://github.com/lalitofficial/AEGIS/security/advisories/new) for this repository. Include:

- A description of the vulnerability and its impact
- Steps to reproduce
- Any suggested remediation

You can expect an acknowledgement within a few days. Once a fix is available, the advisory will be published with credit to the reporter (unless you prefer to remain anonymous).

## Deployment hardening notes

- Never deploy with the development defaults: set strong values for `SECRET_KEY`, `API_KEY`, `POSTGRES_PASSWORD`, and `ADMIN_PASSWORD`.
- `docker-compose.prod.yml` refuses to start without these variables set.
- Keep `DEBUG=False` in production (the default).
- Restrict `ALLOWED_ORIGINS` to your real frontend origins.
