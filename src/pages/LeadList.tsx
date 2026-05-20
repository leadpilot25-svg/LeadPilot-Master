import { useAuth } from "../contexts/AuthContext";
import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion } from "motion/react";
import { Search, ChevronRight, UserPlus, Filter, FileUp, Mail } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Papa from "papaparse";
import { addDoc, serverTimestamp } from "firebase/firestore";

export default function LeadsList() {
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get("filter");
  const statusFilter = searchParams.get("status");
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!user || role === null) return;

    let baseQuery = collection(db, "leads");
    let q = role === "admin" 
      ? query(baseQuery) 
      : query(baseQuery, where("assignedTo", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory to avoid index errors
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterType === "overdue") {
        data = data.filter((l: any) => new Date(l.followUpDate) < today && l.status !== "closed" && l.status !== "inactive");
      } else if (filterType === "upcoming") {
        data = data.filter((l: any) => new Date(l.followUpDate) > today);
      }

      if (statusFilter) {
        data = data.filter((l: any) => l.status === statusFilter);
      }

      setLeads(data);
    });

    return unsubscribe;
  }, [user, role, filterType, statusFilter]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const importedLeads = results.data;
        let successCount = 0;

        for (const lead of importedLeads as any[]) {
          if (!lead.phone) continue;

          try {
            await addDoc(collection(db, "leads"), {
              firstName: lead.firstName || lead.name || "Imported",
              lastName: lead.lastName || "",
              phone: lead.phone,
              email: lead.email || "",
              propertyType: lead.propertyType || "General",
              budget: lead.budget || "",
              status: "new",
              assignedTo: user.uid,
              createdBy: user.uid,
              createdAt: serverTimestamp(),
              followUpDate: new Date().toISOString().split('T')[0],
              source: "CSV Import"
            });
            successCount++;
          } catch (err) {
            console.error("Error importing lead:", err);
          }
        }
        alert(`Successfully imported ${successCount} leads.`);
        setIsImporting(false);
      }
    });
  };

  const filteredLeads = leads.filter(l => 
    `${l.firstName || ""} ${l.lastName || ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.phone || "").includes(searchTerm)
  );

  return (
    <div className="p-6">
      <header className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">Leads</h2>
        <div className="flex gap-2">
          <label className="p-3 bg-white border border-neutral-100 rounded-2xl text-neutral-400 cursor-pointer hover:bg-neutral-50 transition-colors">
            <FileUp size={20} />
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={isImporting} />
          </label>
          <Link to="/leads/new" className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-100">
            <UserPlus size={20} />
          </Link>
        </div>
      </header>

      <div className="relative mb-8 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-neutral-100 rounded-2xl py-4 pl-12 pr-4 outline-none font-medium text-neutral-800 shadow-sm focus:border-emerald-500 transition-all"
        />
      </div>

      <div className="space-y-4">
        {filteredLeads.map((lead) => (
          <Link key={lead.id} to={`/leads/${lead.id}`}>
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-50 text-neutral-400 rounded-2xl flex items-center justify-center font-bold">
                  {(lead.firstName || "?")[0]}
                </div>
                <div>
                  <p className="font-bold text-neutral-900 leading-tight">{lead.firstName || "Unknown"} {lead.lastName || ""}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${
                      lead.status === 'new' ? 'bg-emerald-50 text-emerald-600' :
                      lead.status === 'closed' ? 'bg-emerald-500 text-white' :
                      lead.status === 'inactive' ? 'bg-neutral-100 text-neutral-400' :
                      lead.status === 'site_visit' || lead.status === 'meeting' ? 'bg-orange-50 text-orange-600' :
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      {(lead.status || 'new').replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                      {lead.propertyType || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lead.email && (
                  <a 
                    href={`mailto:${lead.email}`} 
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-neutral-300 hover:text-emerald-500 transition-colors"
                  >
                    <Mail size={18} />
                  </a>
                )}
                <ChevronRight size={20} className="text-neutral-200 group-hover:text-emerald-500 transition-colors" />
              </div>
            </motion.div>
          </Link>
        ))}

        {filteredLeads.length === 0 && (
          <div className="text-center py-20 text-neutral-400">
            No leads found.
          </div>
        )}
      </div>
    </div>
  );
}
