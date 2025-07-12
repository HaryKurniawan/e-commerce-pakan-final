import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/baseApi';
import { authAPI } from '../services/authAPI';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to clear all auth data
  const clearAuthData = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    // Clear semua item localStorage yang berkaitan dengan auth
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.')) {
        localStorage.removeItem(key);
      }
    });
  };

  // Helper function to validate and refresh user data
  const validateAndRefreshUser = async (session) => {
    try {
      if (!session?.user?.email) {
        throw new Error('Invalid session');
      }

      // Check if email is confirmed
      if (!session.user.email_confirmed_at) {
        throw new Error('Email not confirmed');
      }

      // Get fresh user profile
      const userProfile = await authAPI.getUserProfile(session.user.email);
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      return userProfile;
    } catch (error) {
      console.error('User validation error:', error);
      throw error;
    }
  };

  // Function to check if stored user is still valid
  const isStoredUserValid = async () => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) return false;

      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser?.email) return false;

      // Check if we have a valid session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return false;

      // Verify the stored user matches the session user
      return session.user.email === parsedUser.email && session.user.email_confirmed_at;
    } catch (error) {
      console.error('Stored user validation error:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // First, check localStorage for existing user
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser?.email) {
              setCurrentUser(parsedUser);
            }
          } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('currentUser');
          }
        }

        // Then check session without auto-refreshing user profile
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          clearAuthData();
          return;
        }

        if (!mounted) return;

        // If no session but we have stored user, clear it
        if (!session?.user && storedUser) {
          clearAuthData();
        }
        
        // If session exists but no stored user, we'll let the auth state change handle it
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes with minimal auto-sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        try {
          switch (event) {
            case 'SIGNED_IN':
              // Only log, don't auto-sync user profile
              console.log('User signed in:', session?.user?.email);
              break;

            case 'SIGNED_OUT':
              clearAuthData();
              break;

            case 'TOKEN_REFRESHED':
              // Just log, don't auto-update user profile
              console.log('Token refreshed for:', session?.user?.email);
              break;

            case 'USER_UPDATED':
              // Only log, manual refresh if needed
              console.log('User updated:', session?.user?.email);
              break;

            case 'PASSWORD_RECOVERY':
              console.log('Password recovery initiated');
              break;

            default:
              // For session expiry or other critical events, clear auth data
              if (!session?.user) {
                clearAuthData();
              }
              break;
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          // Don't auto-clear on errors, let user handle it
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  // Manual refresh user method (call this when needed)
  const refreshUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        clearAuthData();
        return null;
      }

      if (session?.user) {
        const userProfile = await validateAndRefreshUser(session);
        setCurrentUser(userProfile);
        localStorage.setItem('currentUser', JSON.stringify(userProfile));
        return userProfile;
      } else {
        clearAuthData();
        return null;
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      clearAuthData();
      return null;
    }
  };

  // Manual sync user profile from database
  const syncUserProfile = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        throw new Error('No valid session');
      }

      const userProfile = await authAPI.getUserProfile(session.user.email);
      
      if (userProfile) {
        setCurrentUser(userProfile);
        localStorage.setItem('currentUser', JSON.stringify(userProfile));
        return userProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Sync user profile error:', error);
      return null;
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    updateUser,
    refreshUser,
    syncUserProfile,
    loading,
    clearAuthData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};