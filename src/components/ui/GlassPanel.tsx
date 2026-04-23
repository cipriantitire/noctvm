import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * NOCTVM GlassPanel variants — canonical surface definitions.
 *
 * BACKWARD COMPATIBILITY: Old variant names (default, subtle, header, noise)
 * are kept as aliases so existing usage does not break. Prefer the new
 * domain-specific names for new code.
 */
const variantClass = {
  /* ── NEW canonical names (preferred) ── */
  card: "frosted-glass",
  modal: "frosted-glass-modal frosted-noise border border-white/10",
  sheet: "frosted-glass-modal frosted-noise border border-white/10",
  popover: "frosted-glass-subtle",
  nav: "frosted-glass-header",
  input: "frosted-glass",
  button: "glass-button",

  /* ── OLD aliases (backward compatible) ── */
  default: "frosted-glass",
  subtle: "frosted-glass-subtle",
  header: "frosted-glass-header",
  noise:
    "bg-noctvm-black border border-white/10 rounded-noctvm-xl frosted-noise shadow-2xl relative overflow-hidden",
} as const;

export type GlassPanelVariant = keyof typeof variantClass;

export type GlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  variant?: GlassPanelVariant;
};

export function GlassPanel({
  variant = "default",
  className,
  children,
  ...rest
}: GlassPanelProps) {
  return (
    <div
      className={cn(variantClass[variant], className)}
      {...rest}
    >
      {children}
    </div>
  );
}
