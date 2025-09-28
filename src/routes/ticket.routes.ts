import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const createTicketSchema = z.object({
  vehicleNumber: z.string().min(1),
  vehicleType: z.string().default('CAR'),
  locationId: z.string(),
  notes: z.string().optional()
});

const updateTicketSchema = z.object({
  status: z.enum(['ACTIVE', 'PAID', 'CANCELLED', 'EXPIRED']).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE', 'ONLINE']).optional(),
  amount: z.number().positive().optional(),
  exitTime: z.string().datetime().optional(),
  notes: z.string().optional()
});

const generateTicketNumber = () => {
  const prefix = 'TKT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const calculateAmount = async (entryTime: Date, exitTime: Date, locationId: string, vehicleType: string) => {
  const pricing = await prisma.pricingRule.findFirst({
    where: {
      locationId,
      vehicleType,
      isActive: true,
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: new Date() } }
      ]
    }
  });

  if (!pricing) {
    return 0;
  }

  const durationMinutes = Math.ceil((exitTime.getTime() - entryTime.getTime()) / (1000 * 60));

  if (durationMinutes <= pricing.gracePeriod) {
    return 0;
  }

  const hours = Math.ceil(durationMinutes / 60);
  let amount = pricing.basePrice;

  if (hours > 1) {
    amount += (hours - 1) * pricing.hourlyRate;
  }

  if (pricing.dailyMax && amount > pricing.dailyMax) {
    amount = pricing.dailyMax;
  }

  return amount;
};

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, locationId, startDate, endDate, vehicleNumber } = req.query;

    const where: any = {};

    if (req.user?.role === 'ATTENDANT' && req.user.locationId) {
      where.locationId = req.user.locationId;
    } else if (locationId) {
      where.locationId = locationId;
    }

    if (status) {
      where.status = status;
    }

    if (vehicleNumber) {
      where.vehicleNumber = {
        contains: vehicleNumber as string,
        mode: 'insensitive'
      };
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
      include: {
        location: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        location: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user?.role === 'ATTENDANT' && req.user.locationId !== ticket.locationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createTicketSchema.parse(req.body);

    const locationId = data.locationId || req.user?.locationId;
    if (!locationId) {
      return res.status(400).json({ error: 'Location ID required' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        vehicleNumber: data.vehicleNumber,
        vehicleType: data.vehicleType,
        locationId,
        createdById: req.user!.id,
        notes: data.notes,
        status: 'ACTIVE'
      },
      include: {
        location: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_TICKET',
        entityType: 'TICKET',
        entityId: ticket.id,
        metadata: {
          vehicleNumber: ticket.vehicleNumber,
          ticketNumber: ticket.ticketNumber
        }
      }
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(400).json({ error: 'Failed to create ticket' });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const data = updateTicketSchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user?.role === 'ATTENDANT' && req.user.locationId !== ticket.locationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData: any = { ...data };

    if (data.status === 'PAID' && ticket.status !== 'PAID') {
      const exitTime = data.exitTime ? new Date(data.exitTime) : new Date();
      const amount = data.amount || await calculateAmount(
        ticket.entryTime,
        exitTime,
        ticket.locationId,
        ticket.vehicleType
      );

      updateData.exitTime = exitTime;
      updateData.amount = amount;
      updateData.duration = Math.ceil((exitTime.getTime() - ticket.entryTime.getTime()) / (1000 * 60));
      updateData.paidById = req.user!.id;
      updateData.paymentMethod = data.paymentMethod || 'CASH';
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        location: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_TICKET',
        entityType: 'TICKET',
        entityId: ticket.id,
        metadata: {
          changes: data,
          ticketNumber: ticket.ticketNumber
        }
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(400).json({ error: 'Failed to update ticket' });
  }
});

router.post('/:id/pay', async (req: AuthRequest, res) => {
  try {
    const { paymentMethod = 'CASH', amount } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === 'PAID') {
      return res.status(400).json({ error: 'Ticket already paid' });
    }

    const exitTime = new Date();
    const calculatedAmount = amount || await calculateAmount(
      ticket.entryTime,
      exitTime,
      ticket.locationId,
      ticket.vehicleType
    );

    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        status: 'PAID',
        paymentMethod,
        amount: calculatedAmount,
        exitTime,
        duration: Math.ceil((exitTime.getTime() - ticket.entryTime.getTime()) / (1000 * 60)),
        paidById: req.user!.id
      },
      include: {
        location: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'PAY_TICKET',
        entityType: 'TICKET',
        entityId: ticket.id,
        metadata: {
          amount: calculatedAmount,
          paymentMethod,
          ticketNumber: ticket.ticketNumber
        }
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Pay ticket error:', error);
    res.status(400).json({ error: 'Failed to process payment' });
  }
});

router.post('/sync', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tickets } = req.body;

    if (!Array.isArray(tickets)) {
      return res.status(400).json({ error: 'Invalid tickets data' });
    }

    const syncedIds = [];

    for (const ticketData of tickets) {
      try {
        const existing = await prisma.ticket.findUnique({
          where: { ticketNumber: ticketData.ticketNumber }
        });

        if (!existing) {
          await prisma.ticket.create({
            data: {
              ...ticketData,
              isSynced: true,
              createdById: req.user!.id
            }
          });
        } else {
          await prisma.ticket.update({
            where: { id: existing.id },
            data: {
              ...ticketData,
              isSynced: true
            }
          });
        }

        syncedIds.push(ticketData.id);
      } catch (error) {
        console.error('Sync ticket error:', error);
      }
    }

    res.json({ syncedIds });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;