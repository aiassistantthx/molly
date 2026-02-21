import { prisma } from '../lib/prisma';

interface FinishPlayerData {
  playerId: string;
  chipsOut: number;
  moneyPaid: boolean;
}

export class GameService {
  async finishGame(gameId: string, playerData?: FinishPlayerData[]) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    // Create a map of player data for quick lookup
    const playerDataMap = new Map<string, FinishPlayerData>();
    if (playerData) {
      playerData.forEach((p) => playerDataMap.set(p.playerId, p));
    }

    // Calculate chip values
    // First, update all players with their chip counts if provided
    const playersWithChips = game.players.map((player) => {
      const data = playerDataMap.get(player.id);
      return {
        ...player,
        chipsOut: data?.chipsOut ?? player.chipsOut ?? player.totalBuyIns * game.chipsPerBuyIn,
        moneyPaid: data?.moneyPaid ?? player.moneyPaid,
      };
    });

    const totalMoneyIn = playersWithChips.reduce((sum, p) => sum + p.totalMoneyIn, 0);
    const totalChips = playersWithChips.reduce((sum, p) => sum + p.chipsOut, 0);
    const chipValue = totalChips > 0 ? totalMoneyIn / totalChips : 0;

    // Update all players
    const updatePromises = playersWithChips.map((player) => {
      const cashOutAmount = player.chipsOut * chipValue;
      const data = playerDataMap.get(player.id);
      const needsUpdate = player.exitedAt === null || data;

      if (!needsUpdate) {
        return Promise.resolve();
      }

      const updateData: any = {
        chipsOut: player.chipsOut,
        cashOut: cashOutAmount,
      };

      // Update moneyPaid if provided
      if (data?.moneyPaid !== undefined) {
        updateData.moneyPaid = data.moneyPaid;
      }

      // Set exitedAt for players who haven't exited yet
      if (player.exitedAt === null) {
        updateData.exitedAt = new Date();
        updateData.transactions = {
          create: {
            type: 'cash_out',
            chips: player.chipsOut,
            amount: cashOutAmount,
          },
        };
      }

      return prisma.gamePlayer.update({
        where: { id: player.id },
        data: updateData,
      });
    });

    await Promise.all(updatePromises);

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'finished',
        finishedAt: new Date(),
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

    return updatedGame;
  }

  calculateSettlements(game: {
    players: Array<{
      userId: string;
      user: { name: string };
      totalMoneyIn: number;
      cashOut: number | null;
      moneyPaid: boolean;
    }>;
  }) {
    // Calculate settlements considering actual payments
    const balances = game.players.map((p) => {
      const cashOut = p.cashOut || 0;
      const paidAmount = p.moneyPaid ? p.totalMoneyIn : 0;
      // Balance = what they should receive - what they paid
      // If they won and paid: positive (they get money back)
      // If they lost and paid: negative (nothing more to pay, but others owe them less)
      // If they won and didn't pay: they get cashOut but don't subtract their buy-in (so net: cashOut - totalMoneyIn)
      // If they lost and didn't pay: they owe the difference
      return {
        userId: p.userId,
        name: p.user.name,
        balance: cashOut - paidAmount,
      };
    });

    const settlements: Array<{
      from: string;
      fromName: string;
      to: string;
      toName: string;
      amount: number;
    }> = [];

    const debtors = balances.filter((b) => b.balance < 0).map(b => ({...b})).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter((b) => b.balance > 0).map(b => ({...b})).sort((a, b) => b.balance - a.balance);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(-debtor.balance, creditor.balance);

      if (amount > 0.01) {
        settlements.push({
          from: debtor.userId,
          fromName: debtor.name,
          to: creditor.userId,
          toName: creditor.name,
          amount,
        });
      }

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j++;
    }

    return settlements;
  }
}
