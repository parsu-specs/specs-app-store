import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

type TurnstileWindow = Window & { turnstile?: TurnstileApi };

/**
 * Cloudflare Turnstile widget (explicit render). Parent remounts via `key`
 * after every submit because tokens are single-use. Callbacks ride a ref so
 * parent re-renders (every keystroke) never thrash the widget. Renders
 * nothing but the box — the parent owns all messaging.
 */
export default function Turnstile({
  siteKey,
  onToken,
  onUnavailable,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  onUnavailable: (message: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onToken, onUnavailable });
  handlers.current = { onToken, onUnavailable };

  useEffect(() => {
    let cancelled = false;
    let widgetId: string | null = null;
    const win = window as TurnstileWindow;
    const fail = () => {
      if (!cancelled) {
        handlers.current.onUnavailable(
          "Human check failed to load. Check your connection and reload the page.",
        );
      }
    };
    const renderWidget = () => {
      if (cancelled || !boxRef.current || !win.turnstile) return;
      try {
        widgetId = win.turnstile.render(boxRef.current, {
          sitekey: siteKey,
          callback: (token: string) => handlers.current.onToken(token),
          "expired-callback": () => handlers.current.onToken(null),
          "error-callback": () => handlers.current.onToken(null),
        });
      } catch {
        fail();
      }
    };
    if (win.turnstile) {
      renderWidget();
    } else {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => renderWidget();
      script.onerror = () => fail();
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
      if (widgetId && (window as TurnstileWindow).turnstile) {
        try {
          (window as TurnstileWindow).turnstile?.remove(widgetId);
        } catch {
          // Already gone.
        }
      }
    };
  }, [siteKey]);

  return (
    <div className="min-w-0 flex justify-center [&>*]:min-w-0 max-w-full">
      <div ref={boxRef} />
    </div>
  );
}
