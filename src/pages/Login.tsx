"use client";

import React from 'react';
import { useFirebase } from '../lib/FirebaseProvider';
import { Navigate } from 'react-router-dom';
import { BarChart3, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { user, login, loading } = useFirebase();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
       <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full flex flex-col items-center gap-10"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 rotate-12">
                <BarChart3 size={40} />
              </div>
              <div className="text-center">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">LeadPilot</h1>
                <p className="text-gray-500 font-medium mt-2">The Multi-Client Master CRM</p>
              </div>
            </div>

            <div className="w-full bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex flex-col gap-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-sm text-gray-500 mt-1">Sign in with your corporate account</p>
              </div>

              <button 
                onClick={login}
                className="w-full py-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-3 font-bold text-gray-700 hover:shadow-lg hover:border-blue-200 transition-all active:scale-[0.98]"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Login</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <p className="text-[11px] text-center text-gray-400 leading-relaxed">
                By signing in, you agree to LeadPilot's internal usage policies and data security protocols.
              </p>
            </div>

            <div className="flex items-center gap-8 opacity-20 grayscale pointer-events-none">
              <span className="font-black text-2xl">ClientA</span>
              <span className="font-black text-2xl">Matrix_</span>
              <span className="font-black text-2xl">Z-Nexus</span>
            </div>
          </motion.div>
       </div>

       <footer className="p-8 text-center border-t border-gray-50">
         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Produced by LeadPilot Global Systems</p>
       </footer>
    </div>
  );
}
