/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#F8FAFC",
      "foreground": "#101828",
      "border": "#D0D5DD",
      "card": "#FFFFFF",
      "cardForeground": "#101828",
      "popover": "#FFFFFF",
      "popoverForeground": "#101828",
      "primary": "#155EEF",
      "primaryForeground": "#FFFFFF",
      "secondary": "#EFF4FF",
      "secondaryForeground": "#155EEF",
      "muted": "#F1F5F9",
      "mutedForeground": "#475467",
      "accent": "#0E9384",
      "accentForeground": "#FFFFFF",
      "destructive": "#D92D20",
      "destructiveForeground": "#FFFFFF",
      "input": "#D0D5DD",
      "ring": "#155EEF",
      "chart1": "#155EEF",
      "chart2": "#0E9384",
      "chart3": "#DC6803",
      "chart4": "#7C3AED",
      "chart5": "#0EA5E9",
      "sidebar": "#FFFFFF",
      "sidebarForeground": "#101828",
      "sidebarBorder": "#D0D5DD",
      "sidebarPrimary": "#155EEF",
      "sidebarPrimaryForeground": "#FFFFFF",
      "sidebarAccent": "#EFF4FF",
      "sidebarAccentForeground": "#155EEF",
      "sidebarRing": "#155EEF"
    },
    "dark": {
      "background": "#0D1220",
      "foreground": "#F1F5F9",
      "border": "#2D3F5A",
      "card": "#152035",
      "cardForeground": "#F1F5F9",
      "popover": "#152035",
      "popoverForeground": "#F1F5F9",
      "primary": "#3B82F6",
      "primaryForeground": "#FFFFFF",
      "secondary": "#1A2840",
      "secondaryForeground": "#93C5FD",
      "muted": "#1A2840",
      "mutedForeground": "#94A3B8",
      "accent": "#14B8A6",
      "accentForeground": "#FFFFFF",
      "destructive": "#F04438",
      "destructiveForeground": "#FFFFFF",
      "input": "#2D3F5A",
      "ring": "#3B82F6",
      "chart1": "#3B82F6",
      "chart2": "#2DD4BF",
      "chart3": "#F59E0B",
      "chart4": "#A78BFA",
      "chart5": "#38BDF8",
      "sidebar": "#0D1220",
      "sidebarForeground": "#F1F5F9",
      "sidebarBorder": "#2D3F5A",
      "sidebarPrimary": "#3B82F6",
      "sidebarPrimaryForeground": "#FFFFFF",
      "sidebarAccent": "#1A2840",
      "sidebarAccentForeground": "#93C5FD",
      "sidebarRing": "#3B82F6"
    }
  },
  "fontFamily": {
    "sans": [
      "Inter",
      "sans-serif"
    ],
    "serif": [
      "Georgia",
      "serif"
    ],
    "mono": [
      "Menlo",
      "monospace"
    ]
  },
  "radius": "0.875rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
