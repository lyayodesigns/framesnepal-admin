import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Footer from './components/Footer';
import Layout from './components/Layout';
import Home from './pages/Home';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import OrderDetail from './pages/admin/OrderDetail';
import UserManagement from './pages/admin/UserManagement';
import Settings from './pages/admin/Settings';
import AdminProducts from './pages/admin/Products';
import FrameManagement from './pages/admin/FrameManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import NotFound from './pages/NotFound';
import { useAuthStore } from './store/simpleAuthStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

export default function App() {
  const { initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected admin routes */}
          <Route path="/admin" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/admin/orders" element={
            <PrivateRoute>
              <AdminOrders />
            </PrivateRoute>
          } />
          <Route path="/admin/orders/:orderId" element={
            <PrivateRoute>
              <OrderDetail />
            </PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute>
              <UserManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/settings" element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } />
          <Route path="/admin/products" element={
            <PrivateRoute>
              <AdminProducts />
            </PrivateRoute>
          } />
          <Route path="/admin/frames" element={
            <PrivateRoute>
              <FrameManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/categories" element={
            <PrivateRoute>
              <CategoryManagement />
            </PrivateRoute>
          } />

          {/* 404 Not Found route - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </Layout>
    </Router>
  );
}