---
name: Drizzle wrapped database errors
description: How to reliably classify PostgreSQL errors returned through Drizzle.
---

When translating PostgreSQL errors into domain responses, inspect the thrown error and its nested `cause` chain for the database `code` and `constraint`.

**Why:** In this workspace's Drizzle and node-postgres stack, insert failures can be wrapped in a query error. Checking only the top-level error misses unique violations and turns expected validation responses into HTTP 500 errors.

**How to apply:** Use a bounded traversal of nested causes before classifying known PostgreSQL errors such as unique violations. Keep an unknown-error fallback that rethrows rather than silently swallowing failures.