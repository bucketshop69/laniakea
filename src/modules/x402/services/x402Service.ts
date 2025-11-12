import axios from 'axios';
import {
  Connection,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
  PublicKey,
  TransactionInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import {
  X402PaymentRequirement,
  X402VerificationResponse,
  X402SettlementResponse,
  PaymentConfig,
  X402PaymentInstructionRequest,
  X402PaymentInstructionResponse
} from '../types';


// Service for x402 payment discovery
export class X402PaymentService {
  private facilitatorUrl: string;
  private apiEndpoint: string;
  private connection: Connection;

  constructor(config: PaymentConfig) {
    this.facilitatorUrl = config.facilitatorUrl;
    this.apiEndpoint = config.apiEndpoint;
    this.connection = new Connection('https://api.devnet.solana.com'); // Use appropriate RPC for devnet
  }

  /**
   * Discover payment requirements from the API
   */
  async discoverPaymentRequirements(endpoint: string, walletAddress?: string): Promise<X402PaymentRequirement | null> {
    try {
      // Construct URL with wallet address query param if provided
      const url = walletAddress
        ? `${this.apiEndpoint}${endpoint}?wallet_address=${walletAddress}`
        : `${this.apiEndpoint}${endpoint}`;

      const response = await axios.get(url, {
        validateStatus: function (status) {
          // Accept both 200 (success) and 402 (payment required) responses
          return status === 200 || status === 402 || status === 422;
        },
        headers: {
          'Accept': 'application/json'
        }
      });

      // Check if the response has x402 payment requirements (status 402)
      if (response.status === 402 && response.data.x402) {
        return response.data as X402PaymentRequirement;
      }

      // If it's a 200 response but has x402 data, it may be an error response
      if (response.data.x402) {
        return response.data as X402PaymentRequirement;
      }

      return null;
    } catch (error) {
      console.error('Error discovering payment requirements:', error);
      throw error;
    }
  }

  /**
   * Prepares the transaction with the fee payment instruction from Kora.
   * This method modifies the transaction by adding the payment instruction
   * and setting the fee payer to the Kora signer.
   * @param transaction The original transaction
   * @param userPublicKey The user's public key
   * @param feeToken The mint address of the token to pay fees in (e.g., USDC)
   * @returns The modified transaction ready to be signed by the user.
   */
  async prepareTransactionWithFee(
    transaction: Transaction,
    userPublicKey: PublicKey,
    feeToken: string
  ): Promise<Transaction> {
    try {
      // IMPORTANT: Ensure transaction has a fresh blockhash before sending to Kora
      // Kora needs to simulate the transaction, which requires a valid recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      console.log('✅ Set fresh blockhash for Kora simulation');

      const serializedTx = transaction.serialize({ requireAllSignatures: false });
      const base64Tx = Buffer.from(serializedTx).toString('base64');

      console.log('Calling facilitator /get-payment-instruction endpoint...');
      const response = await axios.post(`${this.facilitatorUrl}/get-payment-instruction`, {
        transaction: base64Tx,
        fee_token: feeToken,
        source_wallet: userPublicKey.toBase58()
      });

      console.log('Payment instruction response:', response.data);

      if (response.data.payment_instruction) {
        const paymentIx = response.data.payment_instruction;

        console.log('Payment instruction details:', paymentIx);

        const parseRole = (role: number) => ({
          isSigner: role === 2 || role === 3,
          isWritable: role === 1 || role === 3
        });

        const instruction = new TransactionInstruction({
          programId: new PublicKey(paymentIx.programAddress),
          keys: paymentIx.accounts.map((account: any) => ({
            pubkey: new PublicKey(account.address),
            ...parseRole(account.role)
          })),
          data: Buffer.from(Object.values(paymentIx.data))
        });

        console.log('✅ Adding Kora fee payment instruction to transaction');
        transaction.add(instruction);

        const { blockhash: finalBlockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = finalBlockhash;

        const koraSignerKey = new PublicKey(response.data.signer_address);
        transaction.feePayer = koraSignerKey;
        console.log('✅ Set Kora as fee payer:', response.data.signer_address);
      } else {
        console.error('❌ No payment instruction in response');
      }
    } catch (error) {
      console.error('❌ Error getting payment instruction:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw new Error('Failed to get Kora payment instruction - transaction cannot proceed');
    }

    return transaction;
  }

  /**
   * Submit a transaction for settlement to the facilitator using the new Kora flow.
   * @param transaction The Solana transaction to settle
   * @returns Settlement response from the facilitator
   */
  async submitTransaction(
    transaction: Transaction,
  ): Promise<X402SettlementResponse> {
    try {
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

      const response = await axios.post(`${this.facilitatorUrl}/settle`, {
        transaction: base64Transaction,
      });

      return response.data as X402SettlementResponse;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw error;
    }
  }

  /**
   * Build a payment transaction with splits using SPL Token transfers (USDC)
   * Creates token transfer instructions for the specified fee token
   * Automatically creates recipient token accounts if they don't exist
   * Adds Kora fee payment instruction for gasless transactions
   */
  async buildPaymentTransaction(
    userPublicKey: any,
    paymentRequirement: X402PaymentRequirement
  ): Promise<Transaction> {
    try {
      // STEP 1: Get Kora's signer public key FIRST
      console.log('🔑 Getting Kora signer public key...');
      const koraSignerResponse = await axios.get(`${this.facilitatorUrl}/get-kora-signer`);
      const koraSignerKey = new PublicKey(koraSignerResponse.data.signer_address);
      console.log('✅ Kora signer:', koraSignerKey.toBase58());

      // STEP 2: Validate user has sufficient balance BEFORE building transaction
      const splits = paymentRequirement.x402.payment_splits;
      const totalAmount = paymentRequirement.x402.required_amount;
      const feeTokenMint = new PublicKey(paymentRequirement.x402.supported_tokens[0]);

      console.log('💰 Checking user balance...');
      const userTokenAccount = await getAssociatedTokenAddress(
        feeTokenMint,
        userPublicKey
      );

      let userBalance = 0;
      try {
        const accountInfo = await getAccount(this.connection, userTokenAccount);
        userBalance = Number(accountInfo.amount);
        console.log(`✅ User balance: ${userBalance / 1e6} USDC (required: ${totalAmount / 1e6} USDC)`);
      } catch (error) {
        console.error('❌ User token account not found or has 0 balance');
        throw new Error(`Insufficient balance: You need ${totalAmount / 1e6} USDC but your token account was not found. Please ensure you have USDC on Solana Devnet.`);
      }

      if (userBalance < totalAmount) {
        const balanceInTokens = userBalance / 1e6;
        const requiredInTokens = totalAmount / 1e6;
        throw new Error(`Insufficient balance: You have ${balanceInTokens.toFixed(2)} USDC but need ${requiredInTokens.toFixed(2)} USDC`);
      }

      // STEP 3: Build transaction with payment splits
      const transaction = new Transaction();

      // userTokenAccount already defined above during balance check
      const createdATAs = new Set<string>();

      for (const split of splits) {
        const recipientPublicKey = new PublicKey(split.recipient);
        const amount = Math.floor((totalAmount * split.percentage) / 100);

        const recipientTokenAccount = await getAssociatedTokenAddress(
          feeTokenMint,
          recipientPublicKey
        );

        const ataKey = recipientTokenAccount.toBase58();

        if (!createdATAs.has(ataKey)) {
          try {
            await getAccount(this.connection, recipientTokenAccount);
            console.log(`✓ Token account exists for ${split.recipient}`);
          } catch (error) {
            // Token account doesn't exist - throw error asking user to create it
            console.error(`❌ Token account does not exist for recipient ${split.recipient}`);
            throw new Error(
              `Recipient ${split.recipient} does not have a USDC token account. ` +
              `Please ensure all recipients have USDC accounts on Solana Devnet before making payment.`
            );
          }
        }

        const transferInstruction = createTransferInstruction(
          userTokenAccount,
          recipientTokenAccount,
          userPublicKey,
          amount
        );

        transaction.add(transferInstruction);
      }

      // Add compute budget instructions to match what final transaction will have
      // This ensures Kora estimates fees correctly
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 })
      );
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 })
      );
      console.log('✅ Added compute budget instructions for accurate fee estimation');

      // STEP 3: Set Kora as fee payer and get blockhash BEFORE getting payment instruction
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = koraSignerKey;
      console.log('✅ Set Kora as fee payer (before getting payment instruction)');

      // STEP 4: Get payment instruction from Kora
      console.log('📋 Requesting Kora payment instruction...');
      let paymentInstruction;
      try {
        const serializedTx = transaction.serialize({ requireAllSignatures: false });
        const base64Tx = Buffer.from(serializedTx).toString('base64');

        const response = await axios.post(`${this.facilitatorUrl}/get-payment-instruction`, {
          transaction: base64Tx,
          fee_token: feeTokenMint.toBase58(),
          source_wallet: userPublicKey.toBase58()
        });

        console.log('Payment instruction response:', response.data);

        if (response.data.payment_instruction) {
          const paymentIx = response.data.payment_instruction;
          console.log('Payment instruction details:', paymentIx);

          const parseRole = (role: number) => ({
            isSigner: role === 2 || role === 3,
            isWritable: role === 1 || role === 3
          });

          paymentInstruction = new TransactionInstruction({
            programId: new PublicKey(paymentIx.programAddress),
            keys: paymentIx.accounts.map((account: any) => ({
              pubkey: new PublicKey(account.address),
              ...parseRole(account.role)
            })),
            data: Buffer.from(Object.values(paymentIx.data))
          });

          console.log('✅ Received Kora payment instruction');
        } else {
          console.error('❌ No payment instruction in response');
          throw new Error('No payment instruction in response');
        }
      } catch (error) {
        console.error('❌ Error getting payment instruction:', error);
        if (axios.isAxiosError(error)) {
          console.error('Response data:', error.response?.data);
          console.error('Response status:', error.response?.status);
        }
        throw new Error('Failed to get Kora payment instruction - transaction cannot proceed');
      }

      // STEP 5: Build FINAL transaction with payment instruction
      // According to Kora docs, we should build a NEW transaction with all instructions
      console.log('🔨 Building final transaction with payment instruction...');
      const finalTransaction = new Transaction();

      // Add all original instructions
      transaction.instructions.forEach(ix => finalTransaction.add(ix));

      // Add payment instruction
      finalTransaction.add(paymentInstruction);

      // Get FRESH blockhash for final transaction
      const { blockhash: finalBlockhash } = await this.connection.getLatestBlockhash();
      finalTransaction.recentBlockhash = finalBlockhash;
      finalTransaction.feePayer = koraSignerKey;

      console.log('✅ Final transaction built with payment instruction');
      console.log('✅ Transaction ready for user to sign (with Kora as fee payer)');

      return finalTransaction;
    } catch (error) {
      console.error('Error building payment transaction:', error);
      throw error;
    }
  }

  /**
   * Verify transaction with the facilitator
   */
  async verifyTransaction(transaction: Transaction): Promise<X402VerificationResponse> {
    try {
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

      const response = await axios.post(`${this.facilitatorUrl}/verify`, {
        transaction: base64Transaction
      });

      return response.data as X402VerificationResponse;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw error;
    }
  }

  /**
   * Settle transaction via the facilitator
   */
  async settleTransaction(
    transaction: Transaction,
    paymentSplits: Array<{ recipient: string; amount: number }>,
    payer: string
  ): Promise<X402SettlementResponse> {
    try {
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

      const response = await axios.post(`${this.facilitatorUrl}/settle`, {
        transaction: base64Transaction,
        payment_splits: paymentSplits,
        payer: payer
      });

      return response.data as X402SettlementResponse;
    } catch (error) {
      console.error('Error settling transaction:', error);
      throw error;
    }
  }
}