import api from './api';

export interface UserData {
  id?: string;
  name: string;
  email: string;
  role: 'sales_rep' | 'sales_manager' | 'admin' | 'executive';
  passwordPlain?: string;
  created_at?: string;
}

export const usersService = {
  async getUsers(page = 1, limit = 10, search?: string, role?: string) {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (role) params.role = role;

    const response = await api.get('/users', { params });
    return response.data as { data: UserData[]; total: number; page: number; limit: number };
  },

  async getUserById(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data as UserData;
  },

  async createUser(data: Omit<UserData, 'id' | 'created_at'>) {
    const response = await api.post('/users', data);
    return response.data as UserData;
  },

  async updateUser(id: string, data: Partial<Omit<UserData, 'id' | 'created_at'>>) {
    const response = await api.put(`/users/${id}`, data);
    return response.data as UserData;
  },

  async deleteUser(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
