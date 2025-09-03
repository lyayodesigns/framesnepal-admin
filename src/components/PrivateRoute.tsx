import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/simpleAuthStore';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
