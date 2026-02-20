import { prisma } from '../lib/prisma';

export class GameService {
  async finishGame(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    const totalMoneyIn = game.players.reduce((sum, p) => sum + p.totalMoneyIn, 0);
    const totalChips = game.players.reduce(
      (sum, p) => sum + (p.chipsOut ?? p.totalBuyIns * game.chipsPerBuyIn),
      0
    );
    const chipValue = totalChips > 0 ? totalMoneyIn / totalChips : 0;

    const updatePromises = game.players
      .filter((p) => p.exitedAt === null)
      .map((player) => {
        const chips = player.totalBuyIns * game.chipsPerBuyIn;
        const cashOutAmount = chips * chipValue;

        return prisma.gamePlayer.update({
          where: { id: player.id },
          data: {
            chipsOut: chips,
            cashOut: cashOutAmount,
            exitedAt: new Date(),
            transactions: {
              create: {
                type: 'cash_out',
                chips,
                amount: cashOutAmount,
              },
            },
          },
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
    }>;
  }) {
    const balances = game.players.map((p) => ({
      userId: p.userId,
      name: p.user.name,
      balance: (p.cashOut || 0) - p.totalMoneyIn,
    }));

    const settlements: Array<{
      from: string;
      fromName: string;
      to: string;
      toName: string;
      amount: number;
    }> = [];

    const debtors = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);

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
