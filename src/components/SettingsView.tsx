import { useEffect, useState } from "react";
import {
  ArrowCounterClockwise,
  Eye,
  EyeSlash,
  LockKey,
  Palette,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { Button } from "./Button";
import Input from "./Input";
import { isSoundsMuted, playNotificationSound, setSoundsMuted } from "../utils/sounds";
import { loadPalette, PALETTES, resolvePalette, setPalette } from "../utils/palette";
import { getAuthRepo, getProfileRepo } from "../data/factory";
import { resetLocalData } from "../data/local/localApps";
import { useAuth } from "../auth/AuthProvider";
import type { Profile } from "../data/types";

const isLocalMode =
  ((import.meta.env.VITE_DATA_SOURCE as string | undefined) ?? "local") === "local";

/**
 * Device settings. Sound mute lives here (persisted per browser).
 * The demo-data reset only applies to the localStorage backend.
 */
function PasswordForm({ mode, onSaved }: { mode: "add" | "change"; onSaved: () => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      await getAuthRepo().updatePassword(password);
      setPassword("");
      setDone(true);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-4 space-y-3">
      <p className="text-sm font-bold text-muted">
        {mode === "add"
          ? "Set a password to unlock email sign-in as well — Google keeps working."
          : "Set a new password for email sign-in."}
      </p>
      <label className="block">
        <span className="sr-only">{mode === "add" ? "Choose a password" : "New password"}</span>
        <span className="relative block">
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            minLength={6}
            placeholder="At least 6 characters"
            className="pr-12"
            required
          />
          <Button
            variant="plain"
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          >
            {show ? <EyeSlash size={21} weight="bold" /> : <Eye size={21} weight="bold" />}
          </Button>
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm font-bold">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="text-sm font-bold">
          Password saved — you can now sign in with email too.
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : mode === "add" ? "Add password" : "Save new password"}
      </Button>
    </form>
  );
}

