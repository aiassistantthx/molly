import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { PlayerRow, AddPlayerModal, FinishGameModal } from '../components/game';
import { Button, Card } from '../components/ui';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { AddPlayerData, FinishGamePlayerData } from '../api/games';

export const Game = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentGame,
    loading,
    fetchGame,
    startGame,
    finishGame,
    addPlayer,
    buyIn,
    cashOut,
    markPaid,
  } = useGameStore();

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showFinishGame, setShowFinishGame] = useState(false);

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
          <div className="h-24 bg-dark-card rounded-xl animate-pulse" />
          <div className="h-24 bg-dark-card rounded-xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  const isHost = user?.id === currentGame.hostId;
  const activePlayers = currentGame.players.filter((p) => !p.exitedAt);
  const exitedPlayers = currentGame.players.filter((p) => p.exitedAt);

  const totalMoneyIn = currentGame.players.reduce((sum, p) => sum + p.totalMoneyIn, 0);
  const totalChips = currentGame.players.reduce(
    (sum, p) => sum + (p.chipsOut ?? p.totalBuyIns * currentGame.chipsPerBuyIn),
    0
  );

  const handleStart = async () => {
    if (id) {
      await startGame(id);
    }
  };

  const handleFinish = async (playerData: FinishGamePlayerData[]) => {
    if (id) {
      await finishGame(id, playerData);
      setShowFinishGame(false);
      navigate(`/game/${id}/results`);
    }
  };

  const handleAddPlayer = async (data: AddPlayerData) => {
    if (id) {
      await addPlayer(id, data);
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gold">{currentGame.name}</h1>
            <p className="text-sm text-gray">
              {currentGame.status === 'pending' && 'Waiting to start'}
              {currentGame.status === 'active' && `${activePlayers.length} players active`}
              {currentGame.status === 'finished' && 'Game finished'}
            </p>
          </div>
        </div>

        {/* Game Stats */}
        <Card variant="bordered">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-xs text-gray">Buy-in</p>
              <p className="text-lg font-bold text-gold">${currentGame.buyInAmount}</p>
            </div>
            <div className="w-px bg-gold/20" />
            <div>
              <p className="text-xs text-gray">Total Pot</p>
              <p className="text-lg font-bold text-white">${totalMoneyIn}</p>
            </div>
            <div className="w-px bg-gold/20" />
            <div>
              <p className="text-xs text-gray">Chips</p>
              <p className="text-lg font-bold text-white">{totalChips}</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        {isHost && (
          <div className="flex gap-3">
            {currentGame.status === 'pending' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddPlayer(true)}
                  className="flex-1"
                >
                  Add Player
                </Button>
                <Button onClick={handleStart} className="flex-1" disabled={currentGame.players.length < 2}>
                  Start Game
                </Button>
              </>
            )}
            {currentGame.status === 'active' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddPlayer(true)}
                  className="flex-1"
                >
                  Add Player
                </Button>
                <Button variant="danger" onClick={() => setShowFinishGame(true)} className="flex-1">
                  Finish Game
                </Button>
              </>
            )}
          </div>
        )}

        {/* Players List */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray">
            {currentGame.status === 'finished' ? 'Final Results' : 'Players'}
          </h2>

          {activePlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              chipsPerBuyIn={currentGame.chipsPerBuyIn}
              buyInAmount={currentGame.buyInAmount}
              isHost={isHost}
              gameStatus={currentGame.status}
              onBuyIn={() => id && buyIn(id, player.id)}
              onCashOut={(chips) => id && cashOut(id, player.id, chips)}
              onMarkPaid={(paid) => id && markPaid(id, player.id, paid)}
            />
          ))}

          {exitedPlayers.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-gray pt-2">Cashed Out</h2>
              {exitedPlayers.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  chipsPerBuyIn={currentGame.chipsPerBuyIn}
                  buyInAmount={currentGame.buyInAmount}
                  isHost={isHost}
                  gameStatus={currentGame.status}
                  onBuyIn={() => {}}
                  onCashOut={() => {}}
                  onMarkPaid={(paid) => id && markPaid(id, player.id, paid)}
                />
              ))}
            </>
          )}
        </div>

        {currentGame.players.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-gray mb-4">No players yet</p>
            {isHost && (
              <Button onClick={() => setShowAddPlayer(true)}>
                Add First Player
              </Button>
            )}
          </Card>
        )}
      </div>

      <AddPlayerModal
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        onAdd={handleAddPlayer}
      />

      <FinishGameModal
        isOpen={showFinishGame}
        onClose={() => setShowFinishGame(false)}
        onFinish={handleFinish}
        players={currentGame.players}
        buyInAmount={currentGame.buyInAmount}
        chipsPerBuyIn={currentGame.chipsPerBuyIn}
      />
    </Layout>
  );
};
