import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { flushPendingRatings } from '../utils/ratingStore';
import { translateAuthError } from '../utils/authErrors';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  favorite_dish: string | null;
  bio: string | null;
  xp: number;
  is_admin: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  passwordRecovery: boolean;
  signUp: (email: string, password: string, displayName: string, favoriteDish: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<string | null>;
  updatePassword: (newPassword: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    fetchProfile(user.id);
    // Sincroniza avaliações feitas enquanto anônimo.
    flushPendingRatings(user.id);
  }, [user, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const signUp = async (email: string, password: string, displayName: string, favoriteDish: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, favorite_dish: favoriteDish || null } },
    });
    return translateAuthError(error?.message);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return translateAuthError(error?.message);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/tipo-prato` },
    });
    return translateAuthError(error?.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    return translateAuthError(error?.message);
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setPasswordRecovery(false);
    return translateAuthError(error?.message);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        passwordRecovery,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
        resetPasswordForEmail,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
