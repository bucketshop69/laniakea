import { Keypair, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';

// For the demo, we'll assume that the private key is provided in a different way
// since we can't read files directly in the browser

/**
 * Signs a transaction using a provided keypair
 */
export const signTransactionWithKeypair = (transaction: Transaction, keypair: Keypair): Transaction => {
  transaction.partialSign(keypair);
  return transaction;
};

/**
 * Creates a keypair from a base58 encoded private key string
 */
export const createKeypairFromBase58 = (base58PrivateKey: string): Keypair => {
  const privateKeyBytes = bs58.decode(base58PrivateKey);
  return Keypair.fromSecretKey(privateKeyBytes);
};

/**
 * Creates a keypair from a hex encoded private key string
 */
export const createKeypairFromHex = (hexPrivateKey: string): Keypair => {
  const privateKeyBytes = Uint8Array.from(Buffer.from(hexPrivateKey, 'hex'));
  return Keypair.fromSecretKey(privateKeyBytes);
};