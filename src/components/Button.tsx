import { forwardRef } from "react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  HTMLAttributes,
} from "react";

export type ButtonVariant =
  | "icon"
  | "menu"
  | "plain"
  | "primary"
  | "secondary"
  | "surface"
  | "danger"
  | "outline"
  | "outline-flat"
  | "ghost"
  | "filter"
  | "vote"
  | "text";

type ButtonSize = "default" | "small" | "compact" | "compact-icon";

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
  fullHeight?: boolean;
  children?: ReactNode;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps;

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonStyleProps & {
    href: string;
  };

type ButtonLabelProps = LabelHTMLAttributes<HTMLLabelElement> & ButtonStyleProps;
type ButtonChipProps = HTMLAttributes<HTMLSpanElement> &
  Pick<ButtonStyleProps, "className" | "children"> & {
    tone?: "default" | "gold" | "silver" | "bronze" | "muted";
  };

const commonClasses =
  "inline-flex min-w-0 max-w-full whitespace-normal wrap-anywhere items-center justify-center gap-2 [&>svg]:shrink-0 font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow focus-visible:ring-offset-2";

const variantClasses: Record<ButtonVariant, string> = {
  icon: "shrink-0 rounded-full border-2 border-outline bg-surface transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60",
  menu: "w-full justify-start rounded-lg px-3 py-2 text-left text-sm hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60",
  plain:
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  primary: "rounded-2xl border-[3px] border-outline bg-purple text-surface",
  secondary: "rounded-2xl border-[3px] border-outline bg-yellow text-ink",
  surface: "rounded-2xl border-[3px] border-outline bg-surface text-inherit",
  danger: "rounded-2xl border-[3px] border-outline bg-alert text-surface",
  outline:
    "rounded-lg border-2 border-outline bg-transparent px-3 py-2 text-ink transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60",
  "outline-flat":
    "min-w-0 max-w-full rounded-md border-2 border-outline bg-transparent text-ink transition-colors aria-pressed:bg-purple aria-pressed:text-surface aria-pressed:hover:bg-purple hover:bg-yellow disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "text-sm decoration-2 transition-colors hover:text-purple disabled:cursor-not-allowed disabled:opacity-60",
  filter:
    "min-w-0 max-w-full rounded-md border-2 border-outline bg-transparent text-ink transition-colors aria-pressed:bg-purple aria-pressed:text-surface aria-pressed:hover:bg-purple aria-selected:bg-purple aria-selected:text-surface aria-selected:hover:bg-purple hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60",
  vote: "gap-1 transition-colors hover:text-purple aria-pressed:text-vote aria-pressed:hover:text-vote disabled:cursor-not-allowed disabled:opacity-60",
  text: "inline border-0 bg-transparent p-0 font-inherit text-inherit transition-colors hover:text-purple disabled:cursor-not-allowed disabled:opacity-60",
};

const raisedShellClasses = [
  "group",
  "relative",
  "isolate",
  "min-w-0",
  "max-w-full",
  "inline-flex",
  "cursor-pointer",
  "border-0",
  "bg-transparent",
  "p-0",
  "pb-2",
  "pr-2",
  "text-left",
  "rounded-2xl",

  "focus-visible:outline-none",
  "focus-visible:ring-4",
  "focus-visible:ring-yellow",
  "focus-visible:ring-offset-2",

  "disabled:cursor-not-allowed",
].join(" ");

const raisedSideClasses = [
  "absolute",
  "z-0",

  "right-0",
  "bottom-0",

  "top-1",
  "left-1",

  "rounded-[20px]",
  "border-[3px]",
  "border-outline",
  "bg-ink",

  "transition-[top,left,border-radius]",
  "duration-100",
  "ease-out",

  "group-hover:top-0",
  "group-hover:left-0",
  "group-hover:rounded-tr-3xl",
  "group-hover:rounded-bl-3xl",

  "group-active:top-2",
  "group-active:left-2",

  "group-disabled:top-2",
  "group-disabled:left-2",
].join(" ");

const raisedFaceClasses = [
  "min-w-0",
  "max-w-full",
  "whitespace-normal",
  "wrap-anywhere",
  "[&>svg]:shrink-0",
  "relative",
  "z-10",
  "inline-flex",
  "w-full",
  "items-center",
  "justify-center",
  "gap-2",
  "rounded-2xl",
  "border-[3px]",
  "border-outline",
  "font-black",

  "translate-x-1",
  "translate-y-1",

  "transition-[transform,translate,filter]",
  "duration-100",
  "ease-out",

  "group-hover:translate-x-0",
  "group-hover:translate-y-0",

  "group-active:translate-x-2",
  "group-active:translate-y-2",
  "group-active:brightness-90",

  "group-disabled:translate-x-2",
  "group-disabled:translate-y-2",
  "group-disabled:brightness-100",
].join(" ");

