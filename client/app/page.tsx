'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import LandingPage from '@/component/landingPage';
import Dashboard from '@/component/dashboard';
import LoginDialog from '@/component/loginDialog';
import { getMe } from '@/api/auth';
import { getWalletMe } from '@/api/wallet';

export default function Home() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const clearUser = useAppStore((state) => state.clearUser);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      const loadSession = async () => {
        try {
          const [userRes, walletRes] = await Promise.all([
            getMe(),
            getWalletMe(),
          ]);

          setUser({
            id: userRes.data.id || (userRes.data as any).ID,
            email: userRes.data.Email,
            name: userRes.data.Name,
            balance: walletRes.data.Balance - walletRes.data.LockedAmount,
            walletId: walletRes.data.id || (walletRes.data as any).ID,
          });
        } catch (err) {
          console.error('Failed to load session:', err);
          clearUser();
        }
      };
      loadSession();
    }
  }, [setUser, clearUser]);

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
