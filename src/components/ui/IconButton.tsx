import { cn } from "@/lib/cn";

const sizes = {
  sm: "w-8 h-8 [&_svg]:w-3.5 [&_svg]:h-3.5",
  md: "w-9 h-9 [&_svg]:w-4 [&_svg]:h-4",
  lg: "w-10 h-10 [&_svg]:w-5 [&_svg]:h-5",
};

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: keyof typeof sizes;
  /** Default: circular dark glass control */
  variant?: "overlay" | "plain";
};

export function IconButton({
  className,
  size = "md",
  variant = "overlay",
  type = "button",
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-white/10 transition-all shrink-0",
        variant === "overlay" &&
          "bg-noctvm-black/60 backdrop-blur-sm text-noctvm-silver hover:text-foreground hover:bg-noctvm-black/80",
        variant === "plain" && "bg-transparent border-transparent hover:bg-white/10 text-foreground",
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
