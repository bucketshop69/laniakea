import { KoraClient } from '@kora/sdk';
import { Transaction, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import bs58 from 'bs58';

/**
 * Service class to interact with the Kora RPC server
 */
export class KoraService {
  private client: KoraClient;
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.KORA_RPC_URL || 'http://localhost:8080';
    this.apiKey = process.env.KORA_API_KEY || 'kora_facilitator_api_key_example';
    this.client = new KoraClient({
      rpcUrl: this.apiUrl,
      apiKey: this.apiKey,
    });
  }

  /**
   * Signs a transaction using the Kora RPC server
   * @param transaction The Solana transaction to sign
   * @returns The signed transaction
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      // Convert the transaction to wire format
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

      // Call the Kora RPC service to sign the transaction
      const response = await this.client.signTransaction({
        transaction: base64Transaction
      });
      
      // Deserialize the response back to a Transaction object
      const signedTransactionBuffer = Buffer.from(response.signed_transaction, 'base64');
      return Transaction.from(signedTransactionBuffer);
    } catch (error) {
      console.error('Error signing transaction via Kora:', error);
      throw new Error(`Failed to sign transaction via Kora: ${error}`);
    }
  }

  /**
   * Signs and sends a transaction using the Kora RPC server
   * @param transaction The Solana transaction to sign and send
   * @returns The transaction signature
   */
  async signAndSendTransaction(transaction: Transaction): Promise<string> {
    try {
      // Convert the transaction to wire format
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

      // Use signAndSendTransaction to sign and send the transaction
      const response = await this.client.signAndSendTransaction({
        transaction: base64Transaction
      });
      
      // Extract signature from the signed transaction
      const signedTransactionBuffer = Buffer.from(response.signed_transaction, 'base64');
      const signedTx = Transaction.from(signedTransactionBuffer);

      // Get the signature from the signed transaction and encode as base58
      if (signedTx.signatures.length > 0) {
        const firstSig = signedTx.signatures[0];
        if (firstSig && firstSig.signature) {
          // Convert signature buffer to base58 string
          return bs58.encode(firstSig.signature);
        }
      }
      throw new Error('No signature found in the signed transaction');
    } catch (error) {
      console.error('Error signing and sending transaction via Kora:', error);
      throw new Error(`Failed to sign and send transaction via Kora: ${error}`);
    }
  }

  /**
   * Gets supported tokens from the Kora server
   * @returns Array of supported token mint addresses
   */
  async getSupportedTokens(): Promise<string[]> {
    try {
      const response = await this.client.getSupportedTokens();
      return response.tokens;
    } catch (error) {
      console.error('Error getting supported tokens from Kora:', error);
      throw new Error(`Failed to get supported tokens from Kora: ${error}`);
    }
  }

  /**
   * Estimates transaction fee for a given transaction
   * @param transaction The Solana transaction to estimate fees for
   * @returns Fee estimation details
   */
  async estimateTransactionFee(transaction: Transaction) {
    try {
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

      // Note: estimateTransactionFee requires a fee_token parameter
      // For now, we'll use USDC devnet as the default token
      const response = await this.client.estimateTransactionFee({
        transaction: base64Transaction,
        fee_token: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' // USDC devnet
      });
      return response;
    } catch (error) {
      console.error('Error estimating transaction fee via Kora:', error);
      throw new Error(`Failed to estimate transaction fee via Kora: ${error}`);
    }
  }

  /**
   * Gets the payment instruction needed for Kora to co-sign the transaction
   * @param transaction The base64-encoded transaction
   * @param feeToken The token to use for fee payment
   * @param sourceWallet The wallet that will pay the fee
   * @returns Payment instruction details
   */
  async getPaymentInstruction(transaction: string, feeToken: string, sourceWallet: string) {
    try {
      const response = await this.client.getPaymentInstruction({
        transaction,
        fee_token: feeToken,
        source_wallet: sourceWallet
      });
      return response;
    } catch (error) {
      console.error('Error getting payment instruction via Kora:', error);
      throw new Error(`Failed to get payment instruction via Kora: ${error}`);
    }
  }

  /**
   * Gets the Kora signer's public key by reading the private key from .env
   * @returns The Kora signer's public key address
   */
  async getKoraSignerPublicKey(): Promise<string> {
    try {
      // Read the private key from the kora .env file
      const koraEnvPath = path.join(process.cwd(), '../kora/.env');

      if (!fs.existsSync(koraEnvPath)) {
        throw new Error(`Kora .env file not found at ${koraEnvPath}`);
      }

      const envContent = fs.readFileSync(koraEnvPath, 'utf-8');
      const match = envContent.match(/KORA_SIGNER_PRIVATE_KEY="?\[([^\]]+)\]"?/);

      if (!match) {
        throw new Error('KORA_SIGNER_PRIVATE_KEY not found in kora/.env');
      }

      const privateKeyArray = JSON.parse(`[${match[1]}]`);
      const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));

      return keypair.publicKey.toBase58();
    } catch (error) {
      console.error('Error getting Kora signer public key:', error);
      throw new Error(`Failed to get Kora signer public key: ${error}`);
    }
  }
}