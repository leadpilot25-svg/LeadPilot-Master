"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lead, LeadStatus } from '../types';
import { useFirebase } from '../lib/FirebaseProvider';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  MessageSquare,
  ChevronRight,
  Plus,
  Calendar,
  Send
} from 'lucide-react';
import { cn, getStatusColor, formatDate } from '../lib/utils';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

import Papa from 'papaparse';

export default function LeadList() {
  const { client, user } = useFirebase();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const statusParam = searchParams.get('status') || 'all';
  const filterParam = searchParams.get('filter') || 'all'; 
  const agentFilter = searchParams.get('agent') || 'all';

  useEffect(() => {
    if (client) fetchLeads();
  }, [client]);

  const fetchLeads = async () => {
    if (!client) return;
    setLoading(true);
    try {
      const leadsRef = collection(db, 'leads');
      // Simple query to avoid index errors
      const q = query(leadsRef, where('clientId', '==', client.id));
      const querySnapshot = await getDocs(q);
      const leadsData: Lead[] = [];
      querySnapshot.forEach((doc) => {
        leadsData.push({ id: doc.id, ...doc.data() } as Lead);
      });
      
      // Manual sort to bypass index requirement for now
      leadsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(leadsData);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let successCount = 0;
        const timestamp = new Date().toISOString();

        for (const row of results.data as any[]) {
          // Validation: Need at least phone or first name
          if (!row.phone && !row.firstName) continue;

          try {
            const leadData = {
              firstName: row.firstName || row.name?.split(' ')[0] || 'Imported',
              lastName: row.lastName || row.name?.split(' ').slice(1).join(' ') || '',
              name: row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim(),
              phone: row.phone || '',
              whatsapp: row.whatsapp || row.phone || '',
              source: row.source || 'CSV Import',
              propertyType: row.propertyType || '',
              budget: row.budget || '',
              location: row.location || '',
              status: 'new' as LeadStatus,
              clientId: client.id,
              assignedTo: '',
              createdAt: timestamp,
              lastUpdated: timestamp,
              nextFollowUp: null,
              history: [{
                text: 'Lead imported via CSV',
                timestamp,
                author: user?.email || 'System'
              }]
            };

            await addDoc(collection(db, 'leads'), leadData);
            successCount++;
          } catch (err) {
            console.error("Row import error:", err);
          }
        }
        
        alert(`Successfully imported ${successCount} leads!`);
        fetchLeads();
        setImporting(false);
      },
      error: (err) => {
        console.error("Vercel/CSV Parse Error:", err);
        setImporting(false);
      }
    });
  };

  const setStatusFilter = (status: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (status === 'all') newParams.delete('status');
    else newParams.set('status', status);
    setSearchParams(newParams);
  };

  const setAgentFilter = (agent: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (agent === 'all') newParams.delete('agent');
    else newParams.set('agent', agent);
    setSearchParams(newParams);
  };

  const uniqueAgents = [...new Set(leads.map(l => l.assignedTo).filter(Boolean))];

  const filteredLeads = leads.filter(lead => {
    // 1. Basic Filters
    const matchesSearch = 
      (lead.firstName + ' ' + (lead.lastName || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.propertyType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Normalize status for matching
    const matchesStatus = statusParam === 'all' || lead.status === statusParam.toLowerCase();
    const matchesAgent = agentFilter === 'all' || lead.assignedTo === agentFilter;
    
    // 2. Special Logic Filters
    let matchesSpecial = true;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;

    const followUpRaw = lead.nextFollowUp || lead.followUpDate;
    const followUp = followUpRaw ? new Date(followUpRaw).getTime() : 0;

    if (filterParam === 'today') {
      matchesSpecial = followUp >= startOfToday && followUp < endOfToday;
    } else if (filterParam === 'pending') {
      matchesSpecial = (followUp < startOfToday && !!followUp && lead.status !== 'closed' && lead.status !== 'inactive');
    } else if (filterParam === 'meeting') {
      matchesSpecial = lead.status === 'site_visit' || lead.status === 'meeting';
    } else if (filterParam === 'open') {
      matchesSpecial = ['new', 'contacted', 'site_visit', 'meeting'].includes(lead.status);
    }
    
    return matchesSearch && matchesStatus && matchesAgent && matchesSpecial;
  });

  const statusOptions = ['all', 'new', 'contacted', 'site_visit', 'meeting', 'closed', 'inactive'];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lead Database</h1>
            {filterParam !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">
                {filterParam}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className={cn(
              "flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 text-gray-400 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest",
              importing && "opacity-50 animate-pulse pointer-events-none"
            )}>
              <Filter size={14} className="rotate-90" />
              <span>Import</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            </label>
            <Link 
              to="/leads/new"
              className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
            >
              <Plus size={20} strokeWidth={3} />
            </Link>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                statusParam === status 
                  ? "bg-gray-900 text-white border-gray-900" 
                  : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>
          <select 
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Agent: All</option>
            {uniqueAgents.map(email => (
              <option key={email} value={email}>{(email as string).split('@')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-3xl animate-pulse" />
          ))
        ) : filteredLeads.length > 0 ? (
          <AnimatePresence mode='popLayout'>
            {filteredLeads.map((lead) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                  <Link to={`/leads/${lead.id}`} className="absolute inset-0 z-0" />
                  
                  <div className="flex items-start justify-between relative z-10 pointer-events-none">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-gray-50">
                        <span className="font-black text-xl">{(lead.firstName || lead.name).charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest", getStatusColor(lead.status))}>
                            {lead.status}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{lead.propertyType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                       <p className="text-[10px] text-gray-400 font-bold uppercase">{formatDate(lead.createdAt)}</p>
                       <div className="mt-1 flex items-center gap-1">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{lead.budget}</span>
                       </div>
                    </div>
                  </div>

                  {/* Actions Layer */}
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-50 relative z-10">
                     <div className="flex items-center gap-1.5">
                        <ActionButton 
                          href={`tel:${lead.phone}`}
                          icon={<Phone size={14} />}
                          className="text-blue-600 bg-blue-50"
                        />
                        <ActionButton 
                          href={`https://wa.me/${lead.phone?.replace(/\D/g,'')}`}
                          icon={<MessageSquare size={14} />}
                          className="text-emerald-600 bg-emerald-50"
                        />
                        <ActionButton 
                          href={`sms:${lead.phone}`}
                          icon={<Send size={14} />}
                          className="text-purple-600 bg-purple-50"
                        />
                     </div>
                     <Link 
                       to={`/leads/${lead.id}`}
                       className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 hover:text-blue-600 transition-colors"
                     >
                        Details
                        <ChevronRight size={12} />
                     </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-4 text-gray-300">
            <Filter size={64} strokeWidth={1} />
            <div className="space-y-1">
               <p className="font-black uppercase tracking-widest text-xs">No Results Found</p>
               <p className="text-[10px] font-bold">Try adjusting filters or search term</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ href, icon, className }: any) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 hover:shadow-sm", className)}
    >
      {icon}
    </a>
  );
}
