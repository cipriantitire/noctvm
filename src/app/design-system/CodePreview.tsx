'use client';

import React, { useState } from 'react';

export default function CodePreview({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative mt-6 rounded-lg bg-black/50 border border-white/10 p-4 font-mono text-noctvm-label text-noctvm-silver/90">
      <pre className="overflow-x-auto whitespace-pre-wrap">{code}</pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="absolute top-2 right-2 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-noctvm-caption text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
