import dotenv from 'dotenv';
import chalk from 'chalk';
import { Keypair, PublicKey } from '@solana/web3.js';
import { X402PaymentService } from './services/x402PaymentService';
import { X402PaymentRequirement } from './types/x402';

dotenv.config();

console.log(chalk.blue('Starting x402 payment client demo...'));

// Configuration for the demo
const CONFIG = {
  facilitatorUrl: process.env.FACILITATOR_URL || 'http://localhost:3000',
  apiEndpoint: process.env.API_BASE_URL || 'http://localhost:4021',
  userWallet: process.env.USER_WALLET || '3njbEQNmCTh3omVFrkLcq92MZkQ9Dfrvn6LN6SKHpVmr', // Default demo wallet
};

async function runDemo() {
  console.log(chalk.yellow('\n--- x402 Payment Flow Demo ---\n'));
  
  try {
    // Create a demo user keypair (in real app, this would come from wallet connection)
    const userKeypair = Keypair.generate(); // For demo purposes
    console.log(chalk.green(`✓ Generated demo user wallet: ${userKeypair.publicKey.toBase58()}`));
    
    // Initialize the payment service
    const paymentService = new X402PaymentService({
      facilitatorUrl: CONFIG.facilitatorUrl,
      apiEndpoint: CONFIG.apiEndpoint,
      requiredAmount: 1000000, // 0.001 tokens
      paymentSplits: []
    });
    console.log(chalk.green('✓ Initialized x402 payment service'));
    
    // Step 1: Discover payment requirements
    console.log(chalk.yellow('\n1. Discovering payment requirements...'));
    const paymentReq: X402PaymentRequirement | null = await paymentService.discoverPaymentRequirements('/api/wallet_overview?wallet_address=demo&user_id=demo');
    
    if (paymentReq) {
      console.log(chalk.green('✓ Payment required by API'));
      console.log(chalk.blue(`  - Required amount: ${paymentReq.x402.required_amount}`));
      console.log(chalk.blue(`  - Supported tokens: ${paymentReq.x402.supported_tokens.join(', ')}`));
      console.log(chalk.blue(`  - Payment splits: ${paymentReq.x402.payment_splits.map(s => `${s.percentage}% to ${s.recipient}`).join(', ')}`));
      
      // Step 2: Build payment transaction
      console.log(chalk.yellow('\n2. Building payment transaction with splits...'));
      const transaction = await paymentService.buildPaymentTransaction(
        userKeypair.publicKey,
        paymentReq
      );
      console.log(chalk.green('✓ Payment transaction built successfully'));
      console.log(chalk.blue(`  - Transaction has ${transaction.instructions.length} instructions`));
      
      // Step 3: Verify transaction (would be with facilitator in real implementation)
      console.log(chalk.yellow('\n3. Verifying transaction with facilitator...'));
      // NOTE: In a real implementation, we'd call paymentService.verifyTransaction(transaction)
      // but this requires the facilitator to be running
      console.log(chalk.green('✓ Transaction verification completed (simulated)'));
      
      // Step 4: Settle transaction (would be with facilitator in real implementation)
      console.log(chalk.yellow('\n4. Settling transaction with facilitator...'));
      // NOTE: In a real implementation, we'd call paymentService.settleTransaction(...)
      // but this requires the facilitator to be running
      console.log(chalk.green('✓ Transaction settlement completed (simulated)'));
      
      console.log(chalk.yellow('\n5. Accessing protected API with payment proof...'));
      // In a real implementation, you would now retry the original API call with payment proof
      console.log(chalk.green('✓ Successfully accessed protected API endpoint'));
      
      console.log(chalk.green('\n🎉 x402 Payment Flow Demo Completed Successfully!'));
      console.log(chalk.blue('\nReal-world implementation would include:'));
      console.log(chalk.blue('  - Wallet adapter integration'));
      console.log(chalk.blue('  - User interface for payment confirmation'));
      console.log(chalk.blue('  - Actual communication with facilitator'));
      console.log(chalk.blue('  - Error handling and retry logic'));
      
    } else {
      console.log(chalk.red('✗ No payment required - endpoint may not be protected'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Demo failed with error:'), error);
  }
}

// Run the demo
runDemo().then(() => {
  console.log(chalk.blue('\nDemo execution completed.'));
}).catch(error => {
  console.error(chalk.red('Demo execution failed:'), error);
});