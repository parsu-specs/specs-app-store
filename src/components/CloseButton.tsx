import { forwardRef, type ButtonHTMLAttributes } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "./Button";

type CloseButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  "aria-label": string;
};

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(function CloseButton(
  { className, ...props },
  ref,
) {
  return (
    <Button
      {...props}
      ref={ref}
      variant="icon"
      size="small"
      className={`h-11 w-11 shrink-0 text-foreground ${className ?? ""}`}
    >
      <X size={20} weight="bold" aria-hidden="true" />
    </Button>
  );
});
