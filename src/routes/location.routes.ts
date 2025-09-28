import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const createLocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  capacity: z.number().int().positive().default(100)
});

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  isActive: z.boolean().optional()
});

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const where: any = {};

    if (req.user?.role === 'ATTENDANT' && req.user.locationId) {
      where.id = req.user.locationId;
    }

    const locations = await prisma.location.findMany({
      where,
      include: {
        _count: {
          select: {
            tickets: {
              where: {
                status: 'ACTIVE'
              }
            },
            users: true,
            pricingRules: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const locationsWithOccupancy = locations.map(location => ({
      ...location,
      occupancy: location._count.tickets,
      availableSpots: location.capacity - location._count.tickets
    }));

    res.json(locationsWithOccupancy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'ATTENDANT' && req.user.locationId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        pricingRules: {
          where: {
            isActive: true
          }
        },
        _count: {
          select: {
            tickets: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const locationWithOccupancy = {
      ...location,
      occupancy: location._count.tickets,
      availableSpots: location.capacity - location._count.tickets
    };

    res.json(locationWithOccupancy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

router.post('/', authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    const data = createLocationSchema.parse(req.body);

    const location = await prisma.location.create({
      data
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_LOCATION',
        entityType: 'LOCATION',
        entityId: location.id,
        metadata: {
          locationName: location.name
        }
      }
    });

    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create location' });
  }
});

router.patch('/:id', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = updateLocationSchema.parse(req.body);

    const location = await prisma.location.findUnique({
      where: { id: req.params.id }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const updatedLocation = await prisma.location.update({
      where: { id: req.params.id },
      data
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_LOCATION',
        entityType: 'LOCATION',
        entityId: location.id,
        metadata: {
          changes: Object.keys(data)
        }
      }
    });

    res.json(updatedLocation);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update location' });
  }
});

router.get('/:id/stats', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'ATTENDANT' && req.user.locationId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { startDate, endDate } = req.query;

    const where: any = {
      locationId: req.params.id
    };

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
      revenue,
      avgDuration
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.ticket.count({ where: { ...where, status: 'PAID' } }),
      prisma.ticket.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amount: true }
      }),
      prisma.ticket.aggregate({
        where: { ...where, status: 'PAID', duration: { not: null } },
        _avg: { duration: true }
      })
    ]);

    res.json({
      totalTickets,
      activeTickets,
      paidTickets,
      revenue: revenue._sum.amount || 0,
      averageDuration: avgDuration._avg.duration || 0,
      paymentRate: totalTickets > 0 ? (paidTickets / totalTickets) * 100 : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch location stats' });
  }
});

export default router;