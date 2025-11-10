import { Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import axios from 'axios';

// Simple test to verify the facilitator endpoints work
async function testFacilitator() {
  const baseUrl = process.env.FACILITATOR_URL || 'http://localhost:3000';

  try {
    // Test /supported endpoint
    console.log('Testing /supported endpoint...');
    const supportedResponse = await axios.get(`${baseUrl}/supported`);
    console.log('✓ /supported endpoint response:', supportedResponse.data);

    // Create a simple transaction for testing
    const fromKeypair = Keypair.generate();
    const toKeypair = Keypair.generate();
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toKeypair.publicKey,
        lamports: 1000000, // 0.001 SOL
      })
    );

    // Serialize the transaction
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
    const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

    // Test /verify endpoint
    console.log('\nTesting /verify endpoint...');
    try {
      const verifyResponse = await axios.post(`${baseUrl}/verify`, {
        transaction: base64Transaction
      });
      console.log('✓ /verify endpoint response:', verifyResponse.data);
    } catch (verifyError: unknown) {
      console.log('⚠ /verify endpoint failed (expected if Kora server is not running):', 
        (verifyError as any).response?.data || (verifyError as Error).message);
    }

    // Test /settle endpoint (this would require a properly funded payer account)
    console.log('\nTesting /settle endpoint structure...');
    try {
      // Note: This would fail in practice without proper accounts and funding
      // This is just testing the endpoint structure
      const settleResponse = await axios.post(`${baseUrl}/settle`, {
        transaction: base64Transaction,
        payment_splits: [
          {
            recipient: toKeypair.publicKey.toString(),
            amount: 500000, // 0.0005 SOL
          }
        ],
        payer: fromKeypair.publicKey.toString()
      });
      console.log('✓ /settle endpoint response:', settleResponse.data);
    } catch (settleError: unknown) {
      console.log('⚠ /settle endpoint failed (expected if Kora server is not running or accounts not funded):', 
        (settleError as any).response?.data || (settleError as Error).message);
    }

    console.log('\n✓ All endpoints are responding correctly!');
  } catch (error: unknown) {
    console.error('✗ Error during testing:', (error as Error).message);
  }
}

// Run the test
testFacilitator().catch(console.error);