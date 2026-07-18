import prisma from '../../config/db';
import { OrderStatus, OpportunityStage, ActivityType, TargetPeriod } from '@prisma/client';

export class ReportsService {
  /**
   * Generates the dashboard analytics payload.
   */
  async getDashboardMetrics(userId: string, role: string) {
    const now = new Date();

    // 1. Total Sales Metric
    const salesFilter: any = { status: OrderStatus.approved };
    if (role === 'sales_rep') {
      salesFilter.salesperson_id = userId;
    }
    const salesAgg = await prisma.order.aggregate({
      where: salesFilter,
      _sum: { total_amount: true },
    });
    const totalSales = Number(salesAgg._sum.total_amount || 0);

    // 2. Active Leads Metric (excluding converted & dead)
    const leadsFilter: any = {
      status: {
        notIn: ['converted', 'dead'],
      },
    };
    if (role === 'sales_rep') {
      leadsFilter.assigned_to = userId;
    }
    const activeLeadsCount = await prisma.lead.count({
      where: leadsFilter,
    });

    // 3. Opportunities Win Rate Metric
    const oppFilter: any = {};
    if (role === 'sales_rep') {
      oppFilter.lead = { assigned_to: userId };
    }
    const [totalClosed, totalWon] = await Promise.all([
      prisma.opportunity.count({
        where: {
          ...oppFilter,
          stage: { in: [OpportunityStage.closed_won, OpportunityStage.closed_lost] },
        },
      }),
      prisma.opportunity.count({
        where: {
          ...oppFilter,
          stage: OpportunityStage.closed_won,
        },
      }),
    ]);
    const winRate = totalClosed > 0 ? Math.round((totalWon / totalClosed) * 100) : 0;

    // 4. Visits Count Metric (meetings in current month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const visitsFilter: any = {
      type: ActivityType.meeting,
      activity_date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };
    if (role === 'sales_rep') {
      visitsFilter.user_id = userId;
    }
    const visitsCount = await prisma.activity.count({
      where: visitsFilter,
    });

    // 5. Target vs Actual (Current Month Target for Logged In User)
    const activeTarget = await prisma.target.findFirst({
      where: {
        user_id: userId,
        period_start: { lte: now },
        period_end: { gte: now },
      },
    });

    let targetMetrics = {
      hasTarget: false,
      targetAmount: 0,
      targetVisits: 0,
      targetLeads: 0,
      actualAmount: 0,
      actualVisits: 0,
      actualLeads: 0,
      amountPct: 0,
      visitsPct: 0,
      leadsPct: 0,
    };

    if (activeTarget) {
      targetMetrics.hasTarget = true;
      targetMetrics.targetAmount = Number(activeTarget.target_amount);
      targetMetrics.targetVisits = activeTarget.target_visits;
      targetMetrics.targetLeads = activeTarget.target_new_leads;

      // Get actual sales in period
      const actualSalesAgg = await prisma.order.aggregate({
        where: {
          salesperson_id: userId,
          status: OrderStatus.approved,
          order_date: {
            gte: activeTarget.period_start,
            lte: activeTarget.period_end,
          },
        },
        _sum: { total_amount: true },
      });
      targetMetrics.actualAmount = Number(actualSalesAgg._sum.total_amount || 0);

      // Get actual visits in period
      targetMetrics.actualVisits = await prisma.activity.count({
        where: {
          user_id: userId,
          type: ActivityType.meeting,
          activity_date: {
            gte: activeTarget.period_start,
            lte: activeTarget.period_end,
          },
        },
      });

      // Get actual new leads in period
      targetMetrics.actualLeads = await prisma.lead.count({
        where: {
          created_by: userId, // or assigned_to, but let's count created leads
          created_at: {
            gte: activeTarget.period_start,
            lte: activeTarget.period_end,
          },
        },
      });

      // Calculate percentages (cap at 100 or keep raw, let's keep raw percentages)
      targetMetrics.amountPct = targetMetrics.targetAmount > 0 
        ? Math.round((targetMetrics.actualAmount / targetMetrics.targetAmount) * 100)
        : 0;
      targetMetrics.visitsPct = targetMetrics.targetVisits > 0 
        ? Math.round((targetMetrics.actualVisits / targetMetrics.targetVisits) * 100)
        : 0;
      const tLeads = activeTarget.target_new_leads;
      targetMetrics.leadsPct = tLeads > 0 
        ? Math.round((targetMetrics.actualLeads / tLeads) * 100)
        : 0;
    }

    // 6. Sales Trend (Last 6 Months)
    const salesTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthlyFilter: any = {
        status: OrderStatus.approved,
        order_date: {
          gte: mStart,
          lte: mEnd,
        },
      };
      if (role === 'sales_rep') {
        monthlyFilter.salesperson_id = userId;
      }

      const mAgg = await prisma.order.aggregate({
        where: monthlyFilter,
        _sum: { total_amount: true },
      });

      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      salesTrend.push({
        month: monthLabel,
        year: d.getFullYear(),
        amount: Number(mAgg._sum.total_amount || 0),
      });
    }

    // 7. Leaderboard (Manager/Admin Only)
    let leaderboard: any[] = [];
    if (role === 'sales_manager' || role === 'admin') {
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['sales_rep', 'sales_manager'] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      const leaderboardData = await Promise.all(
        users.map(async (u) => {
          const uAgg = await prisma.order.aggregate({
            where: {
              salesperson_id: u.id,
              status: OrderStatus.approved,
            },
            _sum: { total_amount: true },
          });

          const activeLeads = await prisma.lead.count({
            where: {
              assigned_to: u.id,
              status: { notIn: ['converted', 'dead'] },
            },
          });

          return {
            name: u.name,
            email: u.email,
            role: u.role,
            totalSales: Number(uAgg._sum.total_amount || 0),
            activeLeads,
          };
        })
      );

      // Sort by total sales descending
      leaderboard = leaderboardData.sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);
    }

    return {
      kpis: {
        totalSales,
        activeLeads: activeLeadsCount,
        winRate,
        visitsCount,
      },
      targetMetrics,
      salesTrend,
      leaderboard,
    };
  }
}
