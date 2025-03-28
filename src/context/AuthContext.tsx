import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthState, User } from '../types/auth';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

import { AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType>({
  state: initialState,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUser(session.user);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUser(session.user);
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUser = async (supabaseUser: SupabaseUser) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    // If profile doesn't exist, create it
    if (!profile && !error) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.email?.split('@')[0],
          role: 'user'
        }])
        .select()
        .single();

      if (newProfile) {
        const user: User = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: newProfile.name || supabaseUser.email!.split('@')[0],
          role: newProfile.role || 'user',
          super_role: newProfile.super_role || null,
          avatar: newProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.email || '')}`
        };

        setState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        return;
      }
    }

    const user: User = {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: profile?.name || supabaseUser.email!.split('@')[0],
      role: profile?.role || 'user',
      super_role: profile?.super_role || null,
      avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.email || '')}`
    };

    setState({
      user,
      isAuthenticated: true,
      isLoading: false
    });
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateUser = (user: User) => {
    setState(prev => ({
      ...prev,
      user,
    }));
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);