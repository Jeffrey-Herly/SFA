import api from './api';

export interface OpportunityData {
  id?: string;
  title: string;
  lead_id: string;
  account_id: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  amount: number;
  probability: number;
  expected_close: string;
  loss_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  lead?: {
    name: string;
    assigned_to: string;
  };
  account?: {
    company_name: string;
  };
}

export interface OpportunityFilters {
  stage?: string;
  leadId?: string;
  accountId?: string;
}

export const opportunitiesService = {
  async getOpportunities(filters: OpportunityFilters = {}) {
    const params: any = {};
    if (filters.stage) params.stage = filters.stage;
    if (filters.leadId) params.leadId = filters.leadId;
    if (filters.accountId) params.accountId = filters.accountId;

    const response = await api.get('/opportunities', { params });
    return response.data as OpportunityData[];
  },

  async getOpportunityById(id: string) {
    const response = await api.get(`/opportunities/${id}`);
    return response.data as OpportunityData;
  },

  async createOpportunity(data: Omit<OpportunityData, 'id' | 'created_at' | 'updated_at' | 'lead' | 'account'>) {
    const response = await api.post('/opportunities', data);
    return response.data as OpportunityData;
  },

  async updateOpportunity(id: string, data: Partial<Omit<OpportunityData, 'id' | 'created_at' | 'updated_at' | 'lead' | 'account'>>) {
    const response = await api.put(`/opportunities/${id}`, data);
    return response.data as OpportunityData;
  },

  async deleteOpportunity(id: string) {
    const response = await api.delete(`/opportunities/${id}`);
    return response.data;
  },
};
