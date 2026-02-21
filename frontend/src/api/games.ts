import api from './client';

export interface Game {
  id: string;
  name: string;
  hostId: string;
  host: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  buyInAmount: number;
  chipsPerBuyIn: number;
  status: 'pending' | 'active' | 'finished';
  createdAt: string;
  finishedAt: string | null;
  players: GamePlayer[];
}

export interface GamePlayer {
  id: string;
  gameId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  totalBuyIns: number;
  totalMoneyIn: number;
  moneyPaid: boolean;
  chipsOut: number | null;
  cashOut: number | null;
  exitedAt: string | null;
}

export interface CreateGameData {
  name?: string;
  buyInAmount: number;
  chipsPerBuyIn?: number;
  playerEmails?: string[];
}

export interface AddPlayerData {
  name?: string;
  email?: string;
}

export interface FinishGamePlayerData {
  playerId: string;
  chipsOut: number;
  moneyPaid: boolean;
}

export const gamesApi = {
  getAll: () => api.get<Game[]>('/games').then((res) => res.data),

  getActive: () => api.get<Game[]>('/games?status=active').then((res) => res.data),

  getById: (id: string) => api.get<Game>(`/games/${id}`).then((res) => res.data),

  create: (data: CreateGameData) => api.post<Game>('/games', data).then((res) => res.data),

  start: (id: string) => api.post<Game>(`/games/${id}/start`).then((res) => res.data),

  finish: (id: string, playerData?: FinishGamePlayerData[]) =>
    api.post<Game>(`/games/${id}/finish`, { players: playerData }).then((res) => res.data),

  addPlayer: (gameId: string, data: AddPlayerData) =>
    api.post<GamePlayer>(`/games/${gameId}/players`, data).then((res) => res.data),

  removePlayer: (gameId: string, playerId: string) =>
    api.delete(`/games/${gameId}/players/${playerId}`),

  buyIn: (gameId: string, playerId: string) =>
    api.post<GamePlayer>(`/games/${gameId}/players/${playerId}/buyin`).then((res) => res.data),

  cashOut: (gameId: string, playerId: string, chipsOut: number) =>
    api.post<GamePlayer>(`/games/${gameId}/players/${playerId}/cashout`, { chipsOut }).then((res) => res.data),

  markPaid: (gameId: string, playerId: string, paid: boolean) =>
    api.patch<GamePlayer>(`/games/${gameId}/players/${playerId}`, { moneyPaid: paid }).then((res) => res.data),
};
