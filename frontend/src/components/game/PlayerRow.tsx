import { useState } from 'react';
import { GamePlayer } from '../../api/games';
import { Avatar, Button, Modal, Input } from '../ui';

interface PlayerRowProps {
  player: GamePlayer;
  chipsPerBuyIn: number;
  buyInAmount: number;
  isHost: boolean;
  gameStatus: 'pending' | 'active' | 'finished';
  onBuyIn: () => void;
  onCashOut: (chips: number) => void;
  onMarkPaid: (paid: boolean) => void;
}

export const PlayerRow = ({
  player,
  chipsPerBuyIn,
  buyInAmount,
  isHost,
  gameStatus,
  onBuyIn,
  onCashOut,
  onMarkPaid,
}: PlayerRowProps) => {
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [chipsOut, setChipsOut] = useState('');

  const currentChips = player.chipsOut ?? player.totalBuyIns * chipsPerBuyIn;
  const isExited = player.exitedAt !== null;

  const handleCashOut = () => {
    const chips = parseInt(chipsOut, 10);
    if (!isNaN(chips) && chips >= 0) {
      onCashOut(chips);
      setShowCashOutModal(false);
      setChipsOut('');
    }
  };

  return (
    <>
      <div className={`p-3 rounded-lg bg-dark-card ${isExited ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-3">
          <Avatar src={player.user.avatarUrl} name={player.user.name} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-white truncate">{player.user.name}</p>
              {isExited && (
                <span className="text-xs px-1.5 py-0.5 bg-gray/20 text-gray rounded">
                  Out
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray">
                Buy-ins: <span className="text-white">{player.totalBuyIns}</span>
              </span>
              <span className="text-gray">
                Chips: <span className="text-gold">{currentChips}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isExited && isHost && (
              <button
                onClick={() => onMarkPaid(!player.moneyPaid)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  player.moneyPaid
                    ? 'bg-success/20 text-success'
                    : 'bg-danger/20 text-danger hover:bg-danger/30'
                }`}
              >
                {player.moneyPaid ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Paid
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Owes ${player.totalMoneyIn}
                  </>
                )}
              </button>
            )}
            {!isExited && !isHost && (
              <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                player.moneyPaid
                  ? 'bg-success/20 text-success'
                  : 'bg-danger/20 text-danger'
              }`}>
                {player.moneyPaid ? 'Paid' : `Owes $${player.totalMoneyIn}`}
              </span>
            )}
          </div>
        </div>

        {gameStatus === 'active' && !isExited && isHost && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gold/10">
            <Button size="sm" variant="secondary" onClick={onBuyIn} className="flex-1">
              + Buy-in
            </Button>
            <Button size="sm" variant="primary" onClick={() => setShowCashOutModal(true)} className="flex-1">
              Cash Out
            </Button>
          </div>
        )}

        {isExited && player.cashOut !== null && (
          <div className="mt-3 pt-3 border-t border-gold/10 flex justify-between text-sm">
            <span className="text-gray">Cashed out:</span>
            <span className={player.cashOut - player.totalMoneyIn >= 0 ? 'text-success' : 'text-danger'}>
              ${player.cashOut.toFixed(2)}
              {' '}
              ({player.cashOut - player.totalMoneyIn >= 0 ? '+' : ''}
              ${(player.cashOut - player.totalMoneyIn).toFixed(2)})
            </span>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCashOutModal}
        onClose={() => setShowCashOutModal(false)}
        title="Cash Out"
      >
        <div className="space-y-4">
          <p className="text-gray">
            Enter the number of chips {player.user.name} is cashing out with:
          </p>
          <Input
            type="number"
            value={chipsOut}
            onChange={(e) => setChipsOut(e.target.value)}
            placeholder="Number of chips"
            min={0}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCashOutModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCashOut} className="flex-1">
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
