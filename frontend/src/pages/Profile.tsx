import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { PlayerStats } from '../components/stats';
import { Card, Avatar, Button } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { usersApi, UserStats } from '../api/users';
import { statsApi, GameHistory } from '../api/stats';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, historyData] = await Promise.all([
          usersApi.getStats(),
          statsApi.getGameHistory(),
        ]);
        setStats(statsData);
        setHistory(historyData);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* User Info */}
        <Card variant="bordered" className="text-center py-6">
          <Avatar
            src={user.avatarUrl}
            name={user.name}
            size="lg"
            className="mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-white">{user.name}</h1>
          <p className="text-gray text-sm">{user.email}</p>
        </Card>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-dark-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <PlayerStats stats={stats} />
        ) : null}

        {/* Game History */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray">Recent Games</h2>
          {history.length > 0 ? (
            history.slice(0, 10).map((game) => (
              <Card key={game.gameId}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{game.gameName}</p>
                    <p className="text-xs text-gray">
                      {new Date(game.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${game.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {game.profit >= 0 ? '+' : ''}${game.profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray">
                      ${game.buyIn} → ${game.cashOut}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="text-center py-6">
              <p className="text-gray">No games played yet</p>
            </Card>
          )}
        </div>

        {/* Sign Out */}
        <Button variant="danger" onClick={handleSignOut} className="w-full">
          Sign Out
        </Button>
      </div>
    </Layout>
  );
};
