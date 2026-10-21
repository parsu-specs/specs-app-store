import { Button } from "./Button";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, X } from "@phosphor-icons/react";
import Avatar from "./Avatar";
import { getAppRepo } from "../data/factory";
import type { Profile } from "../data/types";

type VotersDialogProps = {
  appId: string;
  appTitle: string;
  totalVotes: number;
  onOpenProfile: (profileId: string) => void;
};

/**
 * Upvote count trigger and dialog with one profile button per voter.
 * The list is fetched lazily on open so cards stay cheap.
 */
export default function VotersDialog({
  appId,
  appTitle,
  totalVotes,
  onOpenProfile,
}: VotersDialogProps) {
  const [open, setOpen] = useState(false);
  const [voters, setVoters] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAppRepo()
      .listVoters(appId)
      .then((list) => {
        if (!cancelled) setVoters(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load voters.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, appId, attempt]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const goProfile = (profileId: string) => {
    setOpen(false);
    onOpenProfile(profileId);
  };

  return (
    <>
      <Button
        variant="text"
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={
          totalVotes === 1
            ? "See who upvoted (1 upvote)"
            : `See who upvoted (${totalVotes} upvotes)`
        }
        className="text-sm"
      >
        {totalVotes} upvotes
      </Button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Voters for ${appTitle}`}
            onClick={() => setOpen(false)}
            className="min-w-0 fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-inverse/80 p-4 max-w-full"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 toon-card my-auto flex max-h-[85vh] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-lg bg-surface *:min-w-0"
            >
              <div className="min-w-0 flex shrink-0 items-center justify-between gap-3 border-b-[3px] border-outline p-4 *:min-w-0 max-w-full">
                <h4 className="flex min-w-0 items-center gap-2 truncate text-lg font-black *:min-w-0 max-w-full">
                  <Heart size={20} weight="duotone" aria-hidden="true" />
                  <span className="truncate">
                    Upvoted by{voters !== null && ` (${voters.length})`}
                  </span>
                </h4>
                <Button
                  variant="icon"
                  size="small"
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close voters"
                  autoFocus
                  className=""
                >
                  <X size={16} weight="bold" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                {loading ? (
                  <p className="text-sm font-bold text-muted">Loading voters…</p>
                ) : error ? (
                  <div className="text-center">
                    <p role="alert" className="text-sm font-bold">
                      {error}
                    </p>
                    <Button
                      variant="text"
                      type="button"
                      onClick={() => setAttempt((n) => n + 1)}
                      className="mt-3 text-sm font-black"
                    >
                      Try again
                    </Button>
                  </div>
                ) : voters !== null && voters.length > 0 ? (
                  <>
                    <ul className="space-y-1">
                      {voters.map((v) => (
                        <li key={v.id}>
                          <Button
                            variant="plain"
                            type="button"
                            onClick={() => goProfile(v.id)}
                            aria-label={`View ${v.name}'s profile`}
                            className="flex items-center w-full justify-start gap-3 rounded-xl border-2 border-transparent p-2 text-left transition-colors group hover:border-outline hover:bg-background focus-visible:border-outline focus-visible:bg-background"
                          >
                            <Avatar name={v.name} color={v.color} imageUrl={v.imageUrl} size="sm" />
                            <span className="min-w-0 flex-1 truncate text-sm font-black group-hover:text-primary transition-colors">
                              {v.name}
                            </span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                    {totalVotes > voters.length && (
                      <p className="mt-3 text-center text-xs font-bold text-muted">
                        {totalVotes} total upvotes · {voters.length} voter
                        {voters.length === 1 ? "" : "s"} shown (older upvotes predate voter
                        tracking).
                      </p>
                    )}
                  </>
                ) : totalVotes > 0 ? (
                  <p className="text-center text-sm font-bold text-muted">
                    {totalVotes} upvote{totalVotes === 1 ? "" : "s"}, but voter names aren&apos;t
                    available for older upvotes.
                  </p>
                ) : (
                  <p className="text-center text-sm font-bold text-muted">
                    No upvotes yet. Be the first to vote.
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
