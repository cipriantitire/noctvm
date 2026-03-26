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
          black: "rgb(var(--noctvm-black-rgb) / <alpha-value>)",
          midnight: "rgb(var(--noctvm-midnight-rgb) / <alpha-value>)",
          violet: "rgb(var(--noctvm-violet-rgb) / <alpha-value>)",
          gold: "rgb(var(--noctvm-gold-rgb) / <alpha-value>)",
          silver: "rgb(var(--noctvm-silver-rgb) / <alpha-value>)",
          emerald: "rgb(var(--noctvm-emerald-rgb) / <alpha-value>)",
          surface: "rgb(var(--noctvm-surface-rgb) / <alpha-value>)",
          "surface-light": "rgb(var(--noctvm-surface-light-rgb) / <alpha-value>)",
          border: "rgb(var(--noctvm-border-rgb) / <alpha-value>)",
        },
        // Semantic aliases for Radix/animate-ui component compatibility
        background: "var(--background)",
        foreground: "#ffffff",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
      },
      fontFamily: {
        heading: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        "noctvm-xs": ["8px", { lineHeight: "1.2" }],
        "noctvm-micro": ["9px", { lineHeight: "1.2" }],
        "noctvm-caption": ["10px", { lineHeight: "1.3" }],
        "noctvm-label": ["11px", { lineHeight: "1.4" }],
      },
      borderRadius: {
        "noctvm-sm": "var(--radius-sm)",
        "noctvm-md": "var(--radius-md)",
        "noctvm-lg": "var(--radius-lg)",
        "noctvm-xl": "var(--radius-xl)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      backgroundImage: {
        "glow-violet":
          "radial-gradient(ellipse at center, rgb(var(--noctvm-violet-rgb) / 0.15) 0%, transparent 70%)",
        "glow-gold":
          "radial-gradient(ellipse at center, rgb(var(--noctvm-gold-rgb) / 0.1) 0%, transparent 70%)",
      },
      boxShadow: {
        glow: "0 0 20px rgb(var(--noctvm-violet-rgb) / 0.3)",
        "glow-lg": "0 0 40px rgb(var(--noctvm-violet-rgb) / 0.4)",
        "glow-gold": "0 0 20px rgb(var(--noctvm-gold-rgb) / 0.3)",
      },
      zIndex: {
        dropdown: "70",
        sheet: "80",
        popover: "90",
        modal: "100",
        "modal-content": "105",
        "overlay": "110",
        "viewer": "200",
        "viewer-controls": "201",
        "editor": "250",
        toast: "200",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite alternate",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        glowPulse: {
          "0%": { boxShadow: "0 0 15px rgb(var(--noctvm-violet-rgb) / 0.2)" },
          "100%": { boxShadow: "0 0 30px rgb(var(--noctvm-violet-rgb) / 0.5)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
