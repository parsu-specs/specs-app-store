import { Textarea, type TextareaProps } from "./Input";

type MarkdownTextareaProps = Omit<TextareaProps, "sizing"> & {
  value: string;
};

export default function MarkdownTextarea({
  className = "",
  value,
  style,
  ...props
}: MarkdownTextareaProps) {
  return (
    <Textarea
      {...props}
      rows={3}
      sizing="content"
      value={value}
      style={{
        ...style,
        // Keep three text lines available, excluding the field's padding and border.
        minHeight: props.children != null ? "3lh" : "calc(3lh + 1.5rem + 6px)",
      }}
      className={`scrollbar-minimal [scrollbar-gutter:stable] [overflow-wrap:anywhere] ${className}`}
    />
  );
}
