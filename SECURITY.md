# Security Policy

## Supported Versions

We maintain and patch versions on the main branch. Please use the latest release for full protection.

## Security Guidelines (Cloudflare AI Agent Best Practices)

- **Input Validation**: All inputs to the agent are strictly validated and sanitized against prompt injection and malformed payloads.
- **Authentication & Authorization**: Access is controlled using Cloudflare Zero Trust, enforcing least-privilege by default.
- **Traffic Proxying**: All inbound/outbound agent requests are routed via Cloudflare AI Gateway with `cf-aig-authorization` header for session control.
- **Encryption**: Sensitive states and agent comms are encrypted at rest and in transit.
- **Data Loss Prevention**: Integrate with Cloudflare DLP to monitor and prevent leakage of sensitive information.
- **Browser Isolation**: Protected endpoints may use Cloudflare’s Browser Isolation for high-risk operations.
- **Continuous Testing**: Security test suites run via automated CI processes. All PRs run `npx vitest run` and `npx wrangler dev --test`.
- **Supply Chain Security**: All dependencies are audited for vulnerabilities before and after deployment.

## Vulnerability Reporting

If you discover a potential security issue, please report it via a private GitHub issue or email the maintainers.
