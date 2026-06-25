import { useAppStore } from '@/store/appStore';

export const addAlert = useAppStore.getState().addAlert;
