import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../ui';

export const Header = () => {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-sm border-b border-gold/10">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">♠</span>
          <span className="font-bold text-gold text-lg">Molly</span>
        </Link>

        {user && (
          <Link to="/profile">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
          </Link>
        )}
      </div>
    </header>
  );
};
