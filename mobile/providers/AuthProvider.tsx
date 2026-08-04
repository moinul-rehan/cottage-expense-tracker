import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  cottage_id: string;
  first_name: string;
  last_name: string | null;
  role: "super_admin" | "member";
  avatar_url: string | null;
  can_add_expenses: boolean;
  can_add_bazaar: boolean;
  can_add_meals: boolean;
  can_add_deposit: boolean;
};

const PROFILE_COLUMNS =
  "id, cottage_id, first_name, last_name, role, avatar_url, can_add_expenses, can_add_bazaar, can_add_meals, can_add_deposit";

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function handleSessionChange(userSession: Session | null) {
      setSession(userSession);
      if (!userSession) {
        if (!cancelled) setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", userSession.user.id)
        .single();
      if (!cancelled) setProfile(data as Profile | null);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setLoading(false);
      handleSessionChange(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (cancelled) return;
      handleSessionChange(newSession);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
