import { useLayoutEffect, useRef } from "react";
import { Textarea, type TextareaProps } from "./Input";

type MarkdownTextareaProps = Omit<TextareaProps, "sizing"> & {
  value: string;
};

export default function MarkdownTextarea({
  className = "",
  value,
  ...props
}: MarkdownTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef(() => {});

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // Measure a separate field so shrinking never collapses the live editor or
    // moves the modal's scroll position while the user is typing.
    const mirror = textarea.cloneNode() as HTMLTextAreaElement;
    mirror.removeAttribute("id");
    mirror.removeAttribute("name");
    mirror.removeAttribute("required");
    mirror.setAttribute("aria-hidden", "true");
    mirror.tabIndex = -1;
    mirror.inert = true;
    Object.assign(mirror.style, {
      position: "fixed",
      top: "0",
      left: "0",
      visibility: "hidden",
      pointerEvents: "none",
      height: "0",
      minHeight: "0",
      maxHeight: "none",
      overflow: "hidden",
      boxSizing: "border-box",
    });
    document.body.appendChild(mirror);

    const measure = () => {
      if (!textarea.getClientRects().length || textarea.offsetWidth === 0) return;
      const computed = getComputedStyle(textarea);
      for (const property of [
        "font-family",
        "font-size",
        "font-weight",
        "font-style",
        "line-height",
        "letter-spacing",
        "word-spacing",
        "text-indent",
        "text-transform",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "border-top-width",
        "border-bottom-width",
        "border-left-width",
        "border-right-width",
        "white-space",
        "overflow-wrap",
        "word-break",
        "tab-size",
        "scrollbar-gutter",
      ]) {
        mirror.style.setProperty(property, computed.getPropertyValue(property));
      }
      mirror.style.width = `${textarea.offsetWidth}px`;
      mirror.value = textarea.value || textarea.placeholder;
      const border = parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth);
      const height = `${Math.ceil(mirror.scrollHeight + border)}px`;
      if (textarea.style.height !== height) textarea.style.height = height;
    };
    measureRef.current = measure;
    let lastWidth = -1;
    const observer = new ResizeObserver(() => {
      if (textarea.offsetWidth === lastWidth) return;
      lastWidth = textarea.offsetWidth;
      measure();
    });
    observer.observe(textarea);
    window.addEventListener("resize", measure);
    let active = true;
    document.fonts.ready.then(() => {
      if (active) measure();
    });
    measure();
    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("resize", measure);
      mirror.remove();
      measureRef.current = () => {};
    };
  }, []);

  useLayoutEffect(() => {
    measureRef.current();
  }, [value, className, props.placeholder]);

  return (
    <Textarea
      {...props}
      ref={textareaRef}
      sizing="fixed"
      value={value}
      className={`scrollbar-minimal [scrollbar-gutter:stable] [overflow-wrap:anywhere] ${className}`}
    />
  );
}
