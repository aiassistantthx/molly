import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-dark-card',
      elevated: 'bg-dark-card shadow-lg shadow-black/50',
      bordered: 'bg-dark-card border border-gold/20',
    };

    return (
      <div
        ref={ref}
        className={`rounded-xl p-4 ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
