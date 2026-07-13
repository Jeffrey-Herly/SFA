import api from './api';

export interface AccountData {
  id?: string;
  company_name: string;
  industry?: string | null;
  website?: string | null;
  address?: string | null;
  created_at?: string;
  _count?: {
    contacts: number;
    opportunities: number;
  };
}

export interface ContactData {
  id?: string;
  account_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  created_at?: string;
}

export const accountsService = {
  // Accounts CRUD
  async getAccounts(page = 1, limit = 10, search?: string) {
    const params: any = { page, limit };
    if (search) params.search = search;
    
    const response = await api.get('/accounts', { params });
    return response.data as { data: AccountData[]; total: number; page: number; limit: number };
  },

  async getAccountById(id: string) {
    const response = await api.get(`/accounts/${id}`);
    return response.data as AccountData & { contacts: ContactData[] };
  },

  async createAccount(data: Omit<AccountData, 'id' | 'created_at' | '_count'>) {
    const response = await api.post('/accounts', data);
    return response.data as AccountData;
  },

  async updateAccount(id: string, data: Partial<Omit<AccountData, 'id' | 'created_at' | '_count'>>) {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data as AccountData;
  },

  async deleteAccount(id: string) {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },

  // Contacts CRUD
  async getContacts(accountId?: string) {
    const params: any = {};
    if (accountId) params.accountId = accountId;
    
    const response = await api.get('/contacts', { params });
    return response.data as ContactData[];
  },

  async createContact(data: Omit<ContactData, 'id' | 'created_at'>) {
    const response = await api.post('/contacts', data);
    return response.data as ContactData;
  },

  async updateContact(id: string, data: Partial<Omit<ContactData, 'id' | 'account_id' | 'created_at'>>) {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data as ContactData;
  },

  async deleteContact(id: string) {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },
};
