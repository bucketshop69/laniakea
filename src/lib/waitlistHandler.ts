import { useWaitlistStore } from '@/store/waitlistStore';

// This function should be called from components where wallet context is available
export const handleWaitlistAction = (action: string, walletAddress: string | null): void => {
  const { isWaitlistActive, openWaitlistModal } = useWaitlistStore.getState();
  
  if (isWaitlistActive) {
    openWaitlistModal(walletAddress);
  } else {
    console.log(`${action} functionality is available.`);
    // Normal action execution would go here
  }
};