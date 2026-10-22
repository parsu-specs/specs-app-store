import { useEffect, useId, useState, type ComponentProps } from "react";
import { Check, CircleNotch, X } from "@phosphor-icons/react";
import Input from "./Input";
import { getProfileRepo } from "../data/factory";

export type DisplayNameStatus = "idle" | "checking" | "available" | "taken" | "error";

type Props = Omit<ComponentProps<typeof Input>, "value"> & {
  value: string;
  profileId: string;
  currentName: string;
  /** Reports availability changes so forms can block submit on "taken". */
  onStatusChange?: (status: DisplayNameStatus) => void;
};

export default function DisplayNameInput({
  value,
  profileId,
  currentName,
  onStatusChange,
  ...props
}: Props) {
  const statusId = useId();
  const name = value.trim();
  const [result, setResult] = useState<{
    name: string;
    status: "available" | "taken" | "error";
  } | null>(null);
  const unchanged = name.toLowerCase() === currentName.trim().toLowerCase();
  const valid = !!name && name.length <= 40;
  const status = !valid
    ? "idle"
    : unchanged
      ? "available"
      : result?.name === name
        ? result.status
        : "checking";

  useEffect(() => {
    if (!valid || unchanged) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const existing = await getProfileRepo().getProfileByName(name);
        if (!cancelled)
          setResult({
            name,
            status: existing && existing.id !== profileId ? "taken" : "available",
          });
      } catch {
        if (!cancelled) setResult({ name, status: "error" });
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [name, profileId, valid, unchanged]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const message =
    status === "taken"
      ? "That display name is already taken."
      : status === "available"
        ? "Display name available."
        : status === "checking"
          ? "Checking display name…"
          : status === "error"
            ? "Could not check availability. Try saving again."
            : "";
  return (
    <span className="block">
      <span className="relative block">
        <Input
          {...props}
          value={value}
          className={`pr-12 ${props.className ?? ""}`}
          aria-invalid={status === "taken" || undefined}
          aria-describedby={statusId}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-4 flex items-center"
        >
          {status === "available" && <Check size={22} weight="bold" className="text-green-600" />}
          {status === "taken" && <X size={22} weight="bold" className="text-red-600" />}
          {status === "checking" && <CircleNotch size={22} className="animate-spin text-muted" />}
        </span>
      </span>
      <span
        id={statusId}
        role="status"
        className={
          status === "taken" || status === "error" ? "mt-2 block text-sm font-bold" : "sr-only"
        }
      >
        {message}
      </span>
    </span>
  );
}
