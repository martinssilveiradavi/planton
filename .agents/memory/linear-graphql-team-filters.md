---
name: Linear GraphQL team filters
description: Type mismatch when combining a Linear team lookup and issue filter in one GraphQL query.
---

When querying Linear GraphQL, `team(id: ...)` accepts a `String!` variable while an issue filter such as `team: { id: { eq: ... } }` expects an `ID` value. One variable cannot satisfy both positions.

**Why:** Linear rejects the entire query at validation time even though the same UUID identifies the team in both locations.

**How to apply:** Use literal UUIDs for trusted, previously returned team IDs, or declare and use separate variables with the exact types expected by each field.