---
name: Doctor subscription access
description: Business rule for Planton doctor access and recurring subscription state transitions
---

Only a doctor subscription confirmed as active by an Asaas payment webhook grants access to doctor features. A subscription created in Asaas starts pending, and cancellation ends access immediately after the recurring charge is cancelled.

**Why:** The product decision is to charge doctors R$ 129,90 monthly and prevent unpaid access; ending access immediately avoids presenting a cancelled subscription as usable.

**How to apply:** Keep the server-side active-subscription middleware authoritative, mirror the same state in the client gate, and make any cancellation messaging say that access ends immediately.