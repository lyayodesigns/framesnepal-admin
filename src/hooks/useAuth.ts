import { useEffect } from 'react';
import { useAuthStore } from '../store/simpleAuthStore';

export function useAuth() {
  const { user } = useAuthStore();
  const isAuthenticated = !!user;

  useEffect(() => {
    // Add any authentication state change listeners here if needed
  }, []);

  return { user, isAuthenticated };
}
