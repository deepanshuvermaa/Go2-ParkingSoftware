import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/summary', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    const where: any = {};

    if (req.user?.role === 'ATTENDANT' && req.user.locationId) {
      where.locationId = req.user.locationId;
    } else if (locationId) {
      where.locationId = locationId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const [
      totalTickets,
      activeTickets,
      paidTickets,
      cancelledTickets,
      revenue,
      avgDuration,
      paymentMethodBreakdown
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.ticket.count({ where: { ...where, status: 'PAID' } }),
      prisma.ticket.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.ticket.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amount: true }
      }),
      prisma.ticket.aggregate({
        where: { ...where, status: 'PAID', duration: { not: null } },
        _avg: { duration: true }
      }),
      prisma.ticket.groupBy({
        by: ['paymentMethod'],
        where: { ...where, status: 'PAID', paymentMethod: { not: null } },
        _count: true,
        _sum: { amount: true }
      })
    ]);

    res.json({
      tickets: {
        total: totalTickets,
        active: activeTickets,
        paid: paidTickets,
        cancelled: cancelledTickets
      },
      revenue: {
        total: revenue._sum.amount || 0,
        byPaymentMethod: paymentMethodBreakdown.map(item => ({
          method: item.paymentMethod,
          count: item._count,
          amount: item._sum.amount || 0
        }))
      },
      averageDuration: avgDuration._avg.duration || 0,
      paymentRate: totalTickets > 0 ? (paidTickets / totalTickets) * 100 : 0
    });
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({ error: 'Failed to generate summary report' });
  }
});

router.get('/revenue', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, locationId, groupBy = 'day' } = req.query;

    const where: any = {
      status: 'PAID'
    };

    if (req.user?.role === 'MANAGER' && req.user.locationId) {
      where.locationId = req.user.locationId;
    } else if (locationId) {
      where.locationId = locationId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        amount: true,
        createdAt: true,
        locationId: true,
        paymentMethod: true
      }
    });

    const grouped = tickets.reduce((acc: any, ticket) => {
      let key: string;
      const date = new Date(ticket.createdAt);

      if (groupBy === 'hour') {
        key = `${date.toISOString().slice(0, 13)}:00`;
      } else if (groupBy === 'day') {
        key = date.toISOString().slice(0, 10);
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else if (groupBy === 'month') {
        key = date.toISOString().slice(0, 7);
      } else {
        key = date.toISOString().slice(0, 10);
      }

      if (!acc[key]) {
        acc[key] = {
          period: key,
          revenue: 0,
          count: 0
        };
      }

      acc[key].revenue += ticket.amount;
      acc[key].count += 1;

      return acc;
    }, {});

    const revenueData = Object.values(grouped).sort((a: any, b: any) =>
      a.period.localeCompare(b.period)
    );

    res.json(revenueData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
});

router.get('/activity', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, userId, action } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

router.get('/attendant-performance', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    const where: any = {};

    if (req.user?.role === 'MANAGER' && req.user.locationId) {
      where.locationId = req.user.locationId;
    } else if (locationId) {
      where.locationId = locationId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const attendants = await prisma.user.findMany({
      where: {
        role: 'ATTENDANT',
        locationId: where.locationId
      }
    });

    const performance = await Promise.all(
      attendants.map(async (attendant) => {
        const [created, paid, revenue] = await Promise.all([
          prisma.ticket.count({
            where: { ...where, createdById: attendant.id }
          }),
          prisma.ticket.count({
            where: { ...where, paidById: attendant.id, status: 'PAID' }
          }),
          prisma.ticket.aggregate({
            where: { ...where, paidById: attendant.id, status: 'PAID' },
            _sum: { amount: true }
          })
        ]);

        return {
          attendant: {
            id: attendant.id,
            name: attendant.name,
            email: attendant.email
          },
          ticketsCreated: created,
          ticketsProcessed: paid,
          revenueCollected: revenue._sum.amount || 0
        };
      })
    );

    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate performance report' });
  }
});

export default router;