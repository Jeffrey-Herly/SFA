import api from './api';

export interface ActivityData {
  id?: string;
  user_id?: string;
  lead_id?: string | null;
  opportunity_id?: string | null;
  contact_id?: string | null;
  account_id?: string | null;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change';
  notes?: string;
  meta?: Record<string, any>;
  activity_date?: string;
  created_at?: string;
  user?: {
    name: string;
    role: string;
  };
  account?: {
    company_name: string;
  };
  lead?: {
    name: string;
  };
}

export interface ActivityFilters {
  type?: string;
  accountId?: string;
  leadId?: string;
  is_task?: boolean;
  is_completed?: boolean;
}

export const activitiesService = {
  async getActivities(page = 1, limit = 15, filters: ActivityFilters = {}) {
    const params: any = { page, limit };
    
    if (filters.type) params.type = filters.type;
    if (filters.accountId) params.accountId = filters.accountId;
    if (filters.leadId) params.leadId = filters.leadId;
    if (filters.is_task !== undefined) params.is_task = filters.is_task;
    if (filters.is_completed !== undefined) params.is_completed = filters.is_completed;

    const response = await api.get('/activities', { params });
    return response.data as { data: ActivityData[]; total: number; page: number; limit: number };
  },

  async getActivityById(id: string) {
    const response = await api.get(`/activities/${id}`);
    return response.data as ActivityData;
  },

  async createActivity(data: Omit<ActivityData, 'id' | 'user_id' | 'created_at' | 'activity_date' | 'user' | 'account' | 'lead'>) {
    const response = await api.post('/activities', data);
    return response.data as ActivityData;
  },

  async updateActivity(id: string, data: Partial<Pick<ActivityData, 'notes' | 'meta'>>) {
    const response = await api.put(`/activities/${id}`, data);
    return response.data as ActivityData;
  },

  async deleteActivity(id: string) {
    const response = await api.delete(`/activities/${id}`);
    return response.data;
  },
};
