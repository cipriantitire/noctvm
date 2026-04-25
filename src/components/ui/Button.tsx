import React, { type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type Variant = "primary" | "secondary" | "ghost" | "submit" | "outline";
export type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary:
    "rounded-xl bg-gradient-to-r from-noctvm-violet to-purple-500 text-foreground font-semibold text-sm shadow-lg shadow-noctvm-violet/30 hover:opacity-90 active:scale-[0.98]",
  secondary:
    "rounded-lg border border-white/10 bg-noctvm-black/40 text-noctvm-silver text-xs font-medium hover:border-noctvm-violet/30 hover:text-noctvm-violet",
  ghost:
    "text-noctvm-silver hover:text-foreground transition-all font-bold text-noctvm-micro uppercase tracking-widest",
  submit:
    "px-8 py-2.5 bg-noctvm-violet text-foreground rounded-xl font-bold text-noctvm-caption uppercase tracking-widest hover:bg-noctvm-violet/80 disabled:opacity-50 active:scale-[0.96] shadow-lg shadow-noctvm-violet/20",
  outline:
    "border border-noctvm-border bg-transparent text-foreground hover:bg-white/5",
};

export const buttonVariants = ({ variant = "primary", size = "md", className }: { variant?: Variant, size?: Size, className?: string } = {}) => {
  const vClass = variantClass[variant] || "";
  let sClass = "";
  
  if (size === "sm") {
    if (variant === "primary") sClass = "py-2 px-3 text-xs";
    else if (variant === "secondary") sClass = "px-2.5 py-1.5";
    else if (variant === "submit") sClass = "py-2 px-6 text-noctvm-micro";
    else if (variant === "outline" || variant === "ghost") sClass = "px-3 py-1.5";
  } else if (size === "md") {
    if (variant === "primary") sClass = "py-3.5 px-4 w-full justify-center";
    else if (variant === "secondary") sClass = "px-3 py-1.5";
    else if (variant === "outline" || variant === "ghost") sClass = "px-4 py-2";
  } else if (size === "lg") {
    if (variant === "primary") sClass = "py-4 px-6 text-base";
    else if (variant === "secondary") sClass = "px-4 py-2";
    else if (variant === "submit") sClass = "py-3 px-10";
    else if (variant === "outline" || variant === "ghost") sClass = "px-6 py-3";
  }

  return cn(
    "inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap",
    vClass,
    sClass,
    className
  );
};

type Common = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: React.ReactNode;
};

export type ButtonProps = Common &
  (
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    href,
    ...rest
  } = props;

  const classes = buttonVariants({ variant, size, className });

  if (href) {
    return (
      <a href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
});
