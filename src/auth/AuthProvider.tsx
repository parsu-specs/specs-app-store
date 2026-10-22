import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getAuthRepo, getProfileRepo } from "../data/factory";
import type { GoogleAccount } from "../data/repositories";
import type { Profile, User } from "../data/types";
import { cacheProfile, loadCachedProfile, setActiveViewer } from "../utils/viewerCache";
import { initializePalette, resolvePalette, setPalette } from "../utils/palette";
import { debouncedFeedVotes, debouncedVotes } from "../utils/debouncedVotes";

type AuthContext = {
  user: User | null;
  loading: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  updateCachedProfile: (profile: Profile) => void;
  signin: (email: string, password: string, captchaToken?: string) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    password: string,
    captchaToken?: string,
  ) => Promise<string | null>;
  signinWithGoogleAccount: (
    account: GoogleAccount,
  ) => Promise<{ ok: boolean; user?: User; picture?: string; error?: string }>;
  signout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
};

const ctx = createContext<AuthContext | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const userRef = useRef<User | null>(null);
  const profileRevision = useRef(0);
  const profileRequest = useRef<{ user: User; promise: Promise<void> } | null>(null);

  const changeSession = useCallback((session: User | null) => {
    const previousId = userRef.current?.id;
    if (previousId && previousId !== session?.id) {
      debouncedVotes.cancelUser(previousId);
      debouncedFeedVotes.cancelUser(previousId);
    }
    profileRevision.current++;
    userRef.current = session;
    setActiveViewer(session?.id ?? null);
    const cached = session ? loadCachedProfile(session.id) : null;
    setProfile(cached);
    initializePalette();
    if (cached?.palette) setPalette(resolvePalette(cached.palette));
    setUser(session);
  }, []);

  const updateCachedProfile = useCallback((next: Profile) => {
    if (next.id !== userRef.current?.id) return;
    profileRevision.current++;
    cacheProfile(next);
    setProfile(next);
    setPalette(resolvePalette(next.palette));
  }, []);

  const refreshProfile = useCallback(async () => {
    const current = userRef.current;
    if (!current) return;
    if (profileRequest.current?.user === current) return profileRequest.current.promise;
    const revision = profileRevision.current;
    const promise = getProfileRepo()
      .ensureUserProfile(current)
      .then((next) => {
        // Ignore old sessions and responses superseded by a profile edit.
        if (userRef.current === current && profileRevision.current === revision)
          updateCachedProfile(next);
      });
    profileRequest.current = { user: current, promise };
    try {
      await promise;
    } finally {
      if (profileRequest.current?.promise === promise) profileRequest.current = null;
    }
  }, [updateCachedProfile]);

  useEffect(() => {
    if (user)
      void refreshProfile().catch(() => {
        // Keep cached display data when a background refresh fails.
      });
  }, [user, refreshProfile]);

  // Restore session via repo so a future HTTP backend needs no UI change.
  useEffect(() => {
    let cancelled = false;
    getAuthRepo()
      .getSession()
      .then((session) => {
        if (!cancelled) changeSession(session);
      })
      .catch(() => {
        if (!cancelled) changeSession(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [changeSession]);

  const signin = async (email: string, password: string, captchaToken?: string) => {
    try {
      const session = await getAuthRepo().signin(email, password, captchaToken);
      changeSession(session);
      return true;
    } catch {
      return false;
    }
  };

  // Returns an error message on failure, null on success.
  const signup = async (name: string, email: string, password: string, captchaToken?: string) => {
    try {
      const session = await getAuthRepo().signup(name, email, password, captchaToken);
      changeSession(session);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Could not create your account.";
    }
  };

  const signinWithGoogleAccount = async (account: GoogleAccount) => {
    try {
      const { user: session, picture } = await getAuthRepo().signinWithGoogleAccount(account);
      changeSession(session);
      return { ok: true as const, user: session, picture };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Google sign-in failed.",
      };
    }
  };

  const signout = async () => {
    if (userRef.current) {
      debouncedVotes.cancelUser(userRef.current.id);
      debouncedFeedVotes.cancelUser(userRef.current.id);
    }
    try {
      await getAuthRepo().signout();
    } finally {
      // Always clear locally (fail closed) even if the server call fails;
      // the server session expires on its own. Callers show their own toast.
      changeSession(null);
    }
  };

  const updateName = async (name: string) => {
    const updated = await getAuthRepo().updateName(name);
    userRef.current = updated;
    setUser(updated);
    if (profile) updateCachedProfile({ ...profile, name: updated.name });
  };

  return (
    <ctx.Provider
      value={{
        user,
        loading,
        profile,
        refreshProfile,
        updateCachedProfile,
        signin,
        signup,
        signinWithGoogleAccount,
        signout,
        updateName,
      }}
    >
      {children}
    </ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};
