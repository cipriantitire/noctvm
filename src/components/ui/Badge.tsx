import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "genre" | "featured" | "outline" | "custom";
};

const variantClass: Record<NonNullable<BadgeProps["variant"]>, string> = {
  genre:
    "px-2.5 py-1 rounded-lg text-noctvm-caption uppercase font-bold bg-white/5 text-noctvm-silver/70 border border-white/5 tracking-wide",
  featured:
    "px-2.5 py-1 rounded-lg bg-noctvm-violet/20 text-noctvm-violet text-noctvm-caption font-bold border border-noctvm-violet/30 uppercase tracking-widest",
  outline:
    "px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-tight border backdrop-blur-md",
  custom: "",
};

export function Badge({
  variant = "genre",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        variant !== "custom" && variantClass[variant],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
