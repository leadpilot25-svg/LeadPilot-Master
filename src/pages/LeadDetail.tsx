"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../lib/FirebaseProvider';
import { Lead, LeadStatus } from '../types';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  History,
  User,
  Shield,
  MapPin,
  CircleDollarSign,
  ChevronRight,
  Send,
  AlertCircle,
  XCircle,
  PauseCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getStatusColor, formatDate } from '../lib/utils';

const STATUS_OPTIONS: LeadStatus[] = ['new', 'contacted', 'site_visit', 'meeting', 'closed', 'inactive'];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, client } = useFirebase();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Update State for Modal
  const [updateForm, setUpdateForm] = useState({
    status: '' as LeadStatus,
    nextFollowUp: '',
    budget: '',
    location: '',
    propertyType: '',
    remark: ''
  });

  useEffect(() => {
    if (id) fetchLead();
  }, [id]);

  const fetchLead = async () => {
    if (!id) return;
    try {
      const docSnap = await getDoc(doc(db, 'leads', id));
      if (docSnap.exists()) {
        const data = docSnap.id ? { id: docSnap.id, ...docSnap.data() } as Lead : null;
        setLead(data);
        if (data) {
          setUpdateForm({
            status: data.status,
            nextFollowUp: data.nextFollowUp || data.followUpDate || '',
            budget: data.budget || '',
            location: data.location || '',
            propertyType: data.propertyType || '',
            remark: data.remark || ''
          });
        }
      }
    } catch (err) {
      console.error("Error fetching lead:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (updates: Partial<Lead>, historyMessage?: string) => {
    if (!id || !lead) return;
    setUpdating(true);
    try {
      const timestamp = new Date().toISOString();
      const updatedHistory = [...(lead.history || [])];
      
      if (historyMessage) {
        updatedHistory.push({
          text: historyMessage,
          timestamp,
          author: user?.email || 'System'
        });
      }

      const finalUpdates = {
        ...updates,
        history: updatedHistory,
        lastUpdated: timestamp
      };

      await updateDoc(doc(db, 'leads', id), finalUpdates);
      setLead(prev => prev ? { ...prev, ...finalUpdates } : null);
      return true;
    } catch (err) {
      console.error("Update Error:", err);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const handleApplyCallUpdate = async () => {
    const success = await updateLead(
      {
        status: updateForm.status as LeadStatus,
        nextFollowUp: updateForm.nextFollowUp || null,
        budget: updateForm.budget,
        location: updateForm.location,
        propertyType: updateForm.propertyType,
        remark: updateForm.remark,
      },
      `Updated after call - New Status: ${updateForm.status}`
    );
    if (success) setShowUpdateModal(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await updateLead({}, `Add Note: ${newNote}`);
    setNewNote('');
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!lead) return (
    <div className="text-center py-20 px-8">
      <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
      <p className="text-gray-500 font-bold">Lead record not found</p>
      <button onClick={() => navigate('/leads')} className="text-blue-600 font-bold mt-4 hover:underline">Return to List</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-4xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{lead.firstName} {lead.lastName}</h1>
            <div className="flex items-center gap-2">
              <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider", getStatusColor(lead.status))}>
                {lead.status}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">{lead.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowUpdateModal(true)}
             className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
           >
             Update Call
           </button>
           <a href={`tel:${lead.phone}`} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-gray-100 text-blue-600 hover:bg-blue-50 transition-colors">
              <Phone size={18} />
           </a>
           <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-gray-100 text-emerald-600 hover:bg-emerald-50 transition-colors">
              <MessageSquare size={18} />
           </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Basic Details */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
              <DetailItem icon={MapPin} label="Location" value={lead.location || 'Not set'} color="text-red-500" />
              <DetailItem icon={Shield} label="Property Type" value={lead.propertyType} color="text-blue-500" />
              <DetailItem icon={CircleDollarSign} label="Budget" value={lead.budget} color="text-emerald-500" />
              <DetailItem icon={History} label="Created At" value={formatDate(lead.createdAt)} color="text-gray-400" />
            </div>
          </div>

          {/* Follow-up Section */}
          <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                   <Clock size={20} />
                   <h3 className="font-bold">Next Action Window</h3>
                </div>
                <button 
                  onClick={() => setShowUpdateModal(true)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
                >
                  <Calendar size={18} />
                </button>
              </div>

              {(lead.nextFollowUp || lead.followUpDate) ? (
                <div>
                  <p className="text-2xl font-black">{new Date(lead.nextFollowUp || lead.followUpDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-sm font-bold opacity-80">{new Date(lead.nextFollowUp || lead.followUpDate!).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
              ) : (
                <p className="text-sm font-medium opacity-70">No future follow-up scheduled</p>
              )}
            </div>
          </div>

          {/* Assignment Section */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ownership</p>
                <p className="text-sm font-bold text-gray-900">{lead.assignedTo || 'Unassigned'}</p>
              </div>
            </div>
            {user?.email && lead.assignedTo !== user.email && (
              <button 
                onClick={() => updateLead({ assignedTo: user.email! }, `Assigned lead to ${user.email}`)}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
              >
                Claim Lead
              </button>
            )}
          </div>
        </div>

        {/* Notes & History */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
             <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                <MessageSquare size={16} className="text-blue-600" />
                Case Notes
             </div>
             <div className="relative">
               <textarea
                 rows={3}
                 value={newNote}
                 onChange={(e) => setNewNote(e.target.value)}
                 placeholder="Log your conversation summary..."
                 className="w-full bg-gray-50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-100 border-none transition-all resize-none placeholder:text-gray-300"
               />
               <button 
                 disabled={!newNote.trim() || updating}
                 onClick={handleAddNote}
                 className="absolute bottom-3 right-3 w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100 active:scale-90 transition-all disabled:opacity-30"
               >
                 <Send size={14} />
               </button>
             </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-1">
             <h3 className="font-bold text-sm text-gray-900 mb-6 flex items-center gap-2">
                <History size={16} className="text-gray-400" />
                History Timeline
             </h3>
             <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                {lead.history?.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="relative pl-7 group">
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-blue-500 z-10 group-first:bg-blue-500 transition-colors" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{entry.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400 font-medium">{formatDate(entry.timestamp)}</span>
                        <span className="text-[10px] text-blue-400 font-bold uppercase truncate max-w-[100px]">{entry.author.split('@')[0]}</span>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Update Call Modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowUpdateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="p-8">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Update After Call</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Status</label>
                    <select 
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value as LeadStatus }))}
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-sm font-bold"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Follow-up</label>
                    <input 
                      type="datetime-local"
                      value={updateForm.nextFollowUp ? new Date(updateForm.nextFollowUp).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, nextFollowUp: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Budget</label>
                    <input 
                      type="text"
                      value={updateForm.budget}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
                    <select 
                      value={updateForm.propertyType}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, propertyType: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-sm font-bold"
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="Villa">Villa</option>
                      <option value="Studio">Studio</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location / remark</label>
                   <textarea
                     rows={3}
                     value={updateForm.remark}
                     onChange={(e) => setUpdateForm(prev => ({ ...prev, remark: e.target.value }))}
                     className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-sm font-bold resize-none"
                   />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-xs hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleApplyCallUpdate}
                    disabled={updating}
                    className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    {updating ? "Saving..." : "Save Updates"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn("w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0", color)}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}
