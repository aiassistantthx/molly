import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const Layout = ({ children, hideNav = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-20">
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
};
