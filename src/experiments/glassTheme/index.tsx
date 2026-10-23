import { useSyncExternalStore } from "react";
import SettingToggle from "../../components/SettingToggle";
import "./glassTheme.css";

const STORAGE_KEY = "cc.experimental.glass-theme.v1";
const CHANGE_EVENT = "cc:glass-theme-change";
let enabled = false;

function apply(value: boolean) {
  enabled = value;
  if (value) document.documentElement.dataset.glassTheme = "enabled";
  else delete document.documentElement.dataset.glassTheme;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function restore() {
  try {
    apply(localStorage.getItem(STORAGE_KEY) === "true");
  } catch {
    // Keep the current page's choice when storage is unavailable.
  }
}

export function initializeGlassTheme() {
  restore();
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) restore();
  });
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function setEnabled(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Apply the choice for this page even without persistent storage.
  }
  apply(value);
}

export default function GlassThemeControl() {
  const checked = useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  );

  return (
    <SettingToggle
      label="Glass theme"
      description={<>Give cards, navigation, and modals a translucent frosted glass finish.</>}
      checked={checked}
      onCheckedChange={setEnabled}
    />
  );
}
