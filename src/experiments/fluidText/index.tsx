import { useSyncExternalStore } from "react";
import SettingToggle from "../../components/SettingToggle";
import "./fluidText.css";

const STORAGE_KEY = "cc.experimental.fluid-text.v1";
const CHANGE_EVENT = "cc:fluid-text-change";
let enabled = false;

function apply(value: boolean) {
  enabled = value;
  if (value) document.documentElement.dataset.fluidText = "enabled";
  else delete document.documentElement.dataset.fluidText;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function restore() {
  try {
    apply(localStorage.getItem(STORAGE_KEY) === "true");
  } catch {
    // Retain the current page's choice when browser storage is unavailable.
  }
}

export function initializeFluidText() {
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
    // The toggle still works for this page without persistent storage.
  }
  apply(value);
}

export default function FluidTextControl() {
  const checked = useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  );

  const supported = CSS.supports(
    "font-size",
    "calc(1rem + 0.125rem * progress(100vw, 20rem, 90rem))",
  );

  return (
    <SettingToggle
      label="Fluid text"
      description={
        <>
          Automatically scale text as your window gets wider. Some text might be clipped.
          {!supported &&
            " Your browser does not support this experiment yet; text will keep its usual size."}
        </>
      }
      checked={checked}
      onCheckedChange={setEnabled}
    />
  );
}