const raisedVariants = new Set<ButtonVariant>(["primary", "secondary", "surface", "danger"]);

const sizeClasses: Record<ButtonSize, string> = {
  default: "px-5 py-3",
  small: "px-4 py-2 text-sm",
  compact: "px-3 py-1 text-xs",
  "compact-icon": "p-1 text-xs",
};

const filterSizeClasses: Record<ButtonSize, string> = {
  default: "px-3 py-2 text-sm",
  small: "px-3 py-1.5 text-sm",
  compact: "px-2 py-1 text-xs",
  "compact-icon": "p-1 text-xs",
};

function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className: string | undefined,
  fullWidth: boolean,
  fullHeight: boolean,
) {
  if (variant === "plain") {
    return [
      "min-w-0 max-w-full wrap-anywhere",
      variantClasses.plain,
      fullWidth ? "w-full" : "",
      fullHeight ? "h-full" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");
  }
  if (raisedVariants.has(variant)) {
    return [
      raisedShellClasses,
      fullWidth ? "w-full" : "",
      fullHeight ? "h-full" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  const sizeClass =
    variant === "icon"
      ? ({ default: "p-2", small: "p-1.5", compact: "p-1", "compact-icon": "p-0.5" } as const)[size]
      : variant === "filter" || variant === "outline-flat"
        ? filterSizeClasses[size]
        : variant === "vote"
          ? size === "compact"
            ? "text-xs"
            : "text-sm"
          : "";

  return [
    variant === "text" ? commonClasses.replace("inline-flex", "inline") : commonClasses,
    variantClasses[variant],
    sizeClass,
    fullWidth ? "w-full" : "",
    fullHeight ? "h-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buttonFaceClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  fullHeight: boolean,
) {
  return [
    raisedFaceClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    fullHeight ? "h-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buttonContents(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  fullHeight: boolean,
  children: ReactNode,
) {
  if (!raisedVariants.has(variant)) {
    return children;
  }

  return (
    <>
      <span className={raisedSideClasses} aria-hidden="true" />

      <span className={buttonFaceClassName(variant, size, fullWidth, fullHeight)}>{children}</span>
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "default",
    className,
    fullWidth = false,
    fullHeight = false,
    children,
    type = "button",
    ...props
  }: ButtonProps,
  ref,
) {
  const clickableClass = props.onClick && !props.disabled ? "cursor-pointer" : "";

  return (
    <button
      ref={ref}
      {...props}
      type={type}
      className={buttonClassName(
        variant,
        size,
        [className, clickableClass].filter(Boolean).join(" "),
        fullWidth,
        fullHeight,
      )}
    >
      {buttonContents(variant, size, fullWidth, fullHeight, children)}
    </button>
  );
});

export function ButtonLink({
  variant = "primary",
  size = "default",
  className,
  fullWidth = false,
  fullHeight = false,
  children,
  href,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      {...props}
      href={href}
      className={buttonClassName(variant, size, className, fullWidth, fullHeight)}
    >
      {buttonContents(variant, size, fullWidth, fullHeight, children)}
    </a>
  );
}

export function ButtonLabel({
  variant = "primary",
  size = "default",
  className,
  fullWidth = false,
  fullHeight = false,
  children,
  ...props
}: ButtonLabelProps) {
  return (
    <label
      {...props}
      className={buttonClassName(
        variant,
        size,
        `focus-within:ring-4 focus-within:ring-yellow focus-within:ring-offset-2 ${className ?? ""}`,
        fullWidth,
        fullHeight,
      )}
    >
      {buttonContents(variant, size, fullWidth, fullHeight, children)}
    </label>
  );
}

const chipToneClasses = {
  default: "bg-lavender text-ink",
  gold: "bg-yellow text-ink",
  silver: "bg-medal-silver text-ink",
  bronze: "bg-medal-bronze text-surface",
  muted: "bg-muted text-surface",
} satisfies Record<NonNullable<ButtonChipProps["tone"]>, string>;

export function ButtonChip({ className, children, tone = "default", ...props }: ButtonChipProps) {
  return (
    <span
      {...props}
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 align-middle text-[10px] font-black uppercase",
        chipToneClasses[tone],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
