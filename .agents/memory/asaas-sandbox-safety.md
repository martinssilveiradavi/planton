---
name: Asaas sandbox safety
description: Safe environment detection and test-document handling for Asaas payment validation.
---

Treat any Asaas base URL containing `sandbox` as a test environment because both legacy and current hostname formats exist. In non-production runtime, reject Asaas endpoints that are neither sandbox nor a loopback test server.

**Why:** Exact-hostname detection misclassified a configured Asaas endpoint, causing repeated CPF/CNPJ validation failures and risking calls to the wrong environment during payment validation.

**How to apply:** Keep sandbox customer fixtures isolated from production behavior. Allow loopback hosts only for automated tests, and require the actual Asaas Sandbox URL and key before performing an end-to-end payment test.

Sandbox credentials are separate from production credentials. When a sandbox selector is enabled, use the sandbox base URL and key, but always let an explicitly configured loopback URL win so API tests continue to use their local mock server.

**Why:** A shared sandbox selector can otherwise redirect integration tests to the real Sandbox API, creating external side effects and making tests fail for unrelated account data.

**How to apply:** Keep `ASAAS_API_KEY_SANDBOX` and `ASAAS_BASE_URL_SANDBOX` separate, and preserve localhost/127.0.0.1 test overrides before applying the environment selector.