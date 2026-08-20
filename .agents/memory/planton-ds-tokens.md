---
name: Planton design system tokens
description: Key design tokens and rules for the Planton design system artifact.
---

## Palette (light mode)
- primary: #155EEF (CTAs, navigation, selected states)
- accent: #0E9384 (availability, confirmation, positive states)
- background: #F8FAFC (general background)
- foreground: #101828 (main text)
- muted: #475467 (auxiliary text, labels)
- warning: #DC6803 (urgency, near-start shifts)
- destructive: #D92D20 (errors, cancellations)
- border: #D0D5DD

## Typography
- Font: Inter only, weights 400/600/700
- Remuneration values get weight 700 and large size

## Rules
- Edit `artifacts/planton-ds/tokens.json` only; run `pnpm tokens` to regenerate CSS.
- Never hand-edit `src/index.css` or `src/generated/tokens.tsx`.
- Consuming apps: add `@workspace/planton-ds` as workspace:* dependency and `@import "@workspace/planton-ds/styles.css"` as the only CSS import.
- All UI components, `cn`, and toast hooks must come from `@workspace/planton-ds`.
