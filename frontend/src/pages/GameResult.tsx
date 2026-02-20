import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Card, Avatar, Button } from '../components/ui';
import { useGameStore } from '../store/gameStore';

interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export const GameResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentGame, loading, fetchGame } = useGameStore();

  useEffect(() => {
    if (id) {
      fetchGame(id);
    }
  }, [id, fetchGame]);

  if (loading || !currentGame) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-dark-card rounded animate-pulse" />
          <div className="h-32 bg-dark-card rounded-xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  // Calculate chip value
  const totalMoneyIn = currentGame.players.reduce((sum, p) => sum + p.totalMoneyIn, 0);
  const totalChips = currentGame.players.reduce((sum, p) => sum + (p.chipsOut ?? 0), 0);
  const chipValue = totalChips > 0 ? totalMoneyIn / totalChips : 0;

  // Calculate each player's result
  const results = currentGame.players.map((player) => {
    const cashOut = (player.chipsOut ?? 0) * chipValue;
    const profit = cashOut - player.totalMoneyIn;
    return {
      ...player,
      cashOutValue: cashOut,
      profit,
    };
  }).sort((a, b) => b.profit - a.profit);

  // Calculate settlements (who owes whom)
  const calculateSettlements = (): Settlement[] => {
    const settlements: Settlement[] = [];
    const balances = results.map((r) => ({
      id: r.userId,
      name: r.user.name,
      balance: r.profit,
    }));

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
          from: debtor.id,
          fromName: debtor.name,
          to: creditor.id,
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
  };

  const settlements = calculateSettlements();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-gray hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gold">{currentGame.name}</h1>
            <p className="text-sm text-gray">Game Results</p>
          </div>
        </div>

        {/* Summary */}
        <Card variant="bordered">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-xs text-gray">Total Pot</p>
              <p className="text-lg font-bold text-gold">${totalMoneyIn.toFixed(2)}</p>
            </div>
            <div className="w-px bg-gold/20" />
            <div>
              <p className="text-xs text-gray">Chip Value</p>
              <p className="text-lg font-bold text-white">${chipValue.toFixed(4)}</p>
            </div>
          </div>
        </Card>

        {/* Results Table */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray">Final Standings</h2>
          {results.map((player, index) => (
            <Card key={player.id} variant={index === 0 ? 'bordered' : 'default'}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gold text-black' :
                  index === 1 ? 'bg-gray/50 text-white' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-dark text-gray'
                }`}>
                  {index + 1}
                </div>

                <Avatar src={player.user.avatarUrl} name={player.user.name} />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{player.user.name}</p>
                  <p className="text-xs text-gray">
                    {player.totalBuyIns} buy-ins · {player.chipsOut} chips
                  </p>
                </div>

                <div className="text-right">
                  <p className={`font-bold ${player.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {player.profit >= 0 ? '+' : ''}${player.profit.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray">
                    ${player.cashOutValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Settlements */}
        {settlements.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray">Settlements</h2>
            <Card>
              <div className="space-y-3">
                {settlements.map((settlement, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{settlement.fromName}</span>
                      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="text-white">{settlement.toName}</span>
                    </div>
                    <span className="text-gold font-bold">${settlement.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="pt-4">
          <Link to="/">
            <Button variant="secondary" className="w-full">
              Back to Games
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};
