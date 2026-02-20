import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/verify', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

export default router;