export default function SettingsView({
  profile,
  onChanged,
  hasPassword,
  onPasswordUpdated,
}: {
  profile: Profile | null;
  onChanged: () => void;
  /** Null while the sign-in method check is loading — form hidden meanwhile. */
  hasPassword: boolean | null;
  onPasswordUpdated: () => void;
}) {
  const { user } = useAuth();
  const [muted, setMuted] = useState(() => isSoundsMuted());
  const [palette, setPaletteState] = useState(() => loadPalette());
  const [paletteError, setPaletteError] = useState<string | null>(null);
  const [paletteSaving, setPaletteSaving] = useState(false);
  const [armReset, setArmReset] = useState(false);

  // Follow the account choice when it arrives (e.g. fresh sign in on a new
  // device); otherwise keep the device choice.
  useEffect(() => {
    setPaletteState(resolvePalette(profile?.palette));
  }, [user?.id, profile?.palette]);

  const pickPalette = async (id: string) => {
    const previous = loadPalette();
    setPalette(id);
    setPaletteState(loadPalette());
    setPaletteError(null);
    if (!user) return;
    setPaletteSaving(true);
    try {
      await getProfileRepo().updateProfile(user.id, { palette: id }, user.id);
      onChanged();
    } catch (e) {
      setPalette(previous);
      setPaletteState(previous);
      setPaletteError(e instanceof Error ? e.message : "Could not save palette.");
    } finally {
      setPaletteSaving(false);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setSoundsMuted(next);
    setMuted(next);
    // Confirm unmuting audibly; muting stays silent by definition.
    if (!next) playNotificationSound();
  };

  const resetDemo = () => {
    resetLocalData();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <section className="toon-card toon-paper bg-paper rounded-lg p-6 pt-10 sm:p-8 sm:pt-12">
        <div className="min-w-0 flex items-center gap-2 [&>*]:min-w-0 max-w-full">
          <LockKey size={22} weight="duotone" aria-hidden="true" />
          <h2 className="text-2xl font-black">Sign-in & password</h2>
        </div>
        {hasPassword === null ? (
          <p className="mt-2 text-sm font-bold text-muted">Checking sign-in methods…</p>
        ) : (
          <PasswordForm mode={hasPassword ? "change" : "add"} onSaved={onPasswordUpdated} />
        )}
      </section>
      <section className="toon-card toon-paper bg-paper rounded-lg p-6 pt-10 sm:p-8 sm:pt-12">
        <div className="min-w-0 flex items-center gap-2 [&>*]:min-w-0 max-w-full">
          <Palette size={22} weight="duotone" aria-hidden="true" />
          <h2 className="text-2xl font-black">Website theme</h2>
        </div>
        <p className="mt-2 text-sm font-bold text-muted">
          Recolor the whole site to your taste. Saved to your account, so it follows you to other
          browsers.
        </p>
        {paletteError && (
          <p role="alert" className="mt-2 text-sm font-bold">
            {paletteError}
          </p>
        )}
        <div
          className="min-w-0 mt-4 grid [&>*]:min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3 max-w-full"
          role="group"
          aria-label="Website theme"
        >
          {PALETTES.map((p) => {
            const active = palette === p.id;
            return (
              <Button
                variant="plain"
                key={p.id}
                type="button"
                onClick={() => void pickPalette(p.id)}
                disabled={paletteSaving}
                aria-pressed={active}
                className={`min-w-0 flex flex-wrap items-center gap-3 rounded-xl border-[3px] p-3 text-left ${active ? "border-outline bg-yellow shadow-[3px_3px_0_var(--color-outline)]" : "border-divider bg-surface hover:bg-cream"} [&>*]:min-w-0 max-w-full`}
              >
                <span
                  className="min-w-0 flex shrink-0 -space-x-1.5 [&>*]:min-w-0 max-w-full"
                  aria-hidden="true"
                >
                  {p.swatches.map((hex) => (
                    <span
                      key={hex}
                      style={{ backgroundColor: hex }}
                      className="h-6 w-6 rounded-full border-2 border-outline"
                    />
                  ))}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">{p.label}</span>
                  <span className="block text-xs font-bold text-muted">
                    {active ? "In use" : "Tap to apply"}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </section>
      <section className="toon-card toon-paper bg-paper rounded-lg p-6 pt-10 sm:p-8 sm:pt-12">
        <div className="min-w-0 flex items-center gap-2 [&>*]:min-w-0 max-w-full">
          {muted ? (
            <SpeakerSlash size={22} weight="duotone" aria-hidden="true" />
          ) : (
            <SpeakerHigh size={22} weight="duotone" aria-hidden="true" />
          )}
          <h2 className="text-2xl font-black">Sounds</h2>
        </div>
        <p className="mt-2 text-sm font-bold text-muted">
          Chimes for upvotes and new notifications. Stored on this device only.
        </p>
        <div className="min-w-0 mt-4 flex flex-wrap items-center gap-3 [&>*]:min-w-0 max-w-full">
          <Button
            variant="plain"
            type="button"
            role="switch"
            aria-checked={!muted}
            aria-label="Sound effects"
            onClick={toggleMute}
            className={`min-w-0 flex w-16 items-center rounded-full border-[3px] border-outline p-1 ${muted ? "justify-start bg-divider" : "justify-end bg-mint"} [&>*]:min-w-0 max-w-full`}
          >
            <span
              aria-hidden="true"
              className="h-6 w-6 rounded-full border-2 border-outline bg-surface"
            />
          </Button>
          <span className="text-sm font-black">{muted ? "Muted" : "On"}</span>
          <Button
            variant="surface"
            size="small"
            type="button"
            onClick={() => playNotificationSound()}
            disabled={muted}
            title={muted ? "Unmute to preview" : "Preview the notification chime"}
            className="ml-auto"
          >
            Preview chime
          </Button>
        </div>
      </section>

      {isLocalMode && (
        <section className="toon-card toon-paper bg-paper rounded-lg p-6 pt-10 sm:p-8 sm:pt-12">
          <div className="min-w-0 flex items-center gap-2 [&>*]:min-w-0 max-w-full">
            <ArrowCounterClockwise size={22} weight="duotone" aria-hidden="true" />
            <h2 className="text-2xl font-black">Demo data</h2>
          </div>
          <p className="mt-2 text-sm font-bold text-muted">
            Clear locally stored projects, votes, feedback, and Feed posts on this browser. Your
            account stays signed in.
          </p>
          {!armReset ? (
            <Button
              variant="surface"
              size="small"
              type="button"
              onClick={() => setArmReset(true)}
              className="mt-4"
            >
              Reset demo data
            </Button>
          ) : (
            <div role="alert" className="mt-4 rounded-xl border-2 border-dashed border-divider p-3">
              <p className="text-sm font-black">Clear all local projects and activity?</p>
              <div className="min-w-0 mt-3 flex flex-wrap gap-3 [&>*]:min-w-0 max-w-full">
                <Button variant="danger" size="small" type="button" onClick={resetDemo}>
                  Yes, reset it
                </Button>
                <Button
                  variant="surface"
                  size="small"
                  type="button"
                  onClick={() => setArmReset(false)}
                >
                  Keep it
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
