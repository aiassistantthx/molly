import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Button, Input, Card } from '../components/ui';
import { useGameStore } from '../store/gameStore';

export const CreateGame = () => {
  const navigate = useNavigate();
  const { createGame, loading } = useGameStore();

  const [name, setName] = useState('');
  const [buyInAmount, setBuyInAmount] = useState('20');
  const [chipsPerBuyIn, setChipsPerBuyIn] = useState('100');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const buyIn = parseFloat(buyInAmount);
    const chips = parseInt(chipsPerBuyIn, 10);

    if (isNaN(buyIn) || buyIn <= 0) {
      setError('Buy-in must be a positive number');
      return;
    }
    if (isNaN(chips) || chips <= 0) {
      setError('Chips must be a positive number');
      return;
    }

    try {
      const game = await createGame({
        name: name.trim() || undefined,
        buyInAmount: buyIn,
        chipsPerBuyIn: chips,
      });
      navigate(`/game/${game.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gold">Create Game</h1>
        </div>

        <Card variant="bordered" className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Game Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Will auto-generate from date if empty"
            />

            <Input
              type="number"
              label="Buy-in Amount ($)"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(e.target.value)}
              placeholder="20"
              min={1}
              step="0.01"
              required
            />

            <Input
              type="number"
              label="Chips per Buy-in"
              value={chipsPerBuyIn}
              onChange={(e) => setChipsPerBuyIn(e.target.value)}
              placeholder="100"
              min={1}
              required
            />

            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Create Game
            </Button>
          </form>
        </Card>

        <div className="text-center text-sm text-gray">
          <p>You can add players after creating the game</p>
        </div>
      </div>
    </Layout>
  );
};
