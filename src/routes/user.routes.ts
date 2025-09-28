import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['OWNER', 'MANAGER', 'ATTENDANT']).optional(),
  locationId: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});

router.use(authenticate);

router.get('/me', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locationId: true,
        location: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

router.get('/', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { role, locationId, isActive } = req.query;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (req.user?.role === 'MANAGER' && req.user.locationId) {
      where.locationId = req.user.locationId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locationId: true,
        location: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locationId: true,
        location: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user?.role === 'MANAGER' && req.user.locationId !== user.locationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/:id', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = updateUserSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user?.role === 'MANAGER') {
      if (req.user.locationId !== user.locationId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (data.role === 'OWNER' || user.role === 'OWNER') {
        return res.status(403).json({ error: 'Cannot modify owner accounts' });
      }
    }

    const updateData: any = { ...data };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }

    if (data.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existing && existing.id !== req.params.id) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      updateData.email = data.email.toLowerCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locationId: true,
        location: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_USER',
        entityType: 'USER',
        entityId: updatedUser.id,
        metadata: {
          changes: Object.keys(data)
        }
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.session.deleteMany({
      where: { userId: req.params.id }
    });

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_USER',
        entityType: 'USER',
        entityId: req.params.id,
        metadata: {
          userEmail: user.email
        }
      }
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;