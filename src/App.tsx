"use client";

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseProvider, useFirebase } from './lib/FirebaseProvider';
import { BottomNav, DesktopSidebar, Header } from './components/Navigation';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LeadList = lazy(() => import('./pages/LeadList'));
const LeadDetail = lazy(() => import('./pages/LeadDetail'));
const LeadForm = lazy(() => import('./pages/LeadForm'));
const Login = lazy(() => import('./pages/Login'));
const Admin = lazy(() => import('./pages/Admin'));

function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Initializing LeadPilot...</p>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebase();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/form/:clientId" element={<LeadForm />} />
            <Route path="/leads/new" element={<ProtectedRoute><LeadForm /></ProtectedRoute>} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><LeadList /></ProtectedRoute>} />
            <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </FirebaseProvider>
  );
}
