import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Modal from "./Modal";
import { User, Phone, Mail, Home, DollarSign, MapPin, Tag, UserCheck, Send } from "lucide-react";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    whatsapp: "",
    email: "",
    propertyType: "Residential Apartment",
    budget: "",
    location: "",
    source: "Walk-in",
    assignedTo: user?.uid || "",
  });

  useEffect(() => {
    if (role === "admin") {
      const fetchAgents = async () => {
        const snap = await getDocs(collection(db, "users"));
        setAgents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      };
      fetchAgents();
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const leadData = {
        ...form,
        followUpDate: today,
        followUpTime: "10:00",
        status: "new",
        notes: "Lead added manually",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "leads"), leadData);

      // Create initial activity
      await addDoc(collection(db, "activities"), {
        leadId: docRef.id,
        type: "followup",
        date: today,
        time: "10:00",
        status: "pending",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      onClose();
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        whatsapp: "",
        email: "",
        propertyType: "Residential Apartment",
        budget: "",
        location: "",
        source: "Walk-in",
        assignedTo: user?.uid || "",
      });
    } catch (error) {
      console.error("Error adding lead:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Lead">
      <form onSubmit={handleSubmit} className="space-y-4 pb-10">
        <div className="grid grid-cols-2 gap-3">
          <InputGroup label="First Name" icon={User} placeholder="John" value={form.firstName} onChange={v => setForm({...form, firstName: v})} required />
          <InputGroup label="Last Name" icon={User} placeholder="Doe" value={form.lastName} onChange={v => setForm({...form, lastName: v})} />
        </div>
        
        <InputGroup label="Phone" icon={Phone} placeholder="9876543210" type="tel" value={form.phone} onChange={v => setForm({...form, phone: v})} required />
        <InputGroup label="Email" icon={Mail} placeholder="john@example.com" type="email" value={form.email} onChange={v => setForm({...form, email: v})} />
        
        <div className="grid grid-cols-2 gap-3">
          <SelectGroup label="Property Type" icon={Home} options={["Residential Apartment", "Villas", "Commercial", "Land/Plots"]} value={form.propertyType} onChange={v => setForm({...form, propertyType: v})} />
          <InputGroup label="Budget" icon={DollarSign} placeholder="Cr / L" value={form.budget} onChange={v => setForm({...form, budget: v})} />
        </div>

        <InputGroup label="Location" icon={MapPin} placeholder="Area / City" value={form.location} onChange={v => setForm({...form, location: v})} />
        
        <div className="grid grid-cols-2 gap-3">
          <SelectGroup label="Source" icon={Tag} options={["Walk-in", "Call", "Facebook", "Instagram", "Reference"]} value={form.source} onChange={v => setForm({...form, source: v})} />
          {role === "admin" && (
            <SelectGroup 
              label="Assign Agent" 
              icon={UserCheck} 
              options={agents.map(a => ({ label: a.name, value: a.id }))} 
              value={form.assignedTo} 
              onChange={v => setForm({...form, assignedTo: v})} 
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] mt-6"
        >
          {loading ? "Adding..." : (
            <>
              Save Lead <Send size={18} />
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}

function InputGroup({ label, icon: Icon, value, onChange, ...props }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex items-center gap-3 bg-neutral-50 px-4 py-3 rounded-2xl border border-neutral-100 focus-within:bg-white focus-within:border-emerald-500 transition-all">
        <Icon size={16} className="text-neutral-400" />
        <input
          {...props}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-transparent border-none outline-none text-sm font-semibold text-neutral-800 w-full placeholder-neutral-300"
        />
      </div>
    </div>
  );
}

function SelectGroup({ label, icon: Icon, options, value, onChange }: any) {
  return (
    <div className="space-y-1.5 font-sans">
      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex items-center gap-3 bg-neutral-50 px-4 py-3 rounded-2xl border border-neutral-100 focus-within:bg-white focus-within:border-emerald-500 transition-all">
        <Icon size={16} className="text-neutral-400" />
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-transparent border-none outline-none text-sm font-semibold text-neutral-800 w-full appearance-none"
        >
          {options.map((opt: any) => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
