import { UserStats } from '../../api/users';
import { Card } from '../ui';

interface PlayerStatsProps {
  stats: UserStats;
}

export const PlayerStats = ({ stats }: PlayerStatsProps) => {
  const statItems = [
    { label: 'Total Games', value: stats.totalGames.toString() },
    { label: 'Win Rate', value: `${(stats.winRate * 100).toFixed(0)}%` },
    {
      label: 'Total Profit',
      value: `${stats.totalProfit >= 0 ? '+' : ''}$${stats.totalProfit.toFixed(0)}`,
      color: stats.totalProfit >= 0 ? 'text-success' : 'text-danger'
    },
    { label: 'Avg Profit', value: `$${stats.averageProfit.toFixed(0)}` },
    {
      label: 'Biggest Win',
      value: `+$${stats.biggestWin.toFixed(0)}`,
      color: 'text-success'
    },
    {
      label: 'Biggest Loss',
      value: `-$${Math.abs(stats.biggestLoss).toFixed(0)}`,
      color: 'text-danger'
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {statItems.map((item) => (
        <Card key={item.label}>
          <p className="text-xs text-gray mb-1">{item.label}</p>
          <p className={`text-lg font-bold ${item.color || 'text-white'}`}>
            {item.value}
          </p>
        </Card>
      ))}
    </div>
  );
};
