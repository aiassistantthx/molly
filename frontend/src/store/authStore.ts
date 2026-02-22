import { create } from 'zustand';
import { User } from 'firebase/auth';
import { onAuthChange, signOut as firebaseSignOut } from '../lib/firebase';
import { usersApi, User as ApiUser } from '../api/users';

// Check for direct login user
const getDirectUser = (): ApiUser | null => {
  const userStr = localStorage.getItem('directUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

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
    // Clear direct login
    localStorage.removeItem('directToken');
    localStorage.removeItem('directUser');
    // Clear Firebase
    await firebaseSignOut();
    set({ firebaseUser: null, user: null });
  },

  initialize: () => {
    set({ initialized: true });

    // Check for direct login first
    const directUser = getDirectUser();
    if (directUser) {
      set({ user: directUser, loading: false });
      return () => {};
    }

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
