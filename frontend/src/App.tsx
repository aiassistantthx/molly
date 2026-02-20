import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import {
  Login,
  AuthVerify,
  Home,
  CreateGame,
  Game,
  GameResult,
  Leaderboard,
  Profile,
} from './pages';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { firebaseUser, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { firebaseUser, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (firebaseUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { initialize, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      const unsubscribe = initialize();
      return () => unsubscribe();
    }
  }, [initialize, initialized]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/auth/verify" element={<AuthVerify />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-game"
          element={
            <ProtectedRoute>
              <CreateGame />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:id"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:id/results"
          element={
            <ProtectedRoute>
              <GameResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
