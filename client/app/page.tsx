'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import LandingPage from '@/component/landingPage';
import Dashboard from '@/component/dashboard';
import LoginDialog from '@/component/loginDialog';

export default function Home() {
  const user = useAppStore((state) => state.user);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      {user ? (
        <Dashboard />
      ) : (
        <LandingPage onOpenLogin={() => setIsLoginOpen(true)} />
      )}
      
      <LoginDialog open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
