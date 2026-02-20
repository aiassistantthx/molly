import { LeaderboardEntry } from '../../api/stats';
import { Avatar, Card } from '../ui';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

export const LeaderboardList = ({ entries, loading }: LeaderboardProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-dark-card rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-gray">No players yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <Card key={entry.userId} variant={index < 3 ? 'bordered' : 'default'}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              index === 0 ? 'bg-gold text-black' :
              index === 1 ? 'bg-gray/50 text-white' :
              index === 2 ? 'bg-amber-700 text-white' :
              'bg-dark text-gray'
            }`}>
              {index + 1}
            </div>

            <Avatar src={entry.avatarUrl} name={entry.name} />

            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{entry.name}</p>
              <p className="text-xs text-gray">
                {entry.gamesPlayed} games · {(entry.winRate * 100).toFixed(0)}% wins
              </p>
            </div>

            <div className="text-right">
              <p className={`font-bold ${entry.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                {entry.totalProfit >= 0 ? '+' : ''}${entry.totalProfit.toFixed(0)}
              </p>
              <p className="text-xs text-gray">
                avg ${entry.averageProfit.toFixed(0)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
