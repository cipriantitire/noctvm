'use client';

import React from 'react';
import Link from 'next/link';
import { resolveSpecialMentions } from '@/lib/social/mentionResolver';

interface PostBodyProps {
  text: string;
}

/**
 * NOCTVM: PostBody
 * Renders post text with support for specialized deep-linked mentions.
 * Converts [@label](href) into interactive Next.js Links.
 */
export default function PostBody({ text }: PostBodyProps) {
  if (!text) return null;

  // 1. Resolve @tokens into [@token](href) format
  const resolvedText = resolveSpecialMentions(text);

  // 2. Regex to find markdown-style links: [label](href)
  const MD_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = MD_LINK_RE.exec(resolvedText)) !== null) {
    const [fullMatch, label, href] = match;
    const startIndex = match.index;

    // Add preceding text
    if (startIndex > lastIndex) {
      parts.push(resolvedText.substring(lastIndex, startIndex));
    }

    // Add interactive link with premium styling
    const isWalletLink = href.includes('tab=wallet');
    
    parts.push(
      <Link 
        key={startIndex} 
        href={href}
        className={`font-bold transition-all hover:opacity-80 ${
          isWalletLink 
            ? 'text-noctvm-violet drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]' 
            : 'text-white underline decoration-white/20'
        }`}
      >
        {label}
      </Link>
    );

    lastIndex = startIndex + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < resolvedText.length) {
    parts.push(resolvedText.substring(lastIndex));
  }

  return (
    <span className="whitespace-pre-wrap word-break-all">
      {parts.length > 0 ? parts : resolvedText}
    </span>
  );
}
