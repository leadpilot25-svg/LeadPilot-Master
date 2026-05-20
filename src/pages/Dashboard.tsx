import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion } from "motion/react";
import { Calendar, AlertCircle, Clock, Users, ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isSameDay } from "date-fns";

export default function Dashboard() {
  const { user, role, remindersEnabled } = useAuth();
  const [stats, setStats] = useState({
    today: 0,
    overdue: 0,
    new: 0,
    contacted: 0,
    closed: 0,
    inactive: 0,
    siteVisit: 0,
    total: 0
  });

  useEffect(() => {
    if (!user || role === null) return;

    let baseQuery = collection(db, "leads");
    const q = role === "admin" ? query(baseQuery) : query(baseQuery, where("assignedTo", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const counts = {
        today: 0,
        overdue: 0,
        new: 0,
        contacted: 0,
        closed: 0,
        inactive: 0,
        siteVisit: 0,
        total: snapshot.size
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Status counts
        if (data.status === 'new') counts.new++;
        if (data.status === 'contacted') counts.contacted++;
        if (data.status === 'closed') counts.closed++;
        if (data.status === 'inactive') counts.inactive++;
        if (data.status === 'site_visit') counts.siteVisit++;

        if (!data.followUpDate) return;
        const followUpDate = new Date(data.followUpDate);
        if (isNaN(followUpDate.getTime())) return;
        followUpDate.setHours(0, 0, 0, 0);

        if (data.status !== "closed" && data.status !== "inactive") {
          if (isSameDay(followUpDate, today)) {
            counts.today++;
          } else if (followUpDate < today) {
            counts.overdue++;
          }
        }
      });

      setStats(counts);

      // Trigger notification if today > 0
      if (remindersEnabled && counts.today > 0 && "Notification" in window && Notification.permission === "granted") {
        new Notification("LeadPilot Reminder", {
          body: `You have ${counts.today} follow-ups scheduled for today.`,
          icon: "/favicon.ico"
        });
      }
    });

    return unsubscribe;
  }, [user, role]);

  return (
    <div className="p-6 pb-12">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-neutral-900">Good Day,</h2>
        <p className="text-neutral-500 font-medium">{user?.displayName || "Agent"}</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Leads" 
          count={stats.total} 
          icon={Users} 
          color="bg-neutral-100 text-neutral-600" 
          to="/leads"
        />
        <StatCard 
          title="New Leads" 
          count={stats.new} 
          icon={ArrowRight} 
          color="bg-emerald-50 text-emerald-600" 
          to="/leads?status=new"
        />
        <StatCard 
          title="Open Leads" 
          count={stats.contacted} 
          icon={Clock} 
          color="bg-indigo-50 text-indigo-600" 
          to="/leads?status=contacted"
        />
        <StatCard 
          title="Site Visits" 
          count={stats.siteVisit} 
          icon={MapPin} 
          color="bg-orange-50 text-orange-600" 
          to="/leads?status=site_visit"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard 
          title="Today's Tasks" 
          count={stats.today} 
          icon={Calendar} 
          color="bg-emerald-50 text-emerald-600" 
          to="/today"
        />
        <StatCard 
          title="Overdue" 
          count={stats.overdue} 
          icon={AlertCircle} 
          color="bg-rose-50 text-rose-600" 
          to="/leads?filter=overdue"
        />
        <StatCard 
          title="Closed" 
          count={stats.closed} 
          icon={Users} 
          color="bg-emerald-100 text-emerald-800" 
          to="/leads?status=closed"
        />
        <StatCard 
          title="Inactive" 
          count={stats.inactive} 
          icon={AlertCircle} 
          color="bg-neutral-50 text-neutral-400" 
          to="/leads?status=inactive"
        />
      </div>

      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm mb-8"
      >
        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-3">
          <Link to="/public-form" className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl group transition-all hover:bg-neutral-100">
            <span className="font-medium text-neutral-700">Public Form Link</span>
            <ArrowRight size={20} className="text-neutral-400 group-hover:text-emerald-500 transition-colors" />
          </Link>
          <button className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl group transition-all hover:bg-neutral-100 text-left w-full">
            <span className="font-medium text-neutral-700">Invite Agent</span>
            <ArrowRight size={20} className="text-neutral-400 group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, count, icon: Icon, color, to }: any) {
  return (
    <Link to={to}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col justify-between h-40 bg-white`}
      >
        <div className={`p-3 rounded-2xl w-fit ${color}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-3xl font-bold text-neutral-900">{count}</p>
          <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">{title}</p>
        </div>
      </motion.div>
    </Link>
  );
}
