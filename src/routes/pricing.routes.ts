import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const pricingSchema = z.object({
  locationId: z.string(),
  vehicleType: z.string().default('CAR'),
  basePrice: z.number().positive(),
  hourlyRate: z.number().positive(),
  dailyMax: z.number().positive().optional(),
  overtimeRate: z.number().positive().optional(),
  gracePeriod: z.number().int().min(0).default(15),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().nullable().optional()
});

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { locationId, vehicleType, isActive } = req.query;

    const where: any = {};

    if (locationId) {
      where.locationId = locationId;
    }

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const pricingRules = await prisma.pricingRule.findMany({
      where,
      include: {
        location: true
      },
      orderBy: [
        { locationId: 'asc' },
        { vehicleType: 'asc' },
        { effectiveFrom: 'desc' }
      ]
    });

    res.json(pricingRules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing rules' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const pricingRule = await prisma.pricingRule.findUnique({
      where: { id: req.params.id },
      include: {
        location: true
      }
    });

    if (!pricingRule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }

    res.json(pricingRule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing rule' });
  }
});

router.post('/', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = pricingSchema.parse(req.body);

    if (req.user?.role === 'MANAGER' && req.user.locationId !== data.locationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const existing = await prisma.pricingRule.findFirst({
      where: {
        locationId: data.locationId,
        vehicleType: data.vehicleType,
        isActive: true,
        effectiveFrom: {
          lte: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date()
        },
        OR: [
          { effectiveTo: null },
          {
            effectiveTo: {
              gte: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date()
            }
          }
        ]
      }
    });

    if (existing) {
      await prisma.pricingRule.update({
        where: { id: existing.id },
        data: {
          isActive: false,
          effectiveTo: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date()
        }
      });
    }

    const pricingRule = await prisma.pricingRule.create({
      data: {
        ...data,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null
      },
      include: {
        location: true
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_PRICING_RULE',
        entityType: 'PRICING',
        entityId: pricingRule.id,
        metadata: {
          locationId: data.locationId,
          vehicleType: data.vehicleType,
          basePrice: data.basePrice
        }
      }
    });

    res.status(201).json(pricingRule);
  } catch (error) {
    console.error('Create pricing error:', error);
    res.status(400).json({ error: 'Failed to create pricing rule' });
  }
});

router.patch('/:id', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = pricingSchema.partial().parse(req.body);

    const pricingRule = await prisma.pricingRule.findUnique({
      where: { id: req.params.id }
    });

    if (!pricingRule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }

    if (req.user?.role === 'MANAGER' && req.user.locationId !== pricingRule.locationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedRule = await prisma.pricingRule.update({
      where: { id: req.params.id },
      data: {
        ...data,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined
      },
      include: {
        location: true
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_PRICING_RULE',
        entityType: 'PRICING',
        entityId: pricingRule.id,
        metadata: {
          changes: Object.keys(data)
        }
      }
    });

    res.json(updatedRule);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update pricing rule' });
  }
});

router.delete('/:id', authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    const pricingRule = await prisma.pricingRule.findUnique({
      where: { id: req.params.id }
    });

    if (!pricingRule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }

    await prisma.pricingRule.update({
      where: { id: req.params.id },
      data: {
        isActive: false,
        effectiveTo: new Date()
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_PRICING_RULE',
        entityType: 'PRICING',
        entityId: pricingRule.id
      }
    });

    res.json({ message: 'Pricing rule deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete pricing rule' });
  }
});

router.get('/calculate/:locationId', async (req: AuthRequest, res) => {
  try {
    const { vehicleType = 'CAR', duration } = req.query;

    if (!duration) {
      return res.status(400).json({ error: 'Duration required (in minutes)' });
    }

    const pricing = await prisma.pricingRule.findFirst({
      where: {
        locationId: req.params.locationId,
        vehicleType: vehicleType as string,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      }
    });

    if (!pricing) {
      return res.status(404).json({ error: 'No pricing rule found' });
    }

    const minutes = parseInt(duration as string);

    if (minutes <= pricing.gracePeriod) {
      return res.json({ amount: 0, gracePeriod: true });
    }

    const hours = Math.ceil(minutes / 60);
    let amount = pricing.basePrice;

    if (hours > 1) {
      amount += (hours - 1) * pricing.hourlyRate;
    }

    if (pricing.dailyMax && amount > pricing.dailyMax) {
      amount = pricing.dailyMax;
    }

    res.json({
      amount,
      duration: minutes,
      hours,
      pricing: {
        basePrice: pricing.basePrice,
        hourlyRate: pricing.hourlyRate,
        dailyMax: pricing.dailyMax,
        gracePeriod: pricing.gracePeriod
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate pricing' });
  }
});

export default router;