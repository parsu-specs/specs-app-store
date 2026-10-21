export function initializePinchZoom(): void {
  document.documentElement.dataset.pinchZoom = "disabled";

  // Trackpad pinch emits a synthetic Ctrl+wheel. A physical Control key
  // distinguishes ordinary Ctrl+mouse-wheel page zoom, which stays available.
  let controlPressed = false;
  window.addEventListener("keydown", (event) => {
    controlPressed = event.ctrlKey;
  });
  window.addEventListener("keyup", (event) => {
    controlPressed = event.ctrlKey;
  });
  window.addEventListener("blur", () => {
    controlPressed = false;
  });
  document.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey && !controlPressed) event.preventDefault();
    },
    { passive: false },
  );

  // Safari exposes native pinch gestures separately from wheel events.
  const preventGesture = (event: Event) => {
    event.preventDefault();
  };
  document.addEventListener("gesturestart", preventGesture, { passive: false });
  document.addEventListener("gesturechange", preventGesture, { passive: false });
}
