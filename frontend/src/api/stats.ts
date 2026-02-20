import api from './client';

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalProfit: number;
  gamesPlayed: number;
  winRate: number;
  averageProfit: number;
}

export interface GameHistory {
  gameId: string;
  gameName: string;
  date: string;
  buyIn: number;
  cashOut: number;
  profit: number;
}

export const statsApi = {
  getLeaderboard: (period?: 'all' | 'month' | 'year', scope?: 'global' | 'circle') => {
    const params = new URLSearchParams();
    if (period && period !== 'all') params.set('period', period);
    if (scope) params.set('scope', scope);
    const query = params.toString();
    return api.get<LeaderboardEntry[]>(`/stats/leaderboard${query ? `?${query}` : ''}`).then((res) => res.data);
  },

  getGameHistory: (userId?: string) =>
    api.get<GameHistory[]>(userId ? `/stats/history/${userId}` : '/stats/history').then((res) => res.data),
};
