import { useSyncExternalStore } from "react";
import SettingToggle from "../../components/SettingToggle";
import "./boldText.css";

const STORAGE_KEY = "cc.experimental.bold-text.v1";
const CHANGE_EVENT = "cc:bold-text-change";
let enabled = false;

function apply(value: boolean) {
  enabled = value;
  if (value) document.documentElement.dataset.boldText = "enabled";
  else delete document.documentElement.dataset.boldText;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function restore() {
  try {
    apply(localStorage.getItem(STORAGE_KEY) === "true");
  } catch {
    // Keep the current page's choice when storage is unavailable.
  }
}

export function initializeBoldText() {
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

export default function BoldTextControl() {
  const checked = useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  );

  return (
    <SettingToggle
      label="Bold text"
      description={<>Make text heavier throughout the website.</>}
      checked={checked}
      onCheckedChange={setEnabled}
    />
  );
}
