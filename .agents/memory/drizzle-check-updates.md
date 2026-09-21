---
name: Drizzle CHECK updates
description: Handling changed PostgreSQL CHECK expressions that drizzle-kit push does not detect.
---

Do not assume `drizzle-kit push` will replace an existing named PostgreSQL
`CHECK` when only its expression changes. Treat the live constraint behavior as
the verification source of truth.

**Why:** Drizzle can compare the constraint name without detecting an internal
expression change, leaving the database with stale enforcement.

**How to apply:** Include negative database tests for changed checks and use a
versioned migration to replace the constraint when its behavior must change.