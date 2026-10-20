import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import { Textarea } from "./Input";

type MarkdownTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
};

function resizeFallback(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  const borderHeight = textarea.offsetHeight - textarea.clientHeight;
  textarea.style.height = `${textarea.scrollHeight + borderHeight}px`;
}

export default function MarkdownTextarea({
  className = "",
  value,
  ...props
}: MarkdownTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    // Supporting browsers size the field in normal layout, without measuring
    // after each keystroke. Keep autosizing for older browsers.
    if (!textarea || CSS.supports("field-sizing", "content")) return;
    resizeFallback(textarea);
  }, [value]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || CSS.supports("field-sizing", "content")) return;
    let previousWidth = -1;
    const observer = new ResizeObserver(([entry]) => {
      // Height writes also notify the observer; only remeasure for width changes.
      if (!entry || entry.contentRect.width === previousWidth) return;
      previousWidth = entry.contentRect.width;
      resizeFallback(textarea);
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, []);

  return (
    <Textarea
      {...props}
      ref={textareaRef}
      value={value}
      className={`min-h-24 max-h-[min(60vh,32rem)] supports-[height:100dvh]:max-h-[min(60dvh,32rem)] [field-sizing:content] resize-none overflow-y-auto [scrollbar-color:var(--color-yellow)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-surface [&::-webkit-scrollbar-thumb]:bg-yellow ${className}`}
    />
  );
}
