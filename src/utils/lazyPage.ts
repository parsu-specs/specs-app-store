import { lazy, type ComponentType } from "react";

export class PageLoadError extends Error {
  constructor(cause: unknown) {
    super("Could not download this page. Refresh the page to try again.", { cause });
    this.name = "PageLoadError";
  }
}

/** Failed imports stay cached by React; recovery requires a new document. */
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((cause: unknown) => {
      throw new PageLoadError(cause);
    }),
  );
}
