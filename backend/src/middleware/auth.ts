import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/firebase';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    firebaseUid: string;
    isAdmin: boolean;
  };
}

const isDemoMode = process.env.FIREBASE_PROJECT_ID === 'demo-project';

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Demo mode - accept demo token
    if (isDemoMode && token === 'demo-token') {
      let user = await prisma.user.findUnique({
        where: { firebaseUid: 'demo-user-123' },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            firebaseUid: 'demo-user-123',
            email: 'demo@example.com',
            name: 'Demo User',
            avatarUrl: null,
          },
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        firebaseUid: user.firebaseUid,
        isAdmin: user.isAdmin,
      };

      return next();
    }

    const decodedToken = await verifyToken(token);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Try to find by firebaseUid first
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    // If not found by firebaseUid, try by email (for seeded users)
    if (!user && decodedToken.email) {
      user = await prisma.user.findUnique({
        where: { email: decodedToken.email },
      });
      // Update the firebaseUid if found by email
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid: decodedToken.uid },
        });
      }
    }

    if (!user) {
      const email = decodedToken.email || '';
      const isAdmin = email === 'vorobyeviv@gmail.com';
      user = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email,
          name: decodedToken.name || email.split('@')[0] || 'User',
          avatarUrl: decodedToken.picture || null,
          isAdmin,
        },
      });
    } else if (user.email === 'vorobyeviv@gmail.com' && !user.isAdmin) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      firebaseUid: user.firebaseUid,
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
