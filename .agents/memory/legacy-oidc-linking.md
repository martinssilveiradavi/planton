---
name: Legacy OIDC account linking
description: Security rule for attaching a new OIDC subject to an existing password-era user record.
---

When an OIDC subject is not already known, attach it to an existing account found by email only if the token contains an affirmative verified-email assertion. Missing, false, or unexpected verification values must not authorize legacy linking. Also reject an email already linked to a different subject.

**Why:** Email equality alone can let an unverified or conflicting OIDC identity claim an existing professional profile and its authorization.

**How to apply:** Resolve known subjects first. For legacy email matches, fail closed unless the issuer confirms verification; keep new-account creation and manual recovery as separate policies.