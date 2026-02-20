import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { LeaderboardList } from '../components/stats';
import { statsApi, LeaderboardEntry } from '../api/stats';

type Period = 'all' | 'month' | 'year';
type Scope = 'circle' | 'global';

export const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all');
  const [scope, setScope] = useState<Scope>('circle');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await statsApi.getLeaderboard(period, scope);
        setEntries(data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period, scope]);

  const periods: { value: Period; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'year', label: 'This Year' },
    { value: 'month', label: 'This Month' },
  ];

  const scopes: { value: Scope; label: string; icon: string }[] = [
    { value: 'circle', label: 'My Circle', icon: '👥' },
    { value: 'global', label: 'Global', icon: '🌍' },
  ];

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gold">Leaderboard</h1>

        {/* Scope Toggle */}
        <div className="flex gap-2 p-1 bg-dark-card rounded-lg">
          {scopes.map((s) => (
            <button
              key={s.value}
              onClick={() => setScope(s.value)}
              className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                scope === s.value
                  ? 'bg-gold text-black'
                  : 'text-gray hover:text-white'
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Period Tabs */}
        <div className="flex gap-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                period === p.value
                  ? 'bg-gold/20 text-gold'
                  : 'text-gray hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <LeaderboardList entries={entries} loading={loading} />
      </div>
    </Layout>
  );
};
