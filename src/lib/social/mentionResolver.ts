/**
 * NOCTVM: Social Mention Resolver
 * Detects and converts tokens like @pocket to interactive links.
 */

const POCKET_RE = /(^|\s)@pocket\b/gi;

/**
 * Resolves special mentions in raw text and returns Markdown-style links
 * @param text The raw input text from a social post or comment
 * @returns Text with mention tokens replaced by internal navigation links
 */
export function resolveSpecialMentions(text: string): string {
  if (!text) return text;

  // Process @pocket -> /?tab=pocket
  return text.replace(POCKET_RE, '$1[@pocket](/?tab=pocket)');
}

/**
 * Optional: Rich Text transformation for React components
 * This could be used by a custom markdown renderer or a simple text component.
 */
export const SPECIAL_MENTIONS_CONFIG = {
  pocket: {
    handle: '@pocket',
    href: '/?tab=pocket',
    color: 'text-noctvm-violet',
    glow: 'drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]'
  }
};
