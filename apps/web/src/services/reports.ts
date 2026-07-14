import api from './api';

export interface DashboardMetrics {
  kpis: {
    totalSales: number;
    activeLeads: number;
    winRate: number;
    visitsCount: number;
  };
  targetMetrics: {
    hasTarget: boolean;
    targetAmount: number;
    targetVisits: number;
    targetLeads: number;
    actualAmount: number;
    actualVisits: number;
    actualLeads: number;
    amountPct: number;
    visitsPct: number;
    leadsPct: number;
  };
  salesTrend: {
    month: string;
    year: number;
    amount: number;
  }[];
  leaderboard: {
    name: string;
    email: string;
    role: string;
    totalSales: number;
    activeLeads: number;
  }[];
}

export const reportsService = {
  async getDashboardMetrics() {
    const response = await api.get('/reports/dashboard');
    return response.data as DashboardMetrics;
  },
};
