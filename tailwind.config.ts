import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        noctvm: {
          black: '#050505',
          midnight: '#1A0A2E',
          violet: '#7C3AED',
          gold: '#D4A843',
          silver: '#8A8A8A',
          emerald: '#10B981',
          surface: '#0A0A0A',
          'surface-light': '#111111',
          border: '#1A1A1A',
        }
      },
      fontFamily: {
        heading: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      backgroundImage: {
        'glow-violet': 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
        'glow-gold': 'radial-gradient(ellipse at center, rgba(212,168,67,0.1) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(124,58,237,0.3)',
        'glow-lg': '0 0 40px rgba(124,58,237,0.4)',
        'glow-gold': '0 0 20px rgba(212,168,67,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowPulse: {
          '0%': { boxShadow: '0 0 15px rgba(124,58,237,0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(124,58,237,0.5)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
