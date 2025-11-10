import chalk from 'chalk';
import * as readline from 'readline';

// Simple UI interface for the x402 payment flow
export class PaymentUI {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Display the main menu
   */
  showMainMenu(): Promise<string> {
    return new Promise((resolve) => {
      console.log(chalk.blue('\n--- x402 Payment Client Demo ---'));
      console.log(chalk.yellow('1. Check payment requirements for endpoint'));
      console.log(chalk.yellow('2. Execute payment flow'));
      console.log(chalk.yellow('3. Check infrastructure status'));
      console.log(chalk.yellow('4. Exit'));
      
      this.rl.question(chalk.green('Select an option (1-4): '), (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Prompt user for endpoint
   */
  promptForEndpoint(): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(chalk.green('Enter API endpoint to access (e.g., /api/wallet_overview): '), (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Prompt user for wallet address (for demo purposes)
   */
  promptForWalletAddress(): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(chalk.green('Enter wallet address (for demo): '), (answer) => {
        resolve(answer.trim() || 'DemoWallet123');
      });
    });
  }

  /**
   * Display payment requirements
   */
  displayPaymentRequirements(requirements: any): void {
    console.log(chalk.blue('\n--- Payment Requirements ---'));
    if (requirements) {
      console.log(chalk.yellow(`Message: ${requirements.x402.message}`));
      console.log(chalk.yellow(`Required amount: ${requirements.x402.required_amount}`));
      console.log(chalk.yellow(`Supported tokens: ${requirements.x402.supported_tokens.join(', ')}`));
      console.log(chalk.yellow('Payment splits:'));
      requirements.x402.payment_splits.forEach((split: any, index: number) => {
        console.log(chalk.yellow(`  ${index + 1}. ${split.percentage}% to ${split.recipient}`));
      });
    } else {
      console.log(chalk.green('No payment required for this endpoint'));
    }
  }

  /**
   * Display status updates during payment flow
   */
  displayStatusUpdate(status: string): void {
    console.log(chalk.blue(`→ ${status}`));
  }

  /**
   * Display infrastructure status
   */
  displayInfrastructureStatus(status: { 
    apiAvailable: boolean; 
    facilitatorAvailable: boolean; 
    rpcAvailable: boolean 
  }): void {
    console.log(chalk.blue('\n--- Infrastructure Status ---'));
    console.log(status.apiAvailable ? 
      chalk.green('✓ API: Available') : 
      chalk.red('✗ API: Unavailable'));
    console.log(status.facilitatorAvailable ? 
      chalk.green('✓ Facilitator: Available') : 
      chalk.red('✗ Facilitator: Unavailable'));
    console.log(status.rpcAvailable ? 
      chalk.green('✓ RPC: Available') : 
      chalk.red('✗ RPC: Unavailable'));
  }

  /**
   * Display result of payment flow
   */
  displayPaymentResult(result: any, error?: Error): void {
    if (error) {
      console.log(chalk.red('\n--- Payment Failed ---'));
      console.log(chalk.red(`Error: ${error.message}`));
    } else {
      console.log(chalk.green('\n--- Payment Successful ---'));
      console.log(chalk.green('Successfully accessed protected resource!'));
      console.log(chalk.blue(`Signature: ${result.signature || 'N/A'}`));
    }
  }

  /**
   * Close the UI interface
   */
  close(): void {
    this.rl.close();
  }

  /**
   * Simple prompt for user confirmation
   */
  confirmAction(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(chalk.yellow(`${message} (y/N): `), (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }
}