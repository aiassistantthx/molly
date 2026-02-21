import { useState, useMemo } from 'react';
import { Modal, Input, Button, Avatar } from '../ui';
import { GamePlayer } from '../../api/games';

interface PlayerChips {
  playerId: string;
  chipsOut: number;
  moneyPaid: boolean;
}

interface FinishGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (playerData: PlayerChips[]) => void;
  players: GamePlayer[];
  buyInAmount: number;
  chipsPerBuyIn: number;
}

interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export const FinishGameModal = ({
  isOpen,
  onClose,
  onFinish,
  players,
  buyInAmount,
  chipsPerBuyIn,
}: FinishGameModalProps) => {
  const [playerData, setPlayerData] = useState<Record<string, PlayerChips>>(() => {
    const initial: Record<string, PlayerChips> = {};
    players.forEach((p) => {
      initial[p.id] = {
        playerId: p.id,
        chipsOut: p.chipsOut ?? p.totalBuyIns * chipsPerBuyIn,
        moneyPaid: p.moneyPaid,
      };
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);

  const updatePlayer = (playerId: string, field: keyof PlayerChips, value: number | boolean) => {
    setPlayerData((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  };

  // Calculate settlements based on current chip values
  const { chipValue, settlements, results } = useMemo(() => {
    const totalMoneyIn = players.reduce((sum, p) => sum + p.totalMoneyIn, 0);
    const totalChips = Object.values(playerData).reduce((sum, p) => sum + p.chipsOut, 0);
    const chipVal = totalChips > 0 ? totalMoneyIn / totalChips : 0;

    // Calculate each player's result
    const playerResults = players.map((player) => {
      const data = playerData[player.id];
      const cashOutValue = data.chipsOut * chipVal;
      const profit = cashOutValue - player.totalMoneyIn;
      // If player hasn't paid, they "owe" their buy-ins
      // If they won, they receive less by the unpaid amount
      // If they lost, they owe less by the unpaid amount (it's already "lost")
      const unpaidBuyIns = data.moneyPaid ? 0 : player.totalMoneyIn;
      // Net settlement: what they should receive/pay after accounting for unpaid buy-ins
      const netSettlement = cashOutValue - (data.moneyPaid ? 0 : player.totalMoneyIn);

      return {
        ...player,
        chipsOut: data.chipsOut,
        moneyPaid: data.moneyPaid,
        cashOutValue,
        profit,
        unpaidBuyIns,
        netSettlement,
      };
    }).sort((a, b) => b.profit - a.profit);

    // Calculate who owes whom
    const balances = playerResults.map((r) => ({
      id: r.userId,
      name: r.user.name,
      // Balance is their cash-out value minus what they've paid
      // If paid: balance = cashOut - totalMoneyIn = profit
      // If not paid: balance = cashOut (they get their chips value, but haven't paid)
      balance: r.cashOutValue - (r.moneyPaid ? r.totalMoneyIn : 0),
    }));

    // Normalize: make sum = total money paid
    // For settlement calculation, we use net balances
    const totalPaid = playerResults.reduce(
      (sum, r) => sum + (r.moneyPaid ? r.totalMoneyIn : 0),
      0
    );
    const totalCashOut = playerResults.reduce((sum, r) => sum + r.cashOutValue, 0);

    // Adjusted balances: relative to average payout
    const adjustedBalances = playerResults.map((r) => ({
      id: r.userId,
      name: r.user.name,
      // How much they should receive (positive) or pay (negative)
      // If they paid and won: receive = cashOut - buyIn (positive)
      // If they paid and lost: pay = buyIn - cashOut (negative for balance)
      // If not paid and won: receive = cashOut (they never put money in, so receive full cashOut)
      // If not paid and lost: pay = 0 (they didn't pay and lost, so nothing to settle)
      balance: r.moneyPaid
        ? r.cashOutValue - r.totalMoneyIn  // Their profit/loss
        : r.cashOutValue - r.totalMoneyIn, // They owe their buy-in minus what they would receive
    }));

    const settleList: Settlement[] = [];
    const debtors = adjustedBalances.filter((b) => b.balance < 0).map(b => ({...b})).sort((a, b) => a.balance - b.balance);
    const creditors = adjustedBalances.filter((b) => b.balance > 0).map(b => ({...b})).sort((a, b) => b.balance - a.balance);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(-debtor.balance, creditor.balance);

      if (amount > 0.01) {
        settleList.push({
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

    return {
      chipValue: chipVal,
      settlements: settleList,
      results: playerResults,
    };
  }, [players, playerData]);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await onFinish(Object.values(playerData));
    } finally {
      setLoading(false);
    }
  };

  const activePlayers = players.filter((p) => !p.exitedAt);
  const exitedPlayers = players.filter((p) => p.exitedAt);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finish Game">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Active players need chip count */}
        {activePlayers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray">Enter final chip counts</h3>
            {activePlayers.map((player) => (
              <div key={player.id} className="flex items-center gap-3 bg-dark-card rounded-lg p-3">
                <Avatar src={player.user.avatarUrl} name={player.user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{player.user.name}</p>
                  <p className="text-xs text-gray">
                    {player.totalBuyIns} buy-ins (${player.totalMoneyIn})
                  </p>
                </div>
                <input
                  type="number"
                  value={playerData[player.id]?.chipsOut ?? 0}
                  onChange={(e) =>
                    updatePlayer(player.id, 'chipsOut', Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-20 bg-dark border border-gold/30 rounded px-2 py-1 text-white text-center"
                  min={0}
                />
              </div>
            ))}
          </div>
        )}

        {/* Cashed out players (read-only) */}
        {exitedPlayers.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray">Already cashed out</h3>
            {exitedPlayers.map((player) => (
              <div key={player.id} className="flex items-center gap-3 bg-dark-card/50 rounded-lg p-3">
                <Avatar src={player.user.avatarUrl} name={player.user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white/70 truncate">{player.user.name}</p>
                </div>
                <span className="text-gray">{player.chipsOut} chips</span>
              </div>
            ))}
          </div>
        )}

        {/* Payment status */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray">Physical payment status</h3>
          {players.map((player) => (
            <div key={player.id} className="flex items-center gap-3">
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={playerData[player.id]?.moneyPaid ?? false}
                  onChange={(e) => updatePlayer(player.id, 'moneyPaid', e.target.checked)}
                  className="w-5 h-5 rounded border-gold/30 bg-dark text-gold focus:ring-gold"
                />
                <span className="text-white">{player.user.name}</span>
              </label>
              <span className={playerData[player.id]?.moneyPaid ? 'text-success' : 'text-danger'}>
                {playerData[player.id]?.moneyPaid ? 'Paid' : `Owes $${player.totalMoneyIn}`}
              </span>
            </div>
          ))}
        </div>

        {/* Preview settlements */}
        <div className="space-y-2 pt-2 border-t border-gold/20">
          <h3 className="text-sm font-medium text-gray">Settlement Preview</h3>
          <div className="text-xs text-gray mb-2">
            Chip value: ${chipValue.toFixed(4)}
          </div>
          {results.map((player) => (
            <div key={player.id} className="flex justify-between text-sm">
              <span className="text-white">{player.user.name}</span>
              <span className={player.profit >= 0 ? 'text-success' : 'text-danger'}>
                {player.profit >= 0 ? '+' : ''}${player.profit.toFixed(2)}
              </span>
            </div>
          ))}

          {settlements.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gold/10 space-y-2">
              <h4 className="text-xs text-gray font-medium">Who pays whom:</h4>
              {settlements.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{s.fromName}</span>
                    <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="text-white">{s.toName}</span>
                  </div>
                  <span className="text-gold font-bold">${s.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleFinish} loading={loading} className="flex-1">
            Finish Game
          </Button>
        </div>
      </div>
    </Modal>
  );
};
