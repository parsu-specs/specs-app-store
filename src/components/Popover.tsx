import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type PopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
};

export default function Popover({
  open,
  onOpenChange,
  trigger,
  id,
  label,
  children,
  className = "",
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 0 });

  useLayoutEffect(() => {
    if (!open) return;
    const positionPanel = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const top = anchor.bottom + 8;
      setPosition({
        top,
        left: Math.max(
          16,
          Math.min(anchor.right - panel.offsetWidth, window.innerWidth - panel.offsetWidth - 16),
        ),
        maxHeight: Math.max(0, Math.min(window.innerHeight * 0.7, window.innerHeight - top - 16)),
      });
    };
    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open]);

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
    <div ref={triggerRef} className="relative min-w-0 shrink-0">
      {trigger}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            data-popover-portal=""
            id={id}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            style={position}
            className={`toon-card fixed z-110 flex min-w-0 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-xl bg-surface text-foreground ${className}`}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
