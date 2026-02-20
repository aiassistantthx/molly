import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { GameCard } from '../components/game';
import { Button, Card } from '../components/ui';
import { useGameStore } from '../store/gameStore';

export const Home = () => {
  const { games, loading, fetchGames } = useGameStore();

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const activeGames = games.filter((g) => g.status === 'active');
  const pendingGames = games.filter((g) => g.status === 'pending');
  const recentGames = games
    .filter((g) => g.status === 'finished')
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Create button */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gold">Games</h1>
          <Link to="/create-game">
            <Button size="sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Game
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-dark-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Active Games */}
            {activeGames.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-gray mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  Active Games
                </h2>
                <div className="space-y-3">
                  {activeGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* Pending Games */}
            {pendingGames.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-gray mb-3">Waiting to Start</h2>
                <div className="space-y-3">
                  {pendingGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Games */}
            {recentGames.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-gray mb-3">Recent Games</h2>
                <div className="space-y-3">
                  {recentGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {games.length === 0 && (
              <Card className="text-center py-12">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">♠</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No games yet</h3>
                <p className="text-gray mb-6">Create your first poker game to get started</p>
                <Link to="/create-game">
                  <Button>Create Game</Button>
                </Link>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
