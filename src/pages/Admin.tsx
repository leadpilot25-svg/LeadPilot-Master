"use client";

import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../lib/FirebaseProvider';
import { Shield, Plus, Users, Link as LinkIcon, Database, CheckCircle2 } from 'lucide-react';
import { Client } from '../types';

export default function Admin() {
  const { user, refreshClient } = useFirebase();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    name: '',
    sheetUrl: ''
  });

  useEffect(() => {
    if (user?.email) {
      fetchClients();
    }
  }, [user]);

  const handleAddAgent = async (clientId: string) => {
    if (!newAgentEmail) return;
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;
      
      const updatedUsers = [...new Set([...client.users, newAgentEmail])];
      await updateDoc(doc(db, 'clients', clientId), { users: updatedUsers });
      
      setClients(clients.map(c => c.id === clientId ? { ...c, users: updatedUsers } : c));
      setNewAgentEmail('');
      setSelectedClientId(null);
      alert("Agent added successfully!");
    } catch (err) {
      console.error("Error adding agent:", err);
    }
  };

  const fetchClients = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'clients'), 
        where('users', 'array-contains', user.email)
      );
      const querySnapshot = await getDocs(q);
      const clientsData: Client[] = [];
      querySnapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() } as Client);
      });
      setClients(clientsData);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setIsInitializing(true);

    try {
      const clientId = newClient.name.toLowerCase().replace(/\s+/g, '-');
      const clientData: Client = {
        id: clientId,
        name: newClient.name,
        ownerEmail: user.email,
        users: [user.email],
        sheetUrl: newClient.sheetUrl
      };

      await setDoc(doc(db, 'clients', clientId), clientData);
      setClients([...clients, clientData]);
      setNewClient({ name: '', sheetUrl: '' });
      await refreshClient();
      alert("Client initialized successfully!");
    } catch (err) {
      console.error("Error initializing client:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="bg-blue-600 text-white p-8 rounded-[2rem] shadow-xl shadow-blue-100 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Shield size={24} className="opacity-80" />
          <h1 className="text-2xl font-bold tracking-tight">Admin Master Console</h1>
        </div>
        <p className="opacity-70 text-sm font-medium">Manage multi-client environments and system integrity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Initialize New Client */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Plus size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Initialize Client</h2>
          </div>

          <form onSubmit={handleInitClient} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Client Name</label>
              <input 
                required
                type="text" 
                value={newClient.name}
                onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Matrix Real Estate" 
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Apps Script Web App URL</label>
              <input 
                type="url" 
                value={newClient.sheetUrl}
                onChange={e => setNewClient(prev => ({ ...prev, sheetUrl: e.target.value }))}
                placeholder="https://script.google.com/macros/s/.../exec" 
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-mono"
              />
            </div>

            <button 
              disabled={isInitializing}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 mt-2"
            >
              {isInitializing ? "Initializing..." : "Create Client Workspace"}
            </button>
          </form>
        </div>

        {/* Existing Clients */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold text-gray-900">Active Clients</h2>
            <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              {clients.length} System Nodes
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ) : clients.length > 0 ? (
              clients.map((client) => (
                <div key={client.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 font-bold border border-gray-100">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{client.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{client.id}</p>
                      </div>
                    </div>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} />
                      {client.users.length} Agents
                    </div>
                    <div className="flex items-center gap-1.5">
                      <LinkIcon size={12} />
                      {client.sheetUrl ? 'Sheets Connected' : 'No Sheet Link'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Agents</span>
                      <button 
                        onClick={() => setSelectedClientId(selectedClientId === client.id ? null : client.id)}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        + Add Agent
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {client.users.map(email => (
                        <span key={email} className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-medium text-gray-600">
                          {email}
                        </span>
                      ))}
                    </div>

                    {selectedClientId === client.id && (
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="email" 
                          placeholder="agent@email.com"
                          value={newAgentEmail}
                          onChange={e => setNewAgentEmail(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs border-none rounded-lg focus:ring-1 focus:ring-blue-500"
                        />
                        <button 
                          onClick={() => handleAddAgent(client.id)}
                          className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border border-dashed border-gray-200 rounded-xl text-[10px] flex flex-col gap-1">
                    <span className="text-gray-400">Public Form URL:</span>
                    <span className="text-blue-600 font-mono truncate select-all">
                      {window.location.origin}/form/{client.id}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center gap-2">
                <Database size={32} className="text-gray-200" />
                <p className="text-sm font-medium text-gray-400">No client systems found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
