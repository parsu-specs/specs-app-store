import { CaretDown } from "@phosphor-icons/react";
import { Select } from "./Input";

export type DropdownOption = { value: string; label: string };

/** Native popup placement avoids layout measurements and ancestor clipping. */
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
  label: string;
  placeholder?: string;
}) {
  const hasValue = options.some((option) => option.value === value);
  return (
    <div className="relative min-w-0 w-full max-w-full">
      <Select
        aria-label={label}
        value={hasValue ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none cursor-pointer truncate py-2 pr-10 text-sm font-black"
      >
        {!hasValue && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <CaretDown
        size={18}
        weight="bold"
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
