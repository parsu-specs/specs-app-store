import { useSyncExternalStore } from "react";
import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { Button } from "./Button";
import { appearanceSnapshot, setAppearance, subscribeAppearance } from "../utils/appearance";

const modes = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Desktop },
] as const;

export default function AppearanceControl({ compact = false }: { compact?: boolean }) {
  const snapshot = useSyncExternalStore(
    subscribeAppearance,
    appearanceSnapshot,
    () => "system:light",
  );
  const [appearance, resolved] = snapshot.split(":");

  if (compact) {
    const dark = resolved === "dark";
    return (
      <Button
        variant="surface"
        size="compact-icon"
        onClick={() => setAppearance(dark ? "light" : "dark")}
        aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
        title={`Switch to ${dark ? "light" : "dark"} mode`}
        className="relative text-foreground"
      >
        {dark ? (
          <Sun size={20} weight="duotone" aria-hidden="true" />
        ) : (
          <Moon size={20} weight="duotone" aria-hidden="true" />
        )}
      </Button>
    );
  }

  return (
    <div role="group" aria-label="Appearance" className="mt-4 flex flex-wrap gap-3">
      {modes.map(({ id, label, Icon }) => (
        <Button
          key={id}
          variant="filter"
          size="small"
          aria-pressed={appearance === id}
          onClick={() => setAppearance(id)}
        >
          <Icon size={20} weight="duotone" aria-hidden="true" />
          {label}
        </Button>
      ))}
    </div>
  );
}
