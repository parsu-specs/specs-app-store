import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./Popover.css";

type PopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
  autoFlip?: boolean;
};

export default function Popover({
  open,
  onOpenChange,
  trigger,
  id,
  label,
  children,
  className = "",
  autoFlip = false,
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 0 });
  const useAnchor =
    autoFlip &&
    typeof CSS !== "undefined" &&
    CSS.supports("anchor-name", "--popover") &&
    CSS.supports("position-try-fallbacks", "flip-block");
  const anchorStyle = {
    "--popover-anchor": `--popover-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
  } as CSSProperties;

  useLayoutEffect(() => {
    if (!open || useAnchor) return;
    const positionPanel = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const below = window.innerHeight - anchor.bottom - 24;
      const above = anchor.top - 24;
      const flip = autoFlip && panel.scrollHeight > below && above > below;
      const maxHeight = Math.max(
        0,
        Math.min(window.innerHeight * 0.7, autoFlip ? (flip ? above : below) : below),
      );
      const top = flip
        ? Math.max(16, anchor.top - Math.min(panel.scrollHeight, maxHeight) - 8)
        : anchor.bottom + 8;
      setPosition({
        top,
        left: Math.max(
          16,
          Math.min(anchor.right - panel.offsetWidth, window.innerWidth - panel.offsetWidth - 16),
        ),
        maxHeight,
      });
    };
    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open, autoFlip, useAnchor]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel?.contains(document.activeElement)) {
      (panel?.querySelector<HTMLElement>("button, a[href]") ?? panel)?.focus();
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        onOpenChange(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        triggerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div
      ref={triggerRef}
      style={useAnchor ? anchorStyle : undefined}
      data-popover-anchor={useAnchor ? "" : undefined}
      className="relative min-w-0 shrink-0"
    >
      {trigger}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            data-popover-portal=""
            data-popover-auto-flip={useAnchor ? "" : undefined}
            id={id}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            style={useAnchor ? anchorStyle : position}
            className={`toon-card fixed z-110 flex min-w-0 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-2xl bg-surface text-foreground ${className}`}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
