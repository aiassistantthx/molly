import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/leaderboard', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const period = req.query.period as string | undefined;
    const scope = req.query.scope as string | undefined; // 'global' or 'circle'
    let dateFilter: Date | undefined;

    if (period === 'month') {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (period === 'year') {
      dateFilter = new Date();
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    // If scope is 'circle', find only players who played in same games as current user
    let allowedUserIds: string[] | undefined;

    if (scope === 'circle') {
      // Get all games where current user participated
      const myGames = await prisma.gamePlayer.findMany({
        where: { userId: req.user!.id },
        select: { gameId: true },
      });
      const myGameIds = myGames.map(g => g.gameId);

      // Get all players from those games
      const playersInMyGames = await prisma.gamePlayer.findMany({
        where: { gameId: { in: myGameIds } },
        select: { userId: true },
        distinct: ['userId'],
      });
      allowedUserIds = playersInMyGames.map(p => p.userId);
    }

    const users = await prisma.user.findMany({
      where: allowedUserIds ? { id: { in: allowedUserIds } } : undefined,
      include: {
        gamePlayers: {
          where: {
            game: {
              status: 'finished',
              ...(dateFilter && { finishedAt: { gte: dateFilter } }),
            },
            // For circle scope, only count games where current user also played
            ...(scope === 'circle' && {
              game: {
                status: 'finished',
                ...(dateFilter && { finishedAt: { gte: dateFilter } }),
                players: {
                  some: { userId: req.user!.id },
                },
              },
            }),
          },
          include: {
            game: true,
          },
        },
      },
    });

    const leaderboard = users
      .map((user) => {
        const gamesPlayed = user.gamePlayers.length;
        let totalProfit = 0;
        let wins = 0;

        for (const gp of user.gamePlayers) {
          const profit = (gp.cashOut || 0) - gp.totalMoneyIn;
          totalProfit += profit;
          if (profit > 0) wins++;
        }

        return {
          userId: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          totalProfit,
          gamesPlayed,
          winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
          averageProfit: gamesPlayed > 0 ? totalProfit / gamesPlayed : 0,
        };
      })
      .filter((entry) => entry.gamesPlayed > 0)
      .sort((a, b) => b.totalProfit - a.totalProfit);

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

router.get('/history', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const history = await getGameHistory(req.user!.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game history' });
  }
});

router.get('/history/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const history = await getGameHistory(req.params.userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game history' });
  }
});

async function getGameHistory(userId: string) {
  const gamePlayers = await prisma.gamePlayer.findMany({
    where: {
      userId,
      game: { status: 'finished' },
    },
    include: {
      game: true,
    },
    orderBy: {
      game: { finishedAt: 'desc' },
    },
  });

  return gamePlayers.map((gp) => ({
    gameId: gp.gameId,
    gameName: gp.game.name,
    date: gp.game.finishedAt?.toISOString() || gp.game.createdAt.toISOString(),
    buyIn: gp.totalMoneyIn,
    cashOut: gp.cashOut || 0,
    profit: (gp.cashOut || 0) - gp.totalMoneyIn,
  }));
}

export default router;
