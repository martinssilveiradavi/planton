---
name: Orval + Zod v3 compatibility
description: Orval v8 generates Zod v4 syntax that breaks when the workspace uses Zod v3.
---

## The rule
Never use `type: integer` or `format: email` in `lib/api-spec/openapi.yaml` when the workspace catalog pins `zod: ^3.x`.

## Why
Orval v8.x generates `zod.int()` for integer types and `zod.email()` for email-format strings. Both are Zod v4 methods that do not exist in Zod v3. The codegen itself succeeds but `tsc --build` fails immediately after with ~50 errors.

## How to apply
- Use `type: number` for all numeric IDs and integer fields (IDs, counts, page, limit).
- Omit `format: email` from string fields — Orval generates `zod.string()` which is compatible.
- This only affects `lib/api-zod`; the React Query client (`lib/api-client-react`) is unaffected.
- Fix: `sed -i 's/type: integer/type: number/g' lib/api-spec/openapi.yaml && sed -i '/format: email/d' lib/api-spec/openapi.yaml`
