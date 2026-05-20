export type LeadStatus = 'new' | 'contacted' | 'site_visit' | 'meeting' | 'closed' | 'inactive';

export interface LeadNote {
  text: string;
  timestamp: string;
  author: string;
}

export interface Lead {
  id?: string;
  firstName: string;
  lastName?: string;
  name: string; // Keep for reverse compatibility if needed, but primary is firstName + lastName
  phone: string;
  whatsapp?: string;
  source: string;
  propertyType: string;
  budget: string;
  location?: string;
  status: LeadStatus;
  assignedTo: string;
  clientId: string;
  createdAt: string;
  lastUpdated: string;
  nextFollowUp?: string | null; // ISO string with time
  followUpDate?: string; // Keep for compatibility with existing data
  notes?: string; 
  remark?: string; // New field as requested
  history?: LeadNote[];
}

export interface Client {
  id: string;
  name: string;
  ownerEmail: string;
  users: string[];
  sheetUrl?: string;
}

export interface ClientAnalytics {
  siteVisits: number;
}
