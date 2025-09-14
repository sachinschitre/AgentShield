# Cloudflare AI Agent Security Testing: Implementation Guide

## 1. Setup

- Install Cloudflare agent SDKs (`npm install @cloudflare/agent-sdk`)
- Set up `wrangler` for local simulation (`npm install -g wrangler`)
- Use `vitest` for all unit/scenario testing

## 2. Core Security Controls

- Add middleware for payload validation (ex: check for input anomalies, prompt injection patterns).
- Use authentication tokens issued by Cloudflare AI Gateway. Validate `cf-aig-authorization` on all calls.
- Store and process sensitive info only with encryption active. Never log full agent-user dialogue contents.

## 3. Proxying and Zero Trust

- Register your project with Cloudflare Zero Trust dashboard.
- Configure DLP policies targeting agent endpoints in the dashboard UI.

## 4. Automated Testing

- Write tests (`*.test.ts`) for input validation, privilege enforcement, output filtering, anomaly response.
- Use `wrangler dev --test` to simulate real deployment.

npx vitest run
npx wrangler dev --test


## 5. CI Integration

See `.github/workflows/cloudflare-agent-tests.yml` for a ready workflow.

## 6. Reference

- [Cloudflare Testing Docs](https://developers.cloudflare.com/agents/getting-started/testing-your-agent/)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/cloudflare-one/tutorials/ai-wrapper-tenant-control/)
- [Cloudflare Zero Trust](https://www.cloudflare.com/zero-trust/)
