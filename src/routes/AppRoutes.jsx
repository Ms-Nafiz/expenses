import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';
import Transactions from '../pages/transactions/Transactions';
import Analytics from '../pages/analytics/Analytics';
import AIInsights from '../pages/ai/AIInsights';
import Profile from '../pages/profile/Profile';
import AwaitingApproval from '../pages/auth/AwaitingApproval';
import AdminPanel from '../pages/admin/AdminPanel';

const ProtectedRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (userData?.status === 'pending') {
    return <Navigate to="/awaiting-approval" />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>;
  
  if (!user || userData?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { user, userData } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/awaiting-approval" element={
        user && userData?.status === 'active' ? <Navigate to="/" /> : (user ? <AwaitingApproval /> : <Navigate to="/login" />)
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/transactions" element={
        <ProtectedRoute>
          <Transactions />
        </ProtectedRoute>
      } />
      
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      } />
      
      <Route path="/ai-insights" element={
        <ProtectedRoute>
          <AIInsights />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <AdminRoute>
          <AdminPanel />
        </AdminRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
