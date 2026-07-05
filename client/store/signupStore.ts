import { create } from 'zustand';

export interface SignupState {
  step: 1 | 2 | 3 | 4;
  email: string;
  otpId?: number;
  otp: string;
  isLoading: boolean;
  
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setEmail: (email: string) => void;
  setOtpId: (otpId: number) => void;
  setOtp: (otp: string) => void;
  setLoading: (loading: boolean) => void;
  resetSignup: () => void;
}

export const useSignupStore = create<SignupState>((set) => ({
  step: 1,
  email: '',
  otpId: undefined,
  otp: '',
  isLoading: false,

  setStep: (step) => set({ step }),
  setEmail: (email) => set({ email }),
  setOtpId: (otpId) => set({ otpId }),
  setOtp: (otp) => set({ otp }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  resetSignup: () => set({
    step: 1,
    email: '',
    otpId: undefined,
    otp: '',
    isLoading: false,
  }),
}));
