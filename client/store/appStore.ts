import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReactElement } from 'react';
import config from '@/config/config';

type User = {
  id: number;
  email: string;
  name: string;
  balance: number;
  walletId: number;
  hasTxPin: boolean;
};

type AppState = {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  appDialog?: ReactElement;
  setAppDialog: (appDialog?: ReactElement) => void;
  alerts?: ReactElement[];
  addAlert: (alert: ReactElement) => void;
  user?: User;
  setUser: (user: AppState['user']) => void;
  clearUser: () => void;
  setAlerts: (alerts: ReactElement[]) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, getState) => ({
      isLoading: false,

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setUser: (user) => {
        set({ user });
      },

      clearUser: () => {
        set({ user: undefined });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
        }
      },

      setAppDialog: (appDialog) => {
        set({ appDialog });
      },

      addAlert: (alert) => {
        const old = getState().alerts || [];
        const updated = [...old, alert].slice(-config.alert.maxDisplayNumber);
        set({ alerts: updated });

        setTimeout(() => {
          const old = getState().alerts || [];
          const updated = old.filter((_alert) => _alert !== alert);
          set({ alerts: updated });
        }, config.alert.clearDelayMillisecond);
      },

      setAlerts: (alerts) => {
        const updated = alerts.slice(-config.alert.maxDisplayNumber);
        set({ alerts: updated });
      },
    }),
    {
      name: 'app-storage',
      // Only persist the user state, ignore UI-only states like dialogs, loaders, and alerts
      partialize: (state) => ({ user: state.user }),
    }
  )
);
