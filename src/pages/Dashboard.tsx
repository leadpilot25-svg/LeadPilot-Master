"use client";

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  PhoneCall, 
  Handshake, 
  CalendarClock, 
  Search,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Plus,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { useFirebase } from '../lib/FirebaseProvider';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lead } from '../types';
import { cn, getStatusColor } from '../lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { client, loading: authLoading } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({
    todayFollowUps: 0,
    pendingFollowUps: 0,
    meetingsToday: 0,
    completedTasks: 0,
    // Overview
    newLeads: 0,
    openLeads: 0,
    closedLeads: 0,
    cancelledLeads: 0,
    dormantLeads: 0,
    // Pipeline
    pipeline: {
      'new': 0,
      'contacted': 0,
      'site_visit': 0,
      'meeting': 0,
      'closed': 0,
      'inactive': 0
    }
  });

  useEffect(() => {
    if (client) {
      fetchDashboardData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [client, authLoading]);

  const fetchDashboardData = async () => {
    if (!client) return;
    setLoading(true);
    try {
      const leadsRef = collection(db, 'leads');
      // Simplified query to avoid index issues
      const q = query(leadsRef, where('clientId', '==', client.id));
      const snapshot = await getDocs(q);
      
      const allLeads: Lead[] = [];
      snapshot.forEach(doc => allLeads.push({ id: doc.id, ...doc.data() } as Lead));
      
      // Sort manually to avoid "requires index" error
      allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(allLeads);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const tomorrowStart = todayStart + 86400000;

      const newStats = {
        todayFollowUps: 0,
        pendingFollowUps: 0,
        meetingsToday: 0,
        completedTasks: 0,
        newLeads: 0,
        openLeads: 0,
        closedLeads: 0,
        cancelledLeads: 0, // Keep in stats for logic but user might not show always
        dormantLeads: 0,
        pipeline: {
          'new': 0,
          'contacted': 0,
          'site_visit': 0,
          'meeting': 0,
          'closed': 0,
          'inactive': 0
        }
      };

      allLeads.forEach(lead => {
        // Handle both old followUpDate and new nextFollowUp
        const followUpRaw = lead.nextFollowUp || lead.followUpDate;
        const followUpTime = followUpRaw ? new Date(followUpRaw).getTime() : null;
        
        // Follow-up Summary Logic
        if (followUpTime && lead.status !== 'closed' && lead.status !== 'inactive') {
          if (followUpTime < todayStart) newStats.pendingFollowUps++;
          else if (followUpTime >= todayStart && followUpTime < tomorrowStart) newStats.todayFollowUps++;
        }
        
        // Meeting Today (for cards)
        if (followUpTime && followUpTime >= todayStart && followUpTime < tomorrowStart && (lead.status === 'site_visit' || lead.status === 'meeting')) {
          newStats.meetingsToday++;
        }

        if (lead.status === 'closed') newStats.completedTasks++;

        // Status Categorization
        if (lead.status === 'new') newStats.newLeads++;
        else if (['contacted', 'site_visit', 'meeting'].includes(lead.status)) newStats.openLeads++;
        else if (lead.status === 'closed') newStats.closedLeads++;
        else if (lead.status === 'inactive') newStats.dormantLeads++;

        // Pipeline Distribution
        if (lead.status in newStats.pipeline) {
          newStats.pipeline[lead.status as keyof typeof newStats.pipeline]++;
        }
      });

      setStats(newStats);
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      if (err.message?.includes('index')) {
        alert("Firestore requires a composite index. Check console for the link.");
      }
    } finally {
      setLoading(false);
    }
  };

  const upcomingFollowUps = leads
    .filter(l => {
      const fu = l.nextFollowUp || l.followUpDate;
      return fu && new Date(fu).getTime() >= new Date().getTime() && l.status !== 'closed' && l.status !== 'inactive';
    })
    .sort((a, b) => new Date(a.nextFollowUp || a.followUpDate!).getTime() - new Date(b.nextFollowUp || b.followUpDate!).getTime())
    .slice(0, 5);

  const todayTasks = leads
    .filter(l => {
      const dRaw = l.nextFollowUp || l.followUpDate;
      const d = dRaw ? new Date(dRaw) : null;
      if (!d) return false;
      const t = new Date();
      return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
    })
    .sort((a, b) => new Date(a.nextFollowUp || a.followUpDate!).getTime() - new Date(b.nextFollowUp || b.followUpDate!).getTime());

  if (authLoading || loading) {
    return <div className="p-8 animate-pulse space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-28 bg-gray-100 rounded-3xl" />
        <div className="h-28 bg-gray-100 rounded-3xl" />
        <div className="h-28 bg-gray-100 rounded-3xl" />
        <div className="h-28 bg-gray-100 rounded-3xl" />
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-gray-100 rounded-3xl" />
        <div className="h-96 bg-gray-100 rounded-3xl" />
      </div>
    </div>;
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">LeadPilot CRM</h1>
          <p className="text-sm text-gray-500 font-medium">Monitoring business performance</p>
        </div>
        <Link 
          to="/leads/new"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={18} strokeWidth={3} />
          Add Lead
        </Link>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          label="Today Follow-ups" 
          value={stats.todayFollowUps} 
          icon={CalendarClock} 
          color="text-amber-600" 
          bg="bg-amber-50"
          link="/leads?filter=today"
        />
        <SummaryCard 
          label="Overdue Leads" 
          value={stats.pendingFollowUps} 
          icon={AlertCircle} 
          color="text-red-600" 
          bg="bg-red-50"
          link="/leads?filter=pending"
        />
        <SummaryCard 
          label="Meetings Today" 
          value={stats.meetingsToday} 
          icon={Handshake} 
          color="text-purple-600" 
          bg="bg-purple-50"
          link="/leads?filter=meeting"
        />
        <SummaryCard 
          label="Closed Deals" 
          value={stats.completedTasks} 
          icon={CheckCircle2} 
          color="text-emerald-600" 
          bg="bg-emerald-50"
          link="/leads?status=closed"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Overview Cards */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Lead Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <OverviewItem label="New Leads" value={stats.newLeads} color="bg-blue-600" link="/leads?status=new" />
              <OverviewItem label="Open Leads" value={stats.openLeads} color="bg-amber-500" link="/leads?filter=open" />
              <OverviewItem label="Closed" value={stats.closedLeads} color="bg-emerald-500" link="/leads?status=closed" />
              <OverviewItem label="Inactive" value={stats.dormantLeads} color="bg-gray-400" link="/leads?status=inactive" />
            </div>
          </div>

          {/* Pipeline stages with names mapping for UI */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              Conversion Funnel
            </h3>
            <div className="flex flex-col gap-5">
              {Object.entries(stats.pipeline).map(([stage, count], idx) => {
                const total = leads.length || 1;
                const percentage = Math.round(((count as number) / total) * 100);
                const displayNames: Record<string, string> = {
                  'new': 'New Inquiry',
                  'contacted': 'Contacted',
                  'site_visit': 'Site Visit',
                  'meeting': 'Meeting/Negotiation',
                  'closed': 'Closed Deal',
                  'inactive': 'Inactive/Nurturing'
                };
                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-400 uppercase tracking-widest">{displayNames[stage] || stage}</span>
                      <span className="text-gray-900">{count} leads</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          idx === 0 ? "bg-blue-500" :
                          idx === 1 ? "bg-amber-500" :
                          idx === 2 ? "bg-purple-500" :
                          idx === 3 ? "bg-orange-500" :
                          idx === 4 ? "bg-emerald-500" :
                          "bg-gray-300"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600" />
                Schedule for Today
              </h3>
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                {todayTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {todayTasks.length > 0 ? todayTasks.map(task => (
                <TaskItem key={task.id} lead={task} />
              )) : (
                <div className="text-center py-6">
                   <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CalendarClock size={16} className="text-gray-300" />
                   </div>
                   <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Everything clear</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900 p-5 rounded-3xl shadow-xl text-white">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-400" />
              Follow-ups Queue
            </h3>
            <div className="flex flex-col gap-3">
              {upcomingFollowUps.length > 0 ? upcomingFollowUps.map(lead => {
                const fu = lead.nextFollowUp || lead.followUpDate;
                return (
                  <Link 
                    key={lead.id} 
                    to={`/leads/${lead.id}`}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                  >
                    <div>
                      <p className="text-xs font-bold truncate max-w-[120px]">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                        {new Date(fu!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(fu!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ChevronRight size={14} className="opacity-30" />
                  </Link>
                );
              }) : (
                <p className="text-[10px] text-gray-500 font-bold uppercase text-center py-4 tracking-widest">No upcoming queue</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg, link }: any) {
  return (
    <Link 
      to={link}
      className={cn(
        "p-6 rounded-3xl border border-gray-50 flex flex-col gap-4 transition-all hover:shadow-xl hover:translate-y-[-2px] active:scale-95",
        bg
      )}
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm", color)}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-none mb-1">{value}</p>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      </div>
    </Link>
  );
}

function OverviewItem({ label, value, color, link }: any) {
  return (
    <Link to={link} className="flex flex-col items-center gap-2 group p-4 rounded-2xl hover:bg-gray-50 transition-colors">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-2xl font-black text-gray-900 group-hover:scale-110 transition-transform">{value}</span>
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider text-center">{label}</span>
    </Link>
  );
}

const TaskItem: React.FC<{ lead: Lead }> = ({ lead }) => {
  const dRaw = lead.nextFollowUp || lead.followUpDate;
  const time = dRaw ? new Date(dRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <Link 
      to={`/leads/${lead.id}`}
      className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md hover:border-gray-100 border border-transparent transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xs font-black text-gray-300 group-hover:text-blue-600 transition-colors border border-gray-50">
          {(lead.firstName || 'L').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800">{lead.firstName} {lead.lastName}</p>
          <p className="text-[10px] font-medium text-gray-500">{lead.propertyType}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 justify-end">
           <CalendarClock size={10} className="text-amber-500" />
           <p className="text-[10px] font-black text-amber-600">{time}</p>
        </div>
        <span className={cn("text-[9px] font-black uppercase tracking-widest", getStatusColor(lead.status))}>{lead.status}</span>
      </div>
    </Link>
  );
};
