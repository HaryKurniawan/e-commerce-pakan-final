import { supabase } from '../services/baseApi';

export const sessionHelper = {
  // Check if current session is valid
  isSessionValid: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return !error && session?.user && session.user.email_confirmed_at;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  },

  // Get current session with error handling
  getCurrentSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Get session error:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.error('getCurrentSession error:', error);
      return null;
    }
  },

  // Refresh current session
  refreshCurrentSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Refresh session error:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.error('refreshCurrentSession error:', error);
      return null;
    }
  },

  // Clear all auth-related localStorage
  clearAuthStorage: () => {
    // Clear user data
    localStorage.removeItem('currentUser');
    
    // Clear all supabase auth items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Check if stored user matches current session
  isStoredUserValid: async () => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) return false;

      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser?.email) return false;

      const session = await sessionHelper.getCurrentSession();
      if (!session) return false;

      return session.user.email === parsedUser.email && session.user.email_confirmed_at;
    } catch (error) {
      console.error('Stored user validation error:', error);
      return false;
    }
  },

  // Initialize session listener
  initializeSessionListener: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }
};

export default sessionHelper;