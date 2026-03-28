// NOCTVM Theme Figma Plugin
// Creates a variable collection with all SDS overrides + NOCTVM tokens.

figma.showUI(__html__, { width: 320, height: 380 });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return { r, g, b, a: 1 };
}

function hexAlpha(hex, alpha) {
  const c = hexToRgb(hex);
  c.a = alpha;
  return c;
}

function send(type, text, cls) {
  figma.ui.postMessage({ type, text, cls });
}

function log(text, cls) { send('log', text, cls); }

// ─── Token definitions ────────────────────────────────────────────────────────

// COLOR tokens — value is either a hex string or { hex, alpha }
const COLOR_TOKENS = [
  // SDS overrides ──────────────────────────────────────────────────────────────
  // Background
  ['sds/color/background/default/default',    '#050505'],
  ['sds/color/background/default/secondary',  '#0A0A0A'],
  ['sds/color/background/default/tertiary',   '#111111'],
  ['sds/color/background/brand/default',      '#7C3AED'],
  ['sds/color/background/brand/secondary',    '#8B5CF6'],
  ['sds/color/background/brand/tertiary',     '#1A1A1A'],
  ['sds/color/background/neutral/default',    '#1A1A1A'],
  ['sds/color/background/neutral/secondary',  '#2A2A2A'],
  ['sds/color/background/neutral/tertiary',   '#2A2A2A'],
  ['sds/color/background/positive/default',   '#10B981'],
  ['sds/color/background/negative/default',   '#EF4444'],
  ['sds/color/background/warning/default',    '#D4A843'],
  // Border
  ['sds/color/border/default/default',        '#1A1A1A'],
  ['sds/color/border/default/secondary',      '#2A2A2A'],
  ['sds/color/border/default/tertiary',       '#3A3A3A'],
  ['sds/color/border/brand/default',          '#7C3AED'],
  ['sds/color/border/brand/secondary',        { hex: '#7C3AED', alpha: 0.3 }],
  ['sds/color/border/positive/default',       '#10B981'],
  ['sds/color/border/negative/default',       '#EF4444'],
  ['sds/color/border/warning/default',        '#D4A843'],
  // Text
  ['sds/color/text/default/default',          '#E8E4DF'],
  ['sds/color/text/default/secondary',        '#8A8A8A'],
  ['sds/color/text/default/tertiary',         '#4A4A4A'],
  ['sds/color/text/default/disabled',         '#3A3A3A'],
  ['sds/color/text/brand/default',            '#7C3AED'],
  ['sds/color/text/brand/secondary',          '#8B5CF6'],
  ['sds/color/text/positive/default',         '#10B981'],
  ['sds/color/text/negative/default',         '#EF4444'],
  ['sds/color/text/warning/default',          '#D4A843'],
  ['sds/color/text/onbrand/default',          '#FFFFFF'],
  // Icon
  ['sds/color/icon/default/default',          '#E8E4DF'],
  ['sds/color/icon/default/secondary',        '#8A8A8A'],
  ['sds/color/icon/default/tertiary',         '#4A4A4A'],
  ['sds/color/icon/default/disabled',         '#3A3A3A'],
  ['sds/color/icon/brand/default',            '#7C3AED'],
  ['sds/color/icon/brand/secondary',          '#8B5CF6'],
  ['sds/color/icon/positive/default',         '#10B981'],
  ['sds/color/icon/negative/default',         '#EF4444'],
  ['sds/color/icon/warning/default',          '#D4A843'],
  ['sds/color/icon/onbrand/default',          '#FFFFFF'],

  // NOCTVM palette ─────────────────────────────────────────────────────────────
  ['noctvm/palette/void',                     '#050505'],
  ['noctvm/palette/obsidian',                 '#0A0A0A'],
  ['noctvm/palette/smoke',                    '#111111'],
  ['noctvm/palette/ash',                      '#1A1A1A'],
  ['noctvm/palette/concrete',                 '#2A2A2A'],
  ['noctvm/palette/steel',                    '#3A3A3A'],
  ['noctvm/palette/muted',                    '#8A8A8A'],
  ['noctvm/palette/fog',                      '#BDBDBD'],
  ['noctvm/palette/bone',                     '#E8E4DF'],
  ['noctvm/palette/white',                    '#F5F3F0'],
  ['noctvm/palette/ultraviolet',              '#7C3AED'],
  ['noctvm/palette/violet',                   '#8B5CF6'],
  ['noctvm/palette/lavender',                 '#A78BFA'],
  ['noctvm/palette/emerald',                  '#10B981'],
  ['noctvm/palette/signal',                   '#EF4444'],
  ['noctvm/palette/gold',                     '#D4A843'],
  ['noctvm/palette/amber',                    '#F59E0B'],
  ['noctvm/palette/sky',                      '#0EA5E9'],

  // NOCTVM semantic
  ['noctvm/color/background/app',             '#050505'],
  ['noctvm/color/background/surface',         '#0A0A0A'],
  ['noctvm/color/background/surface-raised',  '#111111'],
  ['noctvm/color/background/overlay',         { hex: '#050505', alpha: 0.85 }],
  ['noctvm/color/background/glass',           { hex: '#FFFFFF', alpha: 0.04 }],
  ['noctvm/color/background/glass-hover',     { hex: '#FFFFFF', alpha: 0.07 }],
  ['noctvm/color/accent/primary',             '#7C3AED'],
  ['noctvm/color/accent/hover',               '#8B5CF6'],
  ['noctvm/color/accent/subtle',              { hex: '#7C3AED', alpha: 0.15 }],
  ['noctvm/color/accent/subtle-border',       { hex: '#7C3AED', alpha: 0.3 }],
  ['noctvm/color/text/primary',               '#E8E4DF'],
  ['noctvm/color/text/secondary',             '#8A8A8A'],
  ['noctvm/color/text/disabled',              '#4A4A4A'],
  ['noctvm/color/text/brand',                 '#7C3AED'],
  ['noctvm/color/text/gold',                  '#D4A843'],
  ['noctvm/color/border/subtle',              { hex: '#FFFFFF', alpha: 0.05 }],
  ['noctvm/color/border/default',             '#1A1A1A'],
  ['noctvm/color/border/strong',              '#3A3A3A'],
  ['noctvm/color/status/success',             '#10B981'],
  ['noctvm/color/status/error',               '#EF4444'],
  ['noctvm/color/status/warning',             '#D4A843'],
  ['noctvm/color/status/info',                '#0EA5E9'],
];

// STRING tokens
const STRING_TOKENS = [
  // SDS typography overrides
  ['sds/typography/body/font-family',         'DM Sans'],
  ['sds/typography/heading/font-family',      'Syne'],
  ['sds/typography/label/font-family',        'DM Sans'],
  ['sds/typography/code/font-family',         'JetBrains Mono'],

  // NOCTVM typography
  ['noctvm/font/display',                     'Syne'],
  ['noctvm/font/body',                        'DM Sans'],
  ['noctvm/font/mono',                        'JetBrains Mono'],
];

// FLOAT tokens (numbers: sizes, radii, z-index)
const FLOAT_TOKENS = [
  // SDS size overrides (px)
  ['sds/size/border-radius/sm',               4],
  ['sds/size/border-radius/md',               8],
  ['sds/size/border-radius/lg',               12],
  ['sds/size/border-radius/xl',               16],
  ['sds/size/border-radius/full',             9999],

  // NOCTVM radius
  ['noctvm/radius/sm',                        8],
  ['noctvm/radius/md',                        12],
  ['noctvm/radius/lg',                        16],
  ['noctvm/radius/xl',                        20],
  ['noctvm/radius/2xl',                       24],
  ['noctvm/radius/3xl',                       32],
  ['noctvm/radius/full',                      9999],

  // NOCTVM z-index
  ['noctvm/z/base',                           0],
  ['noctvm/z/raised',                         10],
  ['noctvm/z/dropdown',                       100],
  ['noctvm/z/sticky',                         200],
  ['noctvm/z/overlay',                        300],
  ['noctvm/z/modal',                          400],
  ['noctvm/z/toast',                          500],
];

// ─── Main logic ───────────────────────────────────────────────────────────────

const COLLECTION_NAME = 'NOCTVM';

async function applyTokens() {
  try {
    // Remove existing collection with same name to start fresh
    const existing = figma.variables.getLocalVariableCollections()
      .find(c => c.name === COLLECTION_NAME);
    if (existing) {
      log('♻ Removing old NOCTVM collection…', 'dim');
      existing.remove();
    }

    const collection = figma.variables.createVariableCollection(COLLECTION_NAME);
    const modeId = collection.defaultModeId;
    collection.renameMode(modeId, 'Dark');

    log(`✔ Created collection "${COLLECTION_NAME}" / Dark mode`, 'ok');

    // Color variables
    let count = 0;
    for (const [name, value] of COLOR_TOKENS) {
      const v = figma.variables.createVariable(name, collection.id, 'COLOR');
      const color = typeof value === 'string' ? hexToRgb(value) : hexAlpha(value.hex, value.alpha);
      v.setValueForMode(modeId, color);
      count++;
    }
    log(`✔ ${count} color variables created`, 'ok');

    // String variables
    count = 0;
    for (const [name, value] of STRING_TOKENS) {
      const v = figma.variables.createVariable(name, collection.id, 'STRING');
      v.setValueForMode(modeId, value);
      count++;
    }
    log(`✔ ${count} string variables created`, 'ok');

    // Float variables
    count = 0;
    for (const [name, value] of FLOAT_TOKENS) {
      const v = figma.variables.createVariable(name, collection.id, 'FLOAT');
      v.setValueForMode(modeId, value);
      count++;
    }
    log(`✔ ${count} number variables created`, 'ok');

    const total = COLOR_TOKENS.length + STRING_TOKENS.length + FLOAT_TOKENS.length;
    log(``, 'dim');
    log(`✔ Done — ${total} tokens applied.`, 'ok');
    log(`Open Variables panel to see the NOCTVM collection.`, 'dim');

    figma.ui.postMessage({ type: 'done' });
  } catch (err) {
    figma.ui.postMessage({ type: 'error', text: String(err) });
  }
}

function removeCollection() {
  const existing = figma.variables.getLocalVariableCollections()
    .find(c => c.name === COLLECTION_NAME);
  if (existing) {
    existing.remove();
    log('✔ NOCTVM collection removed.', 'ok');
  } else {
    log('No NOCTVM collection found.', 'dim');
  }
}

figma.ui.onmessage = (msg) => {
  if (msg.type === 'apply')  applyTokens();
  if (msg.type === 'remove') removeCollection();
};
