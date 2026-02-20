import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { GameService } from '../services/game';

const router = Router();
const gameService = new GameService();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const status = req.query.status as string | undefined;
    const games = await prisma.game.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true },
        },
        players: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get games' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true },
        },
        players: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, buyInAmount, chipsPerBuyIn = 100, playerEmails } = req.body;

    if (!name || !buyInAmount) {
      return res.status(400).json({ error: 'Name and buyInAmount are required' });
    }

    const game = await prisma.game.create({
      data: {
        name,
        buyInAmount,
        chipsPerBuyIn,
        hostId: req.user!.id,
        players: {
          create: {
            userId: req.user!.id,
            totalBuyIns: 1,
            totalMoneyIn: buyInAmount,
          },
        },
      },
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true },
        },
        players: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.status(201).json(game);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

router.post('/:id/start', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.hostId !== req.user!.id) {
      return res.status(403).json({ error: 'Only host can start the game' });
    }

    if (game.status !== 'pending') {
      return res.status(400).json({ error: 'Game is not in pending status' });
    }

    const updatedGame = await prisma.game.update({
      where: { id: req.params.id },
      data: { status: 'active' },
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true },
        },
        players: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start game' });
  }
});

router.post('/:id/finish', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
      include: { players: true },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.hostId !== req.user!.id) {
      return res.status(403).json({ error: 'Only host can finish the game' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    const updatedGame = await gameService.finishGame(req.params.id);
    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ error: 'Failed to finish game' });
  }
});

router.post('/:gameId/players', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { email } = req.body;
    const { gameId } = req.params;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.hostId !== req.user!.id) {
      return res.status(403).json({ error: 'Only host can add players' });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          firebaseUid: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      });
    }

    const existingPlayer = await prisma.gamePlayer.findUnique({
      where: {
        gameId_userId: { gameId, userId: user.id },
      },
    });

    if (existingPlayer) {
      return res.status(400).json({ error: 'Player already in game' });
    }

    const player = await prisma.gamePlayer.create({
      data: {
        gameId,
        userId: user.id,
        totalBuyIns: 1,
        totalMoneyIn: game.buyInAmount,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json(player);
  } catch (error) {
    console.error('Add player error:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

router.delete('/:gameId/players/:playerId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { gameId, playerId } = req.params;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.hostId !== req.user!.id) {
      return res.status(403).json({ error: 'Only host can remove players' });
    }

    if (game.status !== 'pending') {
      return res.status(400).json({ error: 'Can only remove players before game starts' });
    }

    await prisma.gamePlayer.delete({
      where: { id: playerId },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove player' });
  }
});

router.post('/:gameId/players/:playerId/buyin', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { gameId, playerId } = req.params;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.hostId !== req.user!.id) {
      return res.status(403).json({ error: 'Only host can process buy-ins' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    const player = await prisma.gamePlayer.update({
      where: { id: playerId },
      data: {
        totalBuyIns: { increment: 1 },
        totalMoneyIn: { increment: game.buyInAmount },
        transactions: {
          create: {
            type: 'buy_in',
            chips: game.chipsPerBuyIn,
            amount: game.buyInAmount,
          },
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process buy-in' });
  }
});

router.post('/:gameId/players/:playerId/cashout', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { gameId, playerId } = req.params;
    const { chipsOut } = req.body;

    if (typeof chipsOut !== 'number' || chipsOut < 0) {
      return res.status(400).json({ error: 'Valid chipsOut required' });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.hostId !== req.user!.id) {
      return res.status(403).json({ error: 'Only host can process cash-outs' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    const totalMoneyIn = game.players.reduce((sum, p) => sum + p.totalMoneyIn, 0);
    const totalChips = game.players.reduce(
      (sum, p) => sum + (p.chipsOut ?? p.totalBuyIns * game.chipsPerBuyIn),
      0
    );
    const chipValue = totalChips > 0 ? totalMoneyIn / totalChips : 0;
    const cashOutAmount = chipsOut * chipValue;

    const player = await prisma.gamePlayer.update({
      where: { id: playerId },
      data: {
        chipsOut,
        cashOut: cashOutAmount,
        exitedAt: new Date(),
        transactions: {
          create: {
            type: 'cash_out',
            chips: chipsOut,
            amount: cashOutAmount,
          },
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    res.json(player);
  } catch (error) {
    console.error('Cash out error:', error);
    res.status(500).json({ error: 'Failed to process cash-out' });
  }
});

router.patch('/:gameId/players/:playerId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { gameId, playerId } = req.params;
    const { moneyPaid } = req.body;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.hostId !== req.user!.id) {
      return res.status(403).json({ error: 'Only host can update players' });
    }

    const player = await prisma.gamePlayer.update({
      where: { id: playerId },
      data: {
        ...(moneyPaid !== undefined && { moneyPaid }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update player' });
  }
});

export default router;
