import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';

// Check if we're in demo mode (no real Firebase config)
const isDemoMode = import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key' ||
                   !import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '0',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo',
};

let auth: Auth;
let googleProvider: GoogleAuthProvider;

if (!isDemoMode) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

// Demo user for development
const demoUser = {
  uid: 'demo-user-123',
  email: 'demo@example.com',
  displayName: 'Demo User',
  photoURL: null,
  getIdToken: async () => 'demo-token',
} as unknown as User;

export { auth };

export const signInWithGoogle = async () => {
  if (isDemoMode) {
    localStorage.setItem('demoLoggedIn', 'true');
    return demoUser;
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signInWithEmail = async (email: string, password: string) => {
  if (isDemoMode) {
    localStorage.setItem('demoLoggedIn', 'true');
    localStorage.setItem('demoEmail', email);
    return demoUser;
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    }
    throw error;
  }
};

export const sendMagicLink = async (email: string) => {
  if (isDemoMode) {
    localStorage.setItem('demoLoggedIn', 'true');
    localStorage.setItem('demoEmail', email);
    window.location.href = '/';
    return;
  }
  const actionCodeSettings = {
    url: `${window.location.origin}/auth/verify`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
};

export const completeMagicLinkSignIn = async () => {
  if (isDemoMode) {
    return demoUser;
  }
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Please provide your email for confirmation');
    }
    if (email) {
      const result = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      return result.user;
    }
  }
  return null;
};

export const signOut = async () => {
  if (isDemoMode) {
    localStorage.removeItem('demoLoggedIn');
    localStorage.removeItem('demoEmail');
    return;
  }
  return firebaseSignOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (isDemoMode) {
    // Check demo login state
    const isLoggedIn = localStorage.getItem('demoLoggedIn') === 'true';
    setTimeout(() => callback(isLoggedIn ? demoUser : null), 100);
    // Return unsubscribe function
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const getIdToken = async () => {
  if (isDemoMode) {
    const isLoggedIn = localStorage.getItem('demoLoggedIn') === 'true';
    return isLoggedIn ? 'demo-token' : null;
  }
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
};

export { isDemoMode };
