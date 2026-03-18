/**
 * NOCTVM: Social Mention Resolver
 * Detects and converts tokens like @wallet to interactive links.
 */

const WALLET_RE = /(^|\s)@wallet\b/gi;

/**
 * Resolves special mentions in raw text and returns Markdown-style links
 * @param text The raw input text from a social post or comment
 * @returns Text with mention tokens replaced by internal navigation links
 */
export function resolveSpecialMentions(text: string): string {
  if (!text) return text;
  
  // 1. Process @wallet -> /?tab=wallet
  return text.replace(WALLET_RE, '$1[@wallet](/?tab=wallet)');
}

/**
 * Optional: Rich Text transformation for React components
 * This could be used by a custom markdown renderer or a simple text component.
 */
export const SPECIAL_MENTIONS_CONFIG = {
  wallet: {
    handle: '@wallet',
    href: '/?tab=wallet',
    color: 'text-noctvm-violet',
    glow: 'drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]'
  }
};
