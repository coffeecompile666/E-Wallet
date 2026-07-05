'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import LandingPage from '@/component/landingPage';
import Dashboard from '@/component/dashboard';
import LoginDialog from '@/component/loginDialog';

export default function Home() {
  const user = useAppStore((state) => state.user);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Or a simple skeleton screen
  }

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
