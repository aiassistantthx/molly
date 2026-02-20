import { create } from 'zustand';
import { User } from 'firebase/auth';
import { onAuthChange, signOut as firebaseSignOut } from '../lib/firebase';
import { usersApi, User as ApiUser } from '../api/users';

interface AuthState {
  firebaseUser: User | null;
  user: ApiUser | null;
  loading: boolean;
  initialized: boolean;
  setFirebaseUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  user: null,
  loading: true,
  initialized: false,

  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),

  fetchUser: async () => {
    try {
      const user = await usersApi.getMe();
      set({ user });
    } catch {
      set({ user: null });
    }
  },

  signOut: async () => {
    await firebaseSignOut();
    set({ firebaseUser: null, user: null });
  },

  initialize: () => {
    set({ initialized: true });
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      set({ firebaseUser, loading: true });
      if (firebaseUser) {
        await get().fetchUser();
      } else {
        set({ user: null });
      }
      set({ loading: false });
    });
    return unsubscribe;
  },
}));
