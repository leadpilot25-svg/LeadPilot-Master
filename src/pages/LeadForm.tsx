"use client";

import React, { useState, useEffect } from 'react';
import { useFirebase } from '../lib/FirebaseProvider';
import { useParams } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart3, Send, CheckCircle2, User, Phone, MapPin, BadgeDollarSign, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function LeadForm() {
  const { client, loading: firebaseLoading } = useFirebase();
  const { clientId: paramClientId } = useParams<{ clientId: string }>();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    source: 'Website',
    propertyType: 'Apartment',
    budget: '',
    remark: ''
  });

  const clientId = paramClientId || client?.id;

  useEffect(() => {
    if (clientId) {
      // Track site visit using increment
      const trackVisit = async () => {
        try {
          const trackRef = doc(db, 'tracking', clientId);
          try {
            await updateDoc(trackRef, { visits: increment(1) });
          } catch (e: any) {
            if (e.code === 'not-found') {
              await setDoc(trackRef, { visits: 1 });
            }
          }
        } catch (err) {
          // Ignore
        }
      };
      trackVisit();
    }
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setLoading(true);

    try {
      // 1. Save to Firestore
      const leadData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        source: client ? 'Manual Entry' : formData.source,
        propertyType: formData.propertyType,
        budget: formData.budget,
        remark: formData.remark,
        clientId,
        status: 'new',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        nextFollowUp: null,
        assignedTo: '',
        history: [{
          text: `Lead created via ${client ? 'Dashboard' : 'Public Form'}${formData.remark ? ': ' + formData.remark : ''}`,
          timestamp: new Date().toISOString(),
          author: 'System'
        }]
      };
      
      const docRef = await addDoc(collection(db, 'leads'), leadData);

      // 2. Sync to Google Sheets (Non-blocking)
      try {
        fetch('/api/sheets-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            data: { ...leadData, id: docRef.id }
          })
        }).catch(err => console.warn("Background sheet sync failed:", err));
      } catch (syncErr) {
        console.warn("Sheet sync non-blocking error:", syncErr);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting lead:", err);
      alert("Submission failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!clientId && !firebaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center flex-col gap-4 bg-gray-50">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-gray-900">Invalid Link</h2>
        <p className="text-gray-500 text-sm font-medium">This lead form link is incorrect or expired.<br/>Please contact your administrator.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full text-center flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
            <p className="text-gray-500 mt-2">The lead has been recorded successfully.</p>
          </div>
          <button 
            onClick={() => {
              setSubmitted(false);
              setFormData({
                firstName: '',
                lastName: '',
                phone: '',
                source: 'In-app', // Default for "Submit Another" if in dashboard
                propertyType: '',
                budget: '',
                remark: ''
              });
            }}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors"
          >
            Add Another Lead
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden"
      >
        <div className="bg-blue-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={32} />
            <h1 className="text-2xl font-bold tracking-tight">LeadPilot</h1>
          </div>
          <p className="opacity-80 font-medium">Capture New Lead Details</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">First Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    required
                    type="text" 
                    value={formData.firstName}
                    onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John" 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-bold text-gray-900"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Last Name</label>
                <input 
                  type="text" 
                  value={formData.lastName}
                  onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe" 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-bold text-gray-900"
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-bold text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Property</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select 
                    required
                    value={formData.propertyType}
                    onChange={e => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-bold text-gray-900 appearance-none"
                  >
                    <option value="">Select</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Studio">Studio</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Budget</label>
                <div className="relative">
                  <BadgeDollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    required
                    type="text" 
                    value={formData.budget}
                    onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="e.g. $500k" 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Remark / Notes</label>
              <textarea 
                rows={3}
                value={formData.remark}
                onChange={e => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                placeholder="Any special requests or details..." 
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-bold text-gray-900 resize-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={18} />
                Submit Inquiry
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
