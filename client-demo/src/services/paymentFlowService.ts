import { 
  PublicKey, 
  Transaction,
  Connection,
} from '@solana/web3.js';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { 
  PaymentDiscoveryService 
} from './paymentDiscoveryService';
import {
  TransactionCreationService
} from './transactionCreationService';
import {
  KoraIntegrationService
} from './koraIntegrationService';
import { X402PaymentRequirement } from '../types/x402';

/**
 * Service class to handle the complete x402 payment flow with wallet integration
 */
export class PaymentFlowService {
  private paymentDiscoveryService: PaymentDiscoveryService;
  private transactionCreationService: TransactionCreationService;
  private koraIntegrationService: KoraIntegrationService;
  private connection: Connection;

  constructor(
    apiEndpoint: string,
    facilitatorUrl: string,
    rpcEndpoint: string = 'https://api.devnet.solana.com'
  ) {
    this.paymentDiscoveryService = new PaymentDiscoveryService(apiEndpoint);
    this.koraIntegrationService = new KoraIntegrationService(facilitatorUrl);
    this.transactionCreationService = new TransactionCreationService(rpcEndpoint);
    this.connection = new Connection(rpcEndpoint, 'confirmed');
  }

  /**
   * Execute the complete payment flow to access a protected resource
   * @param endpoint The protected API endpoint to access
   * @param userPublicKey The user's public key from their wallet
   * @param onStatusUpdate Callback to update UI with status
   */
  async executePaymentFlow(
    endpoint: string,
    userPublicKey: PublicKey | null,
    onStatusUpdate?: (status: string) => void
  ): Promise<any> {
    try {
      // Check if wallet is connected
      if (!userPublicKey) {
        throw new WalletNotConnectedError('Wallet not connected');
      }

      onStatusUpdate?.('Discovering payment requirements...');
      
      // Step 1: Discover payment requirements from the API
      const paymentReq = await this.paymentDiscoveryService.discoverPaymentRequirements(endpoint);
      
      if (!paymentReq) {
        // No payment required, try to access the endpoint directly
        onStatusUpdate?.('No payment required, accessing resource directly...');
        return await this.accessResourceDirectly(endpoint);
      }

      onStatusUpdate?.('Building payment transaction...');
      
      // Step 2: Get the latest blockhash for the transaction
      const latestBlockhash = await this.connection.getLatestBlockhash();
      
      // Step 3: Build the payment transaction with splits
      const transaction = await this.transactionCreationService.buildPaymentTransaction(
        userPublicKey,
        paymentReq,
        latestBlockhash
      );

      onStatusUpdate?.('Verifying transaction with facilitator...');
      
      // Step 4: Verify the transaction with the facilitator
      const verificationResult = await this.koraIntegrationService.verifyTransaction(transaction);
      
      if (!verificationResult.success) {
        throw new Error(`Transaction verification failed: ${verificationResult.message}`);
      }

      onStatusUpdate?.('Processing payment with wallet...');
      
      // Step 5: In a real implementation, get user confirmation and sign the transaction
      // This is where wallet adapter integration would occur
      // const signedTransaction = await wallet.signTransaction(transaction);
      
      // For demo purposes, we'll simulate the signing process
      const paymentSplits = paymentReq.x402.payment_splits.map(split => ({
        recipient: split.recipient,
        amount: Math.floor((paymentReq.x402.required_amount * split.percentage) / 100)
      }));
      
      onStatusUpdate?.('Submitting payment to facilitator...');
      
      // Step 6: Submit the transaction for settlement
      const settlementResult = await this.koraIntegrationService.settleTransaction(
        transaction,
        paymentSplits,
        userPublicKey.toString()
      );

      if (!settlementResult.success) {
        throw new Error(`Transaction settlement failed: ${settlementResult.message}`);
      }

      onStatusUpdate?.('Payment successful, accessing protected resource...');
      
      // Step 7: Now that payment is confirmed, access the protected resource
      // In a real implementation, you might need to pass some proof of payment
      const resource = await this.accessResourceWithPaymentProof(
        endpoint, 
        settlementResult.signature
      );

      onStatusUpdate?.('Payment flow completed successfully!');
      return resource;

    } catch (error) {
      console.error('Payment flow failed:', error);
      onStatusUpdate?.(`Payment failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Access a resource directly without payment (when no payment is required)
   */
  private async accessResourceDirectly(endpoint: string) {
    // In a real implementation, this would make the actual API call
    console.log(`Accessing resource directly: ${endpoint}`);
    return { message: "Resource accessed without payment", endpoint };
  }

  /**
   * Access a resource with payment proof after successful payment
   */
  private async accessResourceWithPaymentProof(endpoint: string, signature: string) {
    // In a real implementation, this would make the actual API call
    // with the signature as proof of payment
    console.log(`Accessing resource with payment proof: ${endpoint}`);
    console.log(`Payment signature: ${signature}`);
    return { message: "Resource accessed with payment", endpoint, signature };
  }

  /**
   * Check if the payment infrastructure is available
   */
  async checkInfrastructureStatus(): Promise<{
    apiAvailable: boolean;
    facilitatorAvailable: boolean;
    rpcAvailable: boolean;
  }> {
    // Check if the facilitator is available
    const facilitatorAvailable = await this.koraIntegrationService.checkFacilitatorStatus();
    
    // Check if the RPC endpoint is available
    let rpcAvailable = false;
    try {
      await this.connection.getLatestBlockhash();
      rpcAvailable = true;
    } catch (error) {
      console.error('RPC endpoint not available:', error);
    }
    
    // For API availability, we'd need to check the specific endpoint
    // For now, we'll just return true as we'll discover this during the actual call
    return {
      apiAvailable: true,
      facilitatorAvailable,
      rpcAvailable
    };
  }
}