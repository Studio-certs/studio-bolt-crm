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
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // Clear any stale data
      localStorage.removeItem('supabase.auth.token');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await handleUser(session.user);
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await handleUser(session.user);
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error checking user:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  };

  const handleUser = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      // If profile doesn't exist, create it
      if (!profile) {
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
    } catch (error) {
      console.error('Error handling user:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
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
    try {
      await supabase.auth.signOut();
      localStorage.clear(); // Clear all local storage
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, clear the local state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
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
