interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar = ({ src, name, size = 'md', className = '' }: AvatarProps) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gold/20 text-gold font-semibold flex items-center justify-center ${className}`}
    >
      {initials}
    </div>
  );
};
