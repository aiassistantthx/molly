import api from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
}

export interface UserStats {
  totalGames: number;
  totalProfit: number;
  totalBuyIns: number;
  totalCashOuts: number;
  winRate: number;
  averageProfit: number;
  biggestWin: number;
  biggestLoss: number;
}

export const usersApi = {
  getMe: () => api.get<User>('/users/me').then((res) => res.data),

  updateMe: (data: Partial<Pick<User, 'name' | 'avatarUrl'>>) =>
    api.patch<User>('/users/me', data).then((res) => res.data),

  search: (query: string) =>
    api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`).then((res) => res.data),

  getStats: (userId?: string) =>
    api.get<UserStats>(userId ? `/users/${userId}/stats` : '/users/me/stats').then((res) => res.data),
};
