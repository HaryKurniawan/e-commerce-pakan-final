import { supabase } from './baseApi.js';

export const authAPI = {
  // Register with email verification
  register: async (userData) => {
    try {
      // First, register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            nama: userData.nama,
            username: userData.username,
            no_hp: userData.noHp
          }
        }
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        
        // Provide more specific error messages
        if (authError.message.includes('email')) {
          throw new Error('Email service temporarily unavailable. Please try again later.');
        } else if (authError.message.includes('rate limit')) {
          throw new Error('Too many registration attempts. Please wait a few minutes and try again.');
        } else if (authError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please try logging in instead.');
        } else {
          throw new Error(`Registration failed: ${authError.message}`);
        }
      }

      // Check if user needs to confirm email
      if (authData.user && !authData.user.email_confirmed_at) {
        return {
          user: authData.user,
          needsEmailConfirmation: true,
          message: 'Please check your email and click the confirmation link to complete registration.'
        };
      }

      return {
        user: authData.user,
        needsEmailConfirmation: false
      };
    } catch (error) {
      console.error('Registration error details:', error);
      throw new Error(error.message);
    }
  },

  // Login with Supabase Auth
  login: async (credentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email || credentials.username,
        password: credentials.password
      });

      if (error) {
        console.error('Login error:', error);
        
        if (error.message.includes('email not confirmed')) {
          throw new Error('Please verify your email before logging in. Check your inbox for the confirmation link.');
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else {
          throw new Error(error.message);
        }
      }

      if (!data.user) {
        throw new Error('Login failed: No user data received');
      }

      if (!data.user.email_confirmed_at) {
        throw new Error('Please verify your email before logging in.');
      }

      // Get user profile data from your users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      // If user doesn't exist in users table, create it
      if (!userProfile) {
        console.log('User profile not found, creating new profile...');
        const newProfile = await authAPI.createUserProfile(data.user);
        return newProfile;
      }

      return userProfile;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Create user profile in users table
  createUserProfile: async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            nama: authUser.user_metadata.nama || authUser.email,
            username: authUser.user_metadata.username || authUser.email.split('@')[0],
            email: authUser.email,
            password: 'hashed_by_supabase',
            no_hp: authUser.user_metadata.no_hp || 0,
            role: 'USER'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Create profile error:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Get user profile with better error handling
  getUserProfile: async (email) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Get profile error:', error);
        throw new Error(`Failed to fetch user profile: ${error.message}`);
      }

      if (!data) {
        throw new Error('User profile not found');
      }

      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Get current session with better error handling
  getCurrentSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Get session error:', error);
        throw new Error(`Failed to get session: ${error.message}`);
      }

      return session;
    } catch (error) {
      console.error('getCurrentSession error:', error);
      // Return null instead of throwing to handle gracefully
      return null;
    }
  },

  // Refresh session
  refreshSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Refresh session error:', error);
        throw new Error(`Failed to refresh session: ${error.message}`);
      }

      return session;
    } catch (error) {
      console.error('refreshSession error:', error);
      return null;
    }
  },

  // Logout with better error handling
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Don't throw error for logout - always clear local state
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout - always clear local state
    }
  },

  // Resend email confirmation with better error handling
  resendEmailConfirmation: async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('Resend email error:', error);
        
        if (error.message.includes('rate limit')) {
          throw new Error('Please wait a few minutes before requesting another confirmation email.');
        } else if (error.message.includes('email')) {
          throw new Error('Email service temporarily unavailable. Please try again later.');
        } else {
          throw new Error(error.message);
        }
      }

      return { message: 'Confirmation email sent successfully.' };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Check auth status
  checkAuthStatus: async () => {
    try {
      const session = await authAPI.getCurrentSession();
      
      if (!session?.user) {
        return { isAuthenticated: false, user: null };
      }

      // Verify user still exists in database
      const userProfile = await authAPI.getUserProfile(session.user.email);
      
      return { 
        isAuthenticated: true, 
        user: userProfile,
        session: session 
      };
    } catch (error) {
      console.error('Auth status check error:', error);
      return { isAuthenticated: false, user: null, error: error.message };
    }
  },

  // Update profile
  updateProfile: async (userId, userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
};