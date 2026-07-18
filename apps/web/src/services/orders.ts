import api from './api';

export interface OrderItemData {
  id?: string;
  order_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

export interface OrderData {
  id?: string;
  order_number?: string;
  account_id: string;
  opportunity_id?: string | null;
  salesperson_id?: string;
  status: 'draft' | 'submitted' | 'approved' | 'processing' | 'delivered' | 'cancelled';
  order_date: string;
  delivery_date?: string | null;
  total_amount?: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  account?: {
    company_name: string;
  };
  salesperson?: {
    name: string;
  };
  items?: OrderItemData[];
}

export interface OrderFilters {
  status?: string;
  accountId?: string;
  search?: string;
}

export const ordersService = {
  async getOrders(page = 1, limit = 15, filters: OrderFilters = {}) {
    const params: any = { page, limit };
    if (filters.status) params.status = filters.status;
    if (filters.accountId) params.accountId = filters.accountId;
    if (filters.search) params.search = filters.search;

    const response = await api.get('/orders', { params });
    return response.data as { data: OrderData[]; total: number; page: number; limit: number };
  },

  async getOrderById(id: string) {
    const response = await api.get(`/orders/${id}`);
    return response.data as OrderData;
  },

  async createOrder(data: Omit<OrderData, 'id' | 'order_number' | 'salesperson_id' | 'total_amount' | 'created_at' | 'updated_at' | 'account' | 'salesperson' | 'items'> & { items: Omit<OrderItemData, 'id' | 'subtotal'>[] }) {
    const response = await api.post('/orders', data);
    return response.data as OrderData;
  },

  async updateOrder(id: string, data: Partial<Omit<OrderData, 'id' | 'order_number' | 'salesperson_id' | 'total_amount' | 'created_at' | 'updated_at' | 'account' | 'salesperson' | 'items'> & { items?: Omit<OrderItemData, 'id' | 'subtotal'>[] }>) {
    const response = await api.put(`/orders/${id}`, data);
    return response.data as OrderData;
  },

  async approveOrder(id: string) {
    const response = await api.put(`/orders/${id}/approve`);
    return response.data as OrderData;
  },

  async cancelOrder(id: string) {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data as OrderData;
  },

  async deleteOrder(id: string) {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
};
