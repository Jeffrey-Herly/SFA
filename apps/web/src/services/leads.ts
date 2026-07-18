import api from './api';

export interface LeadData {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  interest?: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'dead';
  source: 'web_form' | 'manual' | 'referral' | 'import';
  created_by?: string;
  assigned_to: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  creator?: {
    name: string;
    role: string;
  };
  assignee?: {
    name: string;
    role: string;
  };
}

export interface LeadFilters {
  status?: string;
  source?: string;
  search?: string;
}

export const leadsService = {
  async getLeads(page = 1, limit = 15, filters: LeadFilters = {}) {
    const params: any = { page, limit };
    if (filters.status) params.status = filters.status;
    if (filters.source) params.source = filters.source;
    if (filters.search) params.search = filters.search;

    const response = await api.get('/leads', { params });
    return response.data as { data: LeadData[]; total: number; page: number; limit: number };
  },

  async getLeadById(id: string) {
    const response = await api.get(`/leads/${id}`);
    return response.data as LeadData;
  },

  async createLead(data: Omit<LeadData, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'creator' | 'assignee'>) {
    const response = await api.post('/leads', data);
    return response.data as LeadData;
  },

  async updateLead(id: string, data: Partial<Omit<LeadData, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'creator' | 'assignee'>>) {
    const response = await api.put(`/leads/${id}`, data);
    return response.data as LeadData;
  },

  async deleteLead(id: string) {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },
};
