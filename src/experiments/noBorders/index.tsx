import { useSyncExternalStore } from "react";
import SettingToggle from "../../components/SettingToggle";
import "./noBorders.css";

const STORAGE_KEY = "cc.experimental.no-borders.v1";
const CHANGE_EVENT = "cc:no-borders-change";
let enabled = false;

function apply(value: boolean) {
  enabled = value;
  if (value) document.documentElement.dataset.noBorders = "enabled";
  else delete document.documentElement.dataset.noBorders;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function restore() {
  try {
    apply(localStorage.getItem(STORAGE_KEY) === "true");
  } catch {
    // Keep the current page's choice when storage is unavailable.
  }
}

export function initializeNoBorders() {
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

export default function NoBordersControl() {
  const checked = useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  );

  return (
    <SettingToggle
      label="No borders"
      description={<>Hide borders throughout the website while keeping shadows.</>}
      checked={checked}
      onCheckedChange={setEnabled}
    />
  );
}
