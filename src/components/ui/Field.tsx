import { cn } from "@/lib/cn";

export const inputBaseClassName = cn(
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5",
  "focus:border-noctvm-violet/50 outline-none transition-all text-white frosted-noise text-sm",
  "placeholder:text-white/10"
);

export const labelBaseClassName =
  "text-noctvm-micro text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1";

export type FieldProps = {
  id?: string;
  label: React.ReactNode;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
};

export function Field({
  id,
  label,
  className,
  labelClassName,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(labelBaseClassName, labelClassName)}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...rest }: InputProps) {
  return (
    <input
      className={cn(
        inputBaseClassName,
        "font-bold tracking-tight",
        className
      )}
      {...rest}
    />
  );
}

export type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className, ...rest }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        inputBaseClassName,
        "resize-none font-medium text-xs text-white/80 leading-relaxed rounded-2xl py-3",
        className
      )}
      {...rest}
    />
  );
}
