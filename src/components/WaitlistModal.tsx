import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWaitlistStore } from '@/store/waitlistStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { addWalletToWaitlist } from '@/services/waitlistService';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const WaitlistModal = () => {
  const { publicKey } = useWallet();
  const { isModalOpen, closeWaitlistModal, userWalletAddress } = useWaitlistStore();
  const [walletAddress, setWalletAddress] = useState(userWalletAddress || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync wallet address state when userWalletAddress prop changes or wallet connects
  useEffect(() => {
    if (isModalOpen) {
      // Use userWalletAddress from store first, then connected wallet, then fallback to empty
      setWalletAddress(userWalletAddress || publicKey?.toString() || '');
    }
  }, [userWalletAddress, publicKey, isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    // Validate wallet address
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      setIsSubmitting(false);
      return;
    }

    try {
      // Add wallet to waitlist via service
      const result = await addWalletToWaitlist(walletAddress);
      
      if (result.success) {
        setSuccess(true);
        // Don't close the modal immediately, let user see the success message
        setTimeout(() => {
          closeWaitlistModal();
          setWalletAddress(''); // Clear the wallet address after successful submission
        }, 3000); // Close after 3 seconds to show success message
      } else {
        setError(result.message || 'Failed to join waitlist. Please try again.');
      }
    } catch (err) {
      setError('Failed to join waitlist. Please try again.');
      console.error('Waitlist submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={closeWaitlistModal} />
      <div className="relative w-full max-w-sm rounded-lg border border-border/40 bg-card p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Join the Waitlist</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The investment features are currently on a waitlist. Enter your wallet address below to be notified when it's your turn.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!success ? (
              <>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Wallet Address</label>
                  <Input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder={publicKey?.toString() || 'Enter your wallet address'}
                    className="h-9"
                  />
                  {!walletAddress && publicKey && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Connected wallet: {publicKey.toString()}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={closeWaitlistModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
                  </Button>
                </div>
              </>
            ) : (
              // Success state
              <div className="flex flex-col items-center py-6">
                <div className="rounded-full bg-green-500/10 p-3 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Success!</h4>
                <p className="text-center text-muted-foreground mb-6">
                  You've been added to the waitlist. We'll notify you when it's your turn.
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  The modal will close automatically in a moment.
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};