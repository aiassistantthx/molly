import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.patch('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/search', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search users' });
  }
});

router.get('/me/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const stats = await calculateUserStats(req.user!.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/:userId/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const stats = await calculateUserStats(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

async function calculateUserStats(userId: string) {
  const gamePlayers = await prisma.gamePlayer.findMany({
    where: {
      userId,
      game: { status: 'finished' },
    },
    include: {
      game: true,
    },
  });

  const totalGames = gamePlayers.length;
  let totalProfit = 0;
  let totalBuyIns = 0;
  let totalCashOuts = 0;
  let wins = 0;
  let biggestWin = 0;
  let biggestLoss = 0;

  for (const gp of gamePlayers) {
    const profit = (gp.cashOut || 0) - gp.totalMoneyIn;
    totalProfit += profit;
    totalBuyIns += gp.totalMoneyIn;
    totalCashOuts += gp.cashOut || 0;

    if (profit > 0) {
      wins++;
      if (profit > biggestWin) biggestWin = profit;
    } else if (profit < biggestLoss) {
      biggestLoss = profit;
    }
  }

  return {
    totalGames,
    totalProfit,
    totalBuyIns,
    totalCashOuts,
    winRate: totalGames > 0 ? wins / totalGames : 0,
    averageProfit: totalGames > 0 ? totalProfit / totalGames : 0,
    biggestWin,
    biggestLoss,
  };
}

export default router;
