import {
  forwardRef,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type InputHTMLAttributes,
} from "react";

export type InputVariant = "default" | "search" | "flat" | "ghost";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: InputVariant;
};

const baseClassName =
  "min-w-0 max-w-full w-full rounded-2xl border-[3px] px-4 py-3 outline-none transition-[border-color] duration-150";

const variantClassName: Record<InputVariant, string> = {
  default:
    "border-outline bg-surface shadow-[4px_4px_0_var(--color-outline)] hover:border-purple focus:border-purple active:border-purple",
  search:
    "border-outline bg-surface py-4 pl-14 shadow-[4px_4px_0_var(--color-outline)] hover:border-purple focus:border-purple active:border-purple",
  flat: "border-outline bg-surface shadow-none hover:border-purple focus:border-purple active:border-purple",
  ghost:
    "border-transparent bg-transparent shadow-none hover:border-transparent focus:border-purple active:border-purple",
};

export function getInputClassName(variant: InputVariant = "default", className?: string): string {
  return [baseClassName, variantClassName[variant], className ?? ""].filter(Boolean).join(" ");
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = "default", className, ...props }, ref) => (
    <input {...props} ref={ref} className={getInputClassName(variant, className)} />
  ),
);

Input.displayName = "Input";

export default Input;

/** Native form controls share Input's theme, focus, and sizing rules. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select {...props} ref={ref} className={getInputClassName("default", className)} />
  ),
);
Select.displayName = "Select";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea {...props} ref={ref} className={getInputClassName("default", className)} />
));
Textarea.displayName = "Textarea";

type NativeChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = forwardRef<HTMLInputElement, NativeChoiceProps>(
  ({ className = "", ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      className={`h-4 w-4 shrink-0 accent-purple focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
  ),
);
Checkbox.displayName = "Checkbox";

/** Pair with ButtonLabel so keyboard focus is visible on the upload action. */
export const FileInput = forwardRef<HTMLInputElement, NativeChoiceProps>(
  ({ className = "", ...props }, ref) => (
    <input {...props} ref={ref} type="file" className={`sr-only ${className}`} />
  ),
);
FileInput.displayName = "FileInput";
