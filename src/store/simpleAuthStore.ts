import { create } from 'zustand';

interface AdminUser {
  isAdmin: boolean;
  id?: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  role?: string;
  city?: string;
}

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  clearError: () => void;
  setUser: (user: AdminUser | null) => void;
}

// Get admin credentials from environment variables (using Vite's import.meta.env)
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

// Ensure environment variables are set
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Admin credentials not found in environment variables. Please set VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD in your .env file.');
}

export const useAuthStore = create<AuthState>((set) => {
  // Check for existing session in localStorage
  const checkExistingSession = () => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      try {
        return { user: { isAdmin: true }, initialized: true, loading: false };
      } catch (e) {
        localStorage.removeItem('admin_session');
      }
    }
    return { user: null, initialized: true, loading: false };
  };

  // Initialize with existing session if available
  const initialState = checkExistingSession();

  return {
    user: initialState.user,
    loading: false,
    error: null,
    initialized: initialState.initialized,

    clearError: () => set({ error: null }),

    signIn: async (email: string, password: string) => {
      try {
        set({ loading: true, error: null });
        
        // Simple credential check against environment variables
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          // Create a simple session token (in a real app, use a more secure method)
          const sessionToken = btoa(`${email}:${Date.now()}`);
          localStorage.setItem('admin_session', sessionToken);
          
          set({ 
            user: { isAdmin: true },
            loading: false,
            error: null 
          });
        } else {
          throw new Error('Invalid credentials');
        }
      } catch (error) {
        console.error('Login error:', error);
        set({ 
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
          user: null 
        });
        throw error;
      }
    },

    signOut: () => {
      localStorage.removeItem('admin_session');
      set({ user: null });
    },
    
    // Add setUser method for Firebase compatibility
    setUser: (user) => {
      if (user && user.role === 'admin') {
        // Create a session for admin users from Firebase
        const sessionToken = btoa(`${user.email}:${Date.now()}`);
        localStorage.setItem('admin_session', sessionToken);
        
        // Set the user with isAdmin flag
        set({ 
          user: { ...user, isAdmin: true },
          loading: false,
          error: null 
        });
      } else {
        // Clear session if not admin
        localStorage.removeItem('admin_session');
        set({ user: null });
      }
    }
  };
});
