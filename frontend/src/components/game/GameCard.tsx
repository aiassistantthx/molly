import { Link } from 'react-router-dom';
import { Game } from '../../api/games';
import { Card, Avatar } from '../ui';

interface GameCardProps {
  game: Game;
}

export const GameCard = ({ game }: GameCardProps) => {
  const statusColors = {
    pending: 'bg-gray/20 text-gray',
    active: 'bg-success/20 text-success',
    finished: 'bg-gold/20 text-gold',
  };

  const statusLabels = {
    pending: 'Waiting',
    active: 'Active',
    finished: 'Finished',
  };

  const activePlayers = game.players.filter((p) => !p.exitedAt).length;
  const totalChips = game.players.reduce(
    (sum, p) => sum + (p.chipsOut ?? p.totalBuyIns * game.chipsPerBuyIn),
    0
  );

  return (
    <Link to={`/game/${game.id}`}>
      <Card variant="bordered" className="hover:border-gold/50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-white">{game.name}</h3>
            <p className="text-sm text-gray">
              Host: {game.host.name}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[game.status]}`}>
            {statusLabels[game.status]}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray">Buy-in:</span>
            <span className="text-gold font-medium">${game.buyInAmount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray">Players:</span>
            <span className="text-white">{activePlayers}</span>
          </div>
        </div>

        {game.status === 'active' && (
          <div className="mt-3 pt-3 border-t border-gold/10">
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {game.players.slice(0, 5).map((player) => (
                  <Avatar
                    key={player.id}
                    src={player.user.avatarUrl}
                    name={player.user.name}
                    size="sm"
                    className="border-2 border-dark-card"
                  />
                ))}
                {game.players.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-dark flex items-center justify-center text-xs text-gray border-2 border-dark-card">
                    +{game.players.length - 5}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray">In play</p>
                <p className="text-gold font-semibold">{totalChips} chips</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
};
