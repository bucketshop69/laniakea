import { create } from 'zustand';
import { IS_WAITLIST_ENABLED } from '@/constants/waitlist';

interface WaitlistState {
  isWaitlistActive: boolean;
  isModalOpen: boolean;
  userWalletAddress: string | null;
  setIsWaitlistActive: (active: boolean) => void;
  openWaitlistModal: (walletAddress: string | null) => void;
  closeWaitlistModal: () => void;
  setUserWalletAddress: (address: string | null) => void;
}

export const useWaitlistStore = create<WaitlistState>((set) => ({
  isWaitlistActive: IS_WAITLIST_ENABLED, // Use the constant to set initial state
  isModalOpen: false,
  userWalletAddress: null,
  setIsWaitlistActive: (active) => set({ isWaitlistActive: active }),
  openWaitlistModal: (walletAddress) => set({ isModalOpen: true, userWalletAddress: walletAddress }),
  closeWaitlistModal: () => set({ isModalOpen: false }),
  setUserWalletAddress: (address) => set({ userWalletAddress: address }),
}));