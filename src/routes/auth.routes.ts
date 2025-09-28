import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['OWNER', 'MANAGER', 'ATTENDANT']).optional(),
  locationId: z.string().optional()
});

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET as string,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

router.post('/login', async (req, res): Promise<Response> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        accessToken,
        refreshToken,
        expiresAt,
        deviceId: req.headers['x-device-id'] as string
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      locationId: user.locationId
    };

    return res.json({
      user: userProfile,
      session: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(400).json({ error: 'Login failed' });
  }
});

router.post('/register', async (req, res): Promise<Response> => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        role: data.role || 'ATTENDANT',
        locationId: data.locationId
      }
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        accessToken,
        refreshToken,
        expiresAt,
        deviceId: req.headers['x-device-id'] as string
      }
    });

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      locationId: user.locationId
    };

    return res.status(201).json({
      user: userProfile,
      session: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(400).json({ error: 'Registration failed' });
  }
});

router.post('/refresh', async (req, res): Promise<Response> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET!);

    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(session.userId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt
      }
    });

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    return res.status(401).json({ error: 'Token refresh failed' });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res): Promise<Response> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    await prisma.session.delete({
      where: { accessToken: token }
    });

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(400).json({ error: 'Logout failed' });
  }
});

export default router;