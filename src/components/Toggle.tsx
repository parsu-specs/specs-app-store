import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Button } from "./Button";

type ToggleProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "onClick" | "role" | "aria-checked" | "aria-pressed" | "type"
> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/** A sliding switch using the shared border, shadow, and theme colors. */
const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { checked, onCheckedChange, children, className = "", ...props },
  ref,
) {
  return (
    <Button
      {...props}
      ref={ref}
      type="button"
      variant="plain"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-11 w-18 shrink-0 items-center rounded-full border-[3px] border-outline p-1 shadow-[3px_3px_0_var(--color-outline)] transition-[background-color,box-shadow,translate] duration-150 hover:-translate-y-px hover:shadow-[4px_4px_0_var(--color-outline)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-outline)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${checked ? "bg-primary" : "bg-divider"} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`grid size-7.5 shrink-0 place-items-center rounded-full border-2 border-outline bg-surface text-foreground transition-transform duration-150 motion-reduce:transition-none ${checked ? "translate-x-7" : "translate-x-0"}`}
      >
        {children}
      </span>
    </Button>
  );
});

export default Toggle;
