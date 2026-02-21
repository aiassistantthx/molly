import { create } from 'zustand';
import { Game, gamesApi, AddPlayerData, FinishGamePlayerData } from '../api/games';

interface GameState {
  games: Game[];
  currentGame: Game | null;
  loading: boolean;
  error: string | null;
  fetchGames: () => Promise<void>;
  fetchGame: (id: string) => Promise<void>;
  createGame: (data: Parameters<typeof gamesApi.create>[0]) => Promise<Game>;
  startGame: (id: string) => Promise<void>;
  finishGame: (id: string, playerData?: FinishGamePlayerData[]) => Promise<void>;
  addPlayer: (gameId: string, data: AddPlayerData) => Promise<void>;
  buyIn: (gameId: string, playerId: string) => Promise<void>;
  cashOut: (gameId: string, playerId: string, chipsOut: number) => Promise<void>;
  markPaid: (gameId: string, playerId: string, paid: boolean) => Promise<void>;
  clearError: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  games: [],
  currentGame: null,
  loading: false,
  error: null,

  fetchGames: async () => {
    set({ loading: true, error: null });
    try {
      const games = await gamesApi.getAll();
      set({ games, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch games', loading: false });
    }
  },

  fetchGame: async (id) => {
    set({ loading: true, error: null });
    try {
      const game = await gamesApi.getById(id);
      set({ currentGame: game, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch game', loading: false });
    }
  },

  createGame: async (data) => {
    set({ loading: true, error: null });
    try {
      const game = await gamesApi.create(data);
      set((state) => ({ games: [...state.games, game], loading: false }));
      return game;
    } catch (err) {
      set({ error: 'Failed to create game', loading: false });
      throw err;
    }
  },

  startGame: async (id) => {
    try {
      const game = await gamesApi.start(id);
      set({ currentGame: game });
    } catch (err) {
      set({ error: 'Failed to start game' });
    }
  },

  finishGame: async (id, playerData) => {
    try {
      const game = await gamesApi.finish(id, playerData);
      set({ currentGame: game });
    } catch (err) {
      set({ error: 'Failed to finish game' });
    }
  },

  addPlayer: async (gameId, data) => {
    try {
      await gamesApi.addPlayer(gameId, data);
      await get().fetchGame(gameId);
    } catch (err) {
      set({ error: 'Failed to add player' });
    }
  },

  buyIn: async (gameId, playerId) => {
    try {
      await gamesApi.buyIn(gameId, playerId);
      await get().fetchGame(gameId);
    } catch (err) {
      set({ error: 'Failed to buy in' });
    }
  },

  cashOut: async (gameId, playerId, chipsOut) => {
    try {
      await gamesApi.cashOut(gameId, playerId, chipsOut);
      await get().fetchGame(gameId);
    } catch (err) {
      set({ error: 'Failed to cash out' });
    }
  },

  markPaid: async (gameId, playerId, paid) => {
    try {
      await gamesApi.markPaid(gameId, playerId, paid);
      await get().fetchGame(gameId);
    } catch (err) {
      set({ error: 'Failed to update payment status' });
    }
  },

  clearError: () => set({ error: null }),
}));
