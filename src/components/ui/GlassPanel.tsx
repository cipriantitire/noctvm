import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const variantClass = {
  default: "frosted-glass",
  modal: "frosted-glass-modal frosted-noise border border-white/10",
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
