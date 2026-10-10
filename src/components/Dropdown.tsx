import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check } from "@phosphor-icons/react";

export type DropdownOption = {
  value: string;
  label: string;
};

/**
 * Single-select dropdown in the toon visual language. Native <select>
 * popups are drawn by the OS/browser and can't be styled, so this renders
 * its own listbox. The popup goes through a portal positioned from the
 * button's measurements: ancestor clip-paths (paper-note cards), overflow,
 * and transforms can't slice it off. Backdrop-click and Escape close,
 * arrows move, Enter picks, and the selected row shows a check.
 */
export default function Dropdown({
  options,
  value,
  onChange,
  label,
  placeholder = "Select…",
}: {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  /** Screen-reader label for the control. */
  label: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [panel, setPanel] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value) ?? null;

  const close = () => {
    setOpen(false);
    setPanel(null);
  };

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    // Prefer below; flip above when space is tight. Clamp into the viewport
    // so small phone screens always show a tappable list.
    const below = window.innerHeight - rect.bottom - 16;
    const openUp = below < 180;
    const maxHeight = Math.max(120, Math.min(208, openUp ? rect.top - 16 : below));
    setPanel(
      openUp
        ? { bottom: window.innerHeight - rect.top + 8, left: rect.left, width: rect.width, maxHeight }
        : { top: rect.bottom + 8, left: rect.left, width: rect.width, maxHeight },
    );
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // Measured coordinates go stale on scroll/resize — close instead of
    // floating detached.
    const onShift = () => close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onShift, true);
    window.addEventListener("resize", onShift);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onShift, true);
      window.removeEventListener("resize", onShift);
    };
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    close();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        const clamped = Math.min(Math.max(next, 0), options.length - 1);
        document
          .getElementById(`dropdown-option-${clamped}`)
          ?.scrollIntoView({ block: "nearest" });
        return clamped;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = options[activeIndex];
      if (option) pick(option.value);
    }
  };

  return (
    <div>
      <span className="sr-only" id="dropdown-label">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        aria-labelledby="dropdown-label"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        className="flex w-full cursor-pointer items-center gap-2 rounded-2xl border-[3px] border-ink bg-surface px-4 py-2 text-left text-sm font-black transition-[border-color] duration-150 hover:border-purple focus:border-purple focus:outline-none"
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
        <CaretDown
          size={18}
          weight="bold"
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open &&
        panel &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close options"
              onClick={close}
              className="fixed inset-0 z-40 cursor-default bg-transparent"
            />
            <ul
              role="listbox"
              aria-labelledby="dropdown-label"
              onKeyDown={onListKey}
              style={{
                top: panel.top,
                bottom: panel.bottom,
                left: panel.left,
                width: panel.width,
                maxHeight: panel.maxHeight,
              }}
              className="toon-card fixed z-50 overflow-y-auto rounded-xl bg-surface p-1.5"
            >
              {options.map((option, i) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value || "__none"} role="presentation">
                    <button
                      id={`dropdown-option-${i}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => pick(option.value)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-black ${
                        i === activeIndex ? "bg-cream" : ""
                      } ${isSelected ? "text-purple" : "text-ink"} hover:bg-cream`}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {isSelected && <Check size={16} weight="bold" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>,
          document.body,
        )}
    </div>
  );
}
