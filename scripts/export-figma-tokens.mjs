/**
 * Generates figma-tokens/noctvm-sds-override.json in Tokens Studio format.
 *
 * Two token groups:
 *  1. "sds" — overrides every --sds-* variable with NOCTVM values so the
 *             Simple Design System kit re-themes dark/violet when imported.
 *  2. "noctvm" — NOCTVM-only tokens (glass, extended radii, durations, etc.)
 *               for new components not covered by the SDS kit.
 *
 * Usage:
 *   node scripts/export-figma-tokens.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'figma-tokens');
const outFile = join(outDir, 'noctvm-sds-override.json');

// ─── SDS override tokens (re-themes the Simple Design System kit) ────────────

const sds = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  "color/background/default/default": {
    value: "#050505", description: "App background — void black", type: "color",
  },
  "color/background/default/secondary": {
    value: "#0A0A0A", description: "Surface — obsidian", type: "color",
  },
  "color/background/default/tertiary": {
    value: "#111111", description: "Surface light — smoke", type: "color",
  },
  "color/background/brand/default": {
    value: "#7C3AED", description: "Brand primary — ultraviolet", type: "color",
  },
  "color/background/brand/secondary": {
    value: "#8B5CF6", description: "Brand hover — violet", type: "color",
  },
  "color/background/brand/tertiary": {
    value: "#1A1A1A", description: "Selected/active bg — ash", type: "color",
  },
  "color/background/neutral/default": {
    value: "#1A1A1A", description: "Neutral bg — ash", type: "color",
  },
  "color/background/neutral/secondary": {
    value: "#2A2A2A", description: "Neutral hover — concrete", type: "color",
  },
  "color/background/neutral/tertiary": {
    value: "#2A2A2A", description: "Neutral active — concrete", type: "color",
  },
  "color/background/positive/default": {
    value: "#10B981", description: "Success bg — emerald", type: "color",
  },
  "color/background/negative/default": {
    value: "#EF4444", description: "Error bg — signal red", type: "color",
  },
  "color/background/warning/default": {
    value: "#D4A843", description: "Warning bg — gold", type: "color",
  },

  // ── Borders ───────────────────────────────────────────────────────────────
  "color/border/default/default": {
    value: "#1A1A1A", description: "Default border", type: "color",
  },
  "color/border/default/secondary": {
    value: "#2A2A2A", description: "Secondary border", type: "color",
  },
  "color/border/brand/default": {
    value: "#7C3AED", description: "Brand border — ultraviolet", type: "color",
  },
  "color/border/neutral/default": {
    value: "#1A1A1A", description: "Neutral border", type: "color",
  },
  "color/border/neutral/secondary": {
    value: "#2A2A2A", description: "Neutral secondary border — concrete", type: "color",
  },
  "color/border/positive/default": {
    value: "#10B981", description: "Success border", type: "color",
  },
  "color/border/negative/default": {
    value: "#EF4444", description: "Error border", type: "color",
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  "color/text/default/default": {
    value: "#E8E4DF", description: "Body text — bone", type: "color",
  },
  "color/text/default/secondary": {
    value: "#8A8A8A", description: "Muted text — steel", type: "color",
  },
  "color/text/default/tertiary": {
    value: "#4A4A4A", description: "Disabled text", type: "color",
  },
  "color/text/brand/on-brand": {
    value: "#FFFFFF", description: "Text on brand bg", type: "color",
  },
  "color/text/brand/on-brand-secondary": {
    value: "#E8E4DF", description: "Active nav item text", type: "color",
  },
  "color/text/brand/default": {
    value: "#A78BFA", description: "Brand text — orchid", type: "color",
  },
  "color/text/destructive/default": {
    value: "#EF4444", description: "Error text — signal", type: "color",
  },
  "color/text/success/default": {
    value: "#10B981", description: "Success text — emerald", type: "color",
  },
  "color/text/warning/default": {
    value: "#D4A843", description: "Warning text — gold", type: "color",
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  "color/icon/default/default": {
    value: "#8A8A8A", description: "Default icon — steel", type: "color",
  },
  "color/icon/brand/default": {
    value: "#7C3AED", description: "Brand icon — ultraviolet", type: "color",
  },

  // ── Typography ────────────────────────────────────────────────────────────
  "typography/body/font-family": {
    value: "DM Sans", description: "Body font family", type: "fontFamilies",
  },
  "typography/body/size/medium": {
    value: "14px", description: "Body medium size", type: "fontSizes",
  },
  "typography/body/size/small": {
    value: "12px", description: "Body small size (label/caption)", type: "fontSizes",
  },
  "typography/body/size/large": {
    value: "16px", description: "Body large size", type: "fontSizes",
  },
  "typography/body/font-weight/regular": {
    value: "400", description: "Body regular weight", type: "fontWeights",
  },
  "typography/body/font-weight/medium": {
    value: "500", description: "Body medium weight", type: "fontWeights",
  },
  "typography/body/font-weight/strong": {
    value: "700", description: "Body bold weight", type: "fontWeights",
  },
  "typography/heading/font-family": {
    value: "Syne", description: "Heading/display font", type: "fontFamilies",
  },
  "typography/heading/font-weight/default": {
    value: "700", description: "Heading bold", type: "fontWeights",
  },
  "typography/heading/font-weight/light": {
    value: "400", description: "Heading regular", type: "fontWeights",
  },
  "typography/mono/font-family": {
    value: "JetBrains Mono", description: "Mono / system font", type: "fontFamilies",
  },
  "typography/mono/font-weight/regular": {
    value: "400", description: "Mono regular weight", type: "fontWeights",
  },

  // ── Sizing ────────────────────────────────────────────────────────────────
  "size/space/100": { value: "4px", type: "spacing" },
  "size/space/200": { value: "8px", type: "spacing" },
  "size/space/300": { value: "12px", type: "spacing" },
  "size/space/400": { value: "16px", type: "spacing" },
  "size/space/600": { value: "24px", type: "spacing" },
  "size/space/800": { value: "32px", type: "spacing" },
  "size/space/1000": { value: "40px", type: "spacing" },
  "size/space/1200": { value: "48px", type: "spacing" },
  "size/space/1600": { value: "64px", type: "spacing" },
  "size/space/2000": { value: "80px", type: "spacing" },
  "size/space/4000": { value: "160px", type: "spacing" },

  "size/radius/100": { value: "4px", type: "borderRadius" },
  "size/radius/200": { value: "8px", description: "sm — rounded-lg", type: "borderRadius" },
  "size/radius/300": { value: "12px", description: "md — rounded-xl", type: "borderRadius" },
  "size/radius/400": { value: "16px", description: "lg — rounded-2xl", type: "borderRadius" },
  "size/radius/600": { value: "24px", description: "xl — rounded-3xl", type: "borderRadius" },
  "size/radius/full": { value: "9999px", description: "pill / full round", type: "borderRadius" },

  "size/stroke/border": { value: "1px", type: "borderWidth" },
  "size/stroke/focus": { value: "2px", type: "borderWidth" },
};

// ─── NOCTVM-only tokens (not in SDS) ────────────────────────────────────────

const noctvm = {
  // ── Full palette ──────────────────────────────────────────────────────────
  "color/void":       { value: "#050505", description: "Deepest black", type: "color" },
  "color/obsidian":   { value: "#0A0A0A", description: "Surface", type: "color" },
  "color/smoke":      { value: "#111111", description: "Surface light", type: "color" },
  "color/ash":        { value: "#1A1A1A", description: "Subtle bg", type: "color" },
  "color/concrete":   { value: "#2A2A2A", description: "Hover bg", type: "color" },
  "color/steel":      { value: "#8A8A8A", description: "Muted text", type: "color" },
  "color/bone":       { value: "#E8E4DF", description: "Body text", type: "color" },
  "color/chalk":      { value: "#F5F3F0", description: "Near-white", type: "color" },
  "color/white":      { value: "#FFFFFF", description: "Pure white", type: "color" },
  "color/ultraviolet":{ value: "#7C3AED", description: "Brand primary", type: "color" },
  "color/violet":     { value: "#8B5CF6", description: "Brand hover", type: "color" },
  "color/orchid":     { value: "#A78BFA", description: "Brand light", type: "color" },
  "color/lavender":   { value: "#C4B5FD", description: "Brand pale", type: "color" },
  "color/magenta":    { value: "#DB2777", description: "Accent magenta", type: "color" },
  "color/fuchsia":    { value: "#E879A0", description: "Accent fuchsia", type: "color" },
  "color/neon":       { value: "#C026D3", description: "Neon purple", type: "color" },
  "color/emerald":    { value: "#10B981", description: "Success / emerald", type: "color" },
  "color/gold":       { value: "#D4A843", description: "Gold / prestige", type: "color" },
  "color/signal":     { value: "#EF4444", description: "Error / alert", type: "color" },
  "color/midnight":   { value: "#1A0A2E", description: "Deep violet bg", type: "color" },

  // ── Glass / frosted ───────────────────────────────────────────────────────
  "glass/bg":             { value: "rgba(255,255,255,0.07)", description: "Frosted glass background", type: "color" },
  "glass/bg-modal":       { value: "rgba(18,18,18,0.88)", description: "Modal glass bg", type: "color" },
  "glass/border":         { value: "rgba(255,255,255,0.10)", description: "Glass border", type: "color" },
  "glass/border-subtle":  { value: "rgba(255,255,255,0.08)", description: "Subtle glass border", type: "color" },
  "glass/inset-highlight":{ value: "rgba(255,255,255,0.05)", description: "Glass inset sheen", type: "color" },
  "glass/blur-md":        { value: "12px", description: "Standard glass blur", type: "other" },
  "glass/blur-lg":        { value: "16px", description: "Large glass blur", type: "other" },
  "glass/blur-xl":        { value: "25px", description: "Header/modal blur", type: "other" },

  // ── Extended radius ───────────────────────────────────────────────────────
  "radius/sm": { value: "8px", type: "borderRadius" },
  "radius/md": { value: "12px", type: "borderRadius" },
  "radius/lg": { value: "16px", type: "borderRadius" },
  "radius/xl": { value: "24px", type: "borderRadius" },

  // ── Motion ────────────────────────────────────────────────────────────────
  "duration/fast":   { value: "150ms", type: "other" },
  "duration/normal": { value: "300ms", type: "other" },
  "duration/slow":   { value: "500ms", type: "other" },

  // ── Z-index ───────────────────────────────────────────────────────────────
  "z/dropdown": { value: "70", type: "other" },
  "z/sheet":    { value: "80", type: "other" },
  "z/popover":  { value: "90", type: "other" },
  "z/modal":    { value: "100", type: "other" },
  "z/overlay":  { value: "110", type: "other" },
  "z/viewer":   { value: "200", type: "other" },
  "z/editor":   { value: "250", type: "other" },
  "z/toast":    { value: "200", type: "other" },

  // ── Typography scale ──────────────────────────────────────────────────────
  "typography/size/hero":     { value: "48px", type: "fontSizes" },
  "typography/size/h1":       { value: "36px", type: "fontSizes" },
  "typography/size/h2":       { value: "24px", type: "fontSizes" },
  "typography/size/h3":       { value: "18px", type: "fontSizes" },
  "typography/size/body-lg":  { value: "16px", type: "fontSizes" },
  "typography/size/body":     { value: "14px", type: "fontSizes" },
  "typography/size/label":    { value: "12px", type: "fontSizes" },
  "typography/size/caption":  { value: "10px", type: "fontSizes" },
  "typography/size/micro":    { value: "9px", type: "fontSizes" },

  // ── Overlays ──────────────────────────────────────────────────────────────
  "overlay/subtle": { value: "rgba(0,0,0,0.4)", type: "color" },
  "overlay/medium": { value: "rgba(0,0,0,0.6)", type: "color" },
  "overlay/heavy":  { value: "rgba(0,0,0,0.8)", type: "color" },

  // ── Glow effects ─────────────────────────────────────────────────────────
  "glow/violet": { value: "0 0 20px rgba(124,58,237,0.3)", description: "Violet glow shadow", type: "boxShadow" },
  "glow/gold":   { value: "0 0 20px rgba(212,168,67,0.3)", description: "Gold glow shadow", type: "boxShadow" },
};

// ─── Build nested object from flat slash-separated keys ──────────────────────

function buildNested(flat) {
  const out = {};
  for (const [key, token] of Object.entries(flat)) {
    const parts = key.split('/');
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = token;
  }
  return out;
}

// ─── Assemble final Tokens Studio document ───────────────────────────────────

const tokensStudio = {
  sds: buildNested(sds),
  noctvm: buildNested(noctvm),
  $metadata: {
    tokenSetOrder: ["sds", "noctvm"],
  },
};

// ─── Write output ─────────────────────────────────────────────────────────────

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(tokensStudio, null, 2));

console.log(`✓ Written: figma-tokens/noctvm-sds-override.json`);
console.log(`  • sds.*   — ${Object.keys(sds).length} tokens (override Simple Design System)`);
console.log(`  • noctvm.* — ${Object.keys(noctvm).length} tokens (NOCTVM-only extensions)`);
console.log('');
console.log('Next steps in Figma:');
console.log('  1. Install "Tokens Studio for Figma" plugin');
console.log('  2. Load figma-tokens/noctvm-sds-override.json');
console.log('  3. Apply token set "sds" → all SDS components re-theme dark/violet');
console.log('  4. Apply token set "noctvm" → new NOCTVM components use correct values');
