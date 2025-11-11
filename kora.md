What You'll Build
This guide walks you through implementing a complete x402 (HTTP 402 Payment Required) integration with Kora, Solana gasless signing infrastructure. By the end, you'll have a working system where:

APIs can charge micropayments for access using the x402 protocol
Users pay in USDC without needing SOL for gas fees
Kora handles all transaction fees as the gasless facilitator
Payments are settled atomically on Solana blockchain
The final result will be a fully functional payment-protected API:


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
X402 + KORA PAYMENT FLOW DEMONSTRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/4] Initializing payment signer
  → Network: solana-devnet
  → Payer address: BYJV...TbBc
  ✓ Signer initialized

[2/4] Attempting to access protected endpoint without payment
  → GET http://localhost:4021/protected
  → Response: 402 Payment Required
  ✅ Status code: 402

[3/4] Accessing protected endpoint with x402 payment
  → Using x402 fetch wrapper
  → Payment will be processed via Kora facilitator
  → Transaction submitted to Solana
  ✅ Status code: 200

[4/4] Processing response data
  ✓ Payment response decoded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUCCESS: Payment completed and API accessed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Response Data:
{
    "data": {
        "message": "Protected endpoint accessed successfully",
        "timestamp": "2025-09-25T20:14:04.242Z"
    },
    "status_code": 200,
    "payment_response": {
        "transaction": "5ULZpdeThaMAy6hcEGfAoMFqJqPpCtxdCxb6JYUV6nA4x8Lk2hKEuzofGUPoe1pop6BdWMSmF5oRPrXsbdWmpruf",
        "success": true,
        "network": "solana-devnet"
    }
}
What is x402?
x402 is an open payment standard that enables seamless micropayments for API access. Instead of traditional subscription models or API keys, x402 allows servers to charge for individual API calls, creating true pay-per-use infrastructure.

Key benefits of x402:

Instant Micropayments: Pay fractions of a cent per API call
Enable AI agents to pay for API calls: Pay for API calls with AI agents
No Subscriptions: Users only pay for what they use
Web3 Payments: Transparent, verifiable payments on-chain
Standard HTTP: Works with existing web infrastructure using an HTTP 402 status code when payment is required
Servers using x402 to require micropayments for API access will return an HTTP 402 status code when payment is required. To access protected endpoints, clients must pass a valid payment to the server in a X-PAYMENT header. x402 relies on "Facilitators" to verify and settle transactions so that servers don't need to directly interact with blockchain infrastructure.

Understanding Facilitators
Facilitators are a crucial component in the x402 ecosystem. They act as specialized services that abstract blockchain payments on behalf of API servers.

What Facilitators Do:

Verify Payments: Validate that client's payment payloads are correctly formed and sufficient
Abstract Complexity: Remove the need for servers to directly interact with blockchain infrastructure (signing and paying network fees)
Settle Transactions: Submit validated transactions to Solana (or other networks)
In our demo, we create a facilitator that leverages Kora to verify and settle transactions (more details below).

What is Kora?
Kora is a Solana signer node that provides signing and gasless transaction services. It enables applications to abstract away gas fees, allowing users to pay transaction costs in tokens other than SOL, or have fees sponsored entirely.

Key features of Kora:

Gasless Transactions: Users don't need SOL to execute transactions
Fee Abstraction: Pay fees in USDC or other SPL tokens
JSON-RPC Interface: Simple HTTP API for transaction handling
Flexible Signers: Support for multiple signer backends (memory, Vault, Turnkey, Privy)
Policy Engine: Granular control over transaction validation and fee policies
In the context of x402, Kora serves as the perfect backend for facilitators: it handles network fees, it signs transactions, and it validates transactions.

Architecture Overview
Our x402 + Kora integration consists of four interconnected components with a complete request/response cycle:

Complete Payment Flow:

Client requests protected resource → API returns 402 Payment Required
Client creates payment transaction with x402 fetch wrapper (which assembles a Solana transaction with a payment instruction)
Client sends payment to Facilitator for verification
Facilitator validates via Kora, which signs and submits to Solana
Transaction confirmed on-chain, Facilitator notifies API
API returns protected content with payment receipt to Client
Component Breakdown
Kora RPC Server (Port 8080)

Core gasless transaction service
Handles transaction signing as fee payer
Validates transactions against configured policies
Facilitator Wrapper/Proxy Server (Port 3000)

Adapts Kora to x402 protocol
Implements /verify, /settle, and /supported endpoints
Translates between x402 and Kora data formats
Protected API (Port 4021)

Demo API server with payment-protected endpoints
Uses x402-express middleware for payment handling
Returns data only after successful payment
Client Application

Demonstrates x402 fetch wrapper usage
Signs transactions with user's private key
The multi-component approach might seem complex, but it mirrors real-world production systems where payment processing, API serving, and client applications are separate concerns.

Prerequisites
Before starting, ensure you have:

Rust (latest stable version)
Node.js (LTS or later)
pnpm (latest version)
Basic understanding of Solana transactions and SPL tokens
Project Setup
Step 1: Clone and Build Kora

# Clone the repository
git clone https://github.com/solana-foundation/kora.git
cd kora

# Checkout the release branch as Kora is currently in a feature freeze for audit
git checkout release/feature-freeze-for-audit

# Build and install Kora
make install
This installs the kora binary to your system, which we'll use to run the RPC server.

Step 2: Navigate to Demo Directory

cd docs/x402/demo
Step 3: Install Dependencies
Install Node.js dependencies for all demo components:


# Install dependencies for all components (facilitator, API, and client)
pnpm run install:all
This script installs dependencies for:

The facilitator wrapper service
The protected API server
The client demonstration app
Step 4: Build Kora SDK
Build the Kora SDK so we can use the Kora TypeScript SDK in the Facilitator:


pnpm run build:kora-sdk
Step 5: Configure Environment
The demo includes a .env.example file with the required environment variables. First, let's set up the basic configuration:


# Copy the example environment file
cp .env.example .env
Now you need to generate or provide keypairs for the demo. Run the following command to generate the keypairs:


pnpm run setup
This will generate the keypairs and add them to the .env file:

KORA_SIGNER_ADDRESS - The address of the Kora signer
KORA_SIGNER_PRIVATE_KEY - The private key of the Kora signer
PAYER_ADDRESS - The address of the payer who will pay to access the protected API
PAYER_PRIVATE_KEY - The private key of the payer
Step 5: Update Configuration Files
kora.toml
The kora/kora.toml file configures the Kora RPC server. You should not need to make any changes to this file, but you can verify the following settings:

Payment Token: Ensure the Devnet USDC mint is in the allowlist:

allowed_tokens = [
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", # USDC devnet
]
API Authentication: The demo uses an API key for Kora access. This should match the KORA_API_KEY in the .env file:

[kora.auth]
api_key = "kora_facilitator_api_key_example"
Fee Payer Policy: Configured to restrict signing unwanted transactions:

[validation.fee_payer_policy]
allow_sol_transfers = false
# all other settings are false
Allowed Programs: Ensure the system program, token program, associated token program, and compute budget program are in the allowlist:

allowed_programs = [
    "11111111111111111111111111111111",             # System Program
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",  # Token Program
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", # Associated Token Program
    "ComputeBudget111111111111111111111111111111",  # Compute Budget Program
]
signers.toml
The kora/signers.toml file configures the Kora signer. You should not need to make any changes to this file, but you can verify the following settings:

Signer Environment Variable: Ensure the signer environment variable, private_key_env is set to KORA_SIGNER_PRIVATE_KEY (matching the env variable name in the .env file).

[[signers]]
name = "main_signer"
type = "memory"
private_key_env = "KORA_SIGNER_PRIVATE_KEY"
weight = 1
Step 6: Fund Accounts
Devnet SOL
Our Kora signer address will need SOL for paying transaction fees. You can airdrop devnet SOL to the Kora signer address using the Solana CLI:


# Airdrop SOL
solana airdrop 1 <KORA_SIGNER_ADDRESS> --url devnet
Alternatively, you can use the Solana Faucet to airdrop SOL to the Kora signer address.

Devnet USDC
Your PAYER_ADDRESS is set in the .env file will need USDC for paying transaction fees.

Get Devnet USDC from Circle's Faucet. Make sure to select "Solana Devnet" and use your PAYER_ADDRESS to request USDC.

Running the Demo
You'll need four terminal windows to run all components from the docs/x402/demo directory.

Terminal 1: Start Kora RPC Server
Run the following command to start the Kora RPC server:


pnpm run start:kora
You should see a series of logs indicating that the Kora RPC server is running, including:


INFO kora_lib::rpc_server::server: RPC server started on 0.0.0.0:8080, port 8080
Terminal 2: Start Facilitator
Run the following command to start the Facilitator:


pnpm run start:facilitator
You should see:


Server listening at http://localhost:3000
Terminal 3: Start Protected API
Run the following command to start the Protected API:


pnpm run start:api
You should see:


Server listening at http://localhost:4021
Terminal 4: Run Client Demo

pnpm run demo
Understanding the Implementation
Here's what happens during a successful payment flow:

Client Request → API returns 402 with payment requirements
Payment Creation → Client creates Solana transaction with payment
Payment Submission → Client sends request to server with payment in the X-PAYMENT header
Verification → Facilitator verifies via Kora's signTransaction
Settlement → Facilitator settles via Kora's signAndSendTransaction (sending the payment transaction to Solana)
Access Granted → Facilitator returns transaction signature and API returns protected content with payment receipt
Let's dive into how each component works:

Kora RPC (Port 8080): Handles gasless transaction signing
Facilitator (Port 3000): Bridges x402 protocol to Kora
Protected API (Port 4021): Your monetized API endpoint
Client: Demonstrates automatic payment flow
The Facilitator Wrapper/Proxy Server
The Facilitator runs on port 3000. This is the server that handles communication with Solana (in our case, via Kora). It is used to verify and settle x402 payments.

The facilitator (facilitator/src/facilitator.ts) is the bridge between x402 protocol and Kora RPC. It implements three key endpoints:

1. /verify Endpoint
This endpoint:

Receives an x402 payment payload from the Protected API server
Extracts the Solana transaction using x402 helpers
Uses Kora's signTransaction to verify validity without broadcasting
Returns verification status, isValid
2. /settle Endpoint
This endpoint:

Receives the the x402 payment payload after the payment has been verified by the /verify endpoint
Uses Kora's signAndSendTransaction to sign and broadcast the transaction
Returns the transaction signature as proof of settlement
3. /supported Endpoint
This endpoint effectively advertises the facilitator's capabilities, including:

Supported x402 version
Payment scheme (exact payments)
Network (solana-devnet)
Fee payer address which we fetch from Kora using the getPayerSigner method
The Protected API
The API server (api/src/api.ts) uses x402-express middleware to protect endpoints:


app.use(
  paymentMiddleware(
    KORA_PAYER_ADDRESS,           // Where payments should go
    {
      "GET /protected": {
        price: "$0.0001",         // Price in USD
        network: NETWORK,         // solana-devnet
      },
    },
    {
      url: FACILITATOR_URL,       // Our facilitator wrapper
    }
  ),
);
The middleware:

Intercepts requests to protected endpoints (in our case, the /protected endpoint)
Returns 402 status if payment is missing
Validates and handles payments via the facilitator
Allows access after successful payment
Though we are using Express, the x402 library includes middleware support for many common frameworks. See the x402 TypeScript Packages for more information.

The Client Application
The client (client/src/index.ts) demonstrates automatic how x402 works by sending a request with a standard fetch call and then retrying the request with the payment wrapper:


// Create a signer from private key
const payer = await createSigner(NETWORK, PAYER_PRIVATE_KEY);

// Wrap fetch with x402 payment capabilities
const fetchWithPayment = wrapFetchWithPayment(fetch, payer);

// First attempt: Regular fetch (will fail with 402)
const expect402Response = await fetch(PROTECTED_API_URL);
console.log(`Status: ${expect402Response.status}`); // 402

// Second attempt: Fetch with payment wrapper (succeeds)
const response = await fetchWithPayment(PROTECTED_API_URL);
console.log(`Status: ${response.status}`); // 200
The x402 fetch wrapper:

Detects 402 responses
Automatically creates payment transaction based on the protected API's payment requirements
Signs with user's private key
Sends payment to the facilitator for verification and processing
Retries request with payment proof in the x-payment-response header
Returns successful response
Wrapping Up
Congratulations! 🔥 You've successfully implemented a complete x402 payment flow with Kora's gasless infrastructure. This demonstration shows how:

x402 Protocol enables frictionless API monetization through micropayments
Kora RPC works as a facilitator for x402 payments by verifying and settling transactions
Users can pay for API access without holding SOL or managing gas fees
This architecture creates a powerful foundation for:

AI Agent marketplaces
Pay-per-use APIs
Micropayment content platforms
Usage-based SaaS pricing
Any service requiring instant, verifiable payments
The combination of x402 and Kora bring the power of Solana to traditional web infrastructure.

Keep Building
Customize Pricing: Modify the API to charge different amounts for different endpoints
Add Multiple Tokens: Configure Kora to accept various SPL tokens for payment
Production Deployment: Deploy to mainnet with production signers (Vault, Turnkey, or Privy)
Build Your Own API: Create a real service that monetizes through x402 payments
Additional Resources
x402 Protocol
x402 Documentation
x402 GitHub
x402 TypeScript SDK

Kora Full Transaction Flow
This guide teaches you how to implement a complete gasless transaction flow using Kora RPC, including payment instructions and transaction signing.

What You'll Build
In the Quick Start Guide, you learned how to set up Kora RPC and make basic calls. Now we'll build a complete gasless transaction system that demonstrates Kora's full capabilities. By the end of this guide, you'll have implemented a transaction flow that:

Creates multiple transfer instructions (SPL tokens and SOL)
Obtains payment instructions from Kora for fee coverage
Signs transactions with user keys while Kora handles gas fees
Submits fully-signed transactions to the Solana network
The final result will be a working gasless transaction system:


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KORA GASLESS TRANSACTION DEMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/6] Initializing clients
  → Kora RPC: http://localhost:8080/
  → Solana RPC: http://127.0.0.1:8899
[2/6] Setting up keypairs
  → Sender: BYJVBqQ2xV9GECc84FeoPQy2DpgoonZQFQu97MMWTbBc
  → Destination: C8MC9E6nf9Am1rVqdDedDavm53uCJMiSwarEko1aXmny
  → Kora signer address: 3Z1Ef7YaxK8oUMoi6exf7wYZjZKWJJsrzJXSt1c3qrDE
[3/6] Creating demonstration instructions
  → Payment token: 9BgeTKqmFsPVnfYscfM6NvsgmZxei7XfdciShQ6D3bxJ
  ✓ Token transfer instruction created
  ✓ SOL transfer instruction created
  ✓ Memo instruction created
  → Total: 3 instructions
[4/6] Estimating Kora fee and assembling payment instruction
  → Fee payer: 3Z1Ef7Ya...
  → Blockhash: 7HZUaMqV...
  ✓ Estimate transaction built
  ✓ Payment instruction received from Kora
[5/6] Creating and signing final transaction (with payment)
  ✓ Final transaction built with payment
  ✓ Transaction signed by user
[6/6] Signing transaction with Kora and sending to Solana cluster
  ✓ Transaction co-signed by Kora
  ✓ Transaction submitted to network
  ⏳ Awaiting confirmation...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUCCESS: Transaction confirmed on Solana
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Transaction signature:
41hmwmkMfHR5mmhG9sNkjiakwHxpmr1H3Gi3bBL8v5PbsRrH7FhpUT8acHaf2mrPKNVD894dSYXfjp6LfAbVpcCE
View on explorer:
https://explorer.solana.com/tx/41hmwmkMfHR5mmhG9sNkjiakwHxpmr1H3Gi3bBL8v5PbsRrH7FhpUT8acHaf2mrPKNVD894dSYXfjp6LfAbVpcCE?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899
Let's build it step by step!

Prerequisites
Before starting this tutorial, ensure you have:

Completed the Kora Quick Start Guide - we will use the same testing environment as the quick start guide.
Node.js (LTS or later)
Solana CLI v2.2.x or greater
Familiarity with Solana transactions and SPL tokens
A running Kora RPC server with configured signers (see Quick Start Guide for instructions)
Kora Transaction Flow
Kora enables gasless transactions by acting as a fee payer for your users' transactions. The gasless transaction flow consists of these main steps:

Transaction Creation - Build the user's intended transaction (transfers, program calls, etc.)
Fee Estimation - Create an estimate transaction to calculate required fees
Payment Instruction - Get a payment instruction from Kora that specifies the fee amount
User Signing - User signs the transaction including the payment instruction
Kora Co-signing - Kora validates payment and co-signs as the fee payer
Submission - Submit the fully-signed transaction to Solana
*Note: Kora can be configured to not require payment, but we will be using it to demonstrate the full flow.

Project Setup
Kora Server Considerations
Token Allowlist - Only tokens configured in kora.toml can be used for payment - make sure the token defined in your .env is included in your kora.toml allowlist.
Program Restrictions - Transactions can only interact with whitelisted programs. We have preset the kora.toml to allow interaction with the System Program, Token Program, Compute Unit Program, and Memo program.
Client Setup
This guide assumes you've completed the Quick Start and have the demo project set up. If not, please complete that first.

Navigate to your demo client directory:


cd kora/docs/getting-started/demo/client
Note: The demo files are located in the GitHub repository as they require a full development setup.

Implementation
Before we start running the demo, let's walk through the full demo implementation step by step:

Imports and Configuration
Our demo starts with the necessary imports and configuration:


import { KoraClient } from "@kora/sdk";
import {
    createKeyPairSignerFromBytes,
    getBase58Encoder,
    createNoopSigner,
    address,
    getBase64EncodedWireTransaction,
    partiallySignTransactionMessageWithSigners,
    Blockhash,
    Base64EncodedWireTransaction,
    partiallySignTransaction,
    TransactionVersion,
    Instruction,
    KeyPairSigner,
    Rpc,
    SolanaRpcApi
} from "@solana/kit";
import {
    createTransaction, 
    createSolanaClient,
    getExplorerLink
} from "gill";
import { getAddMemoInstruction } from "@solana-program/memo";
import { createRecentSignatureConfirmationPromiseFactory } from "@solana/transaction-confirmation";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });
const CONFIG = {
    computeUnitLimit: 200_000n,
    computeUnitPrice: 1_000_000n,
    transactionVersion: 0,
    solanaRpcUrl: "http://127.0.0.1:8899",
    koraRpcUrl: "http://localhost:8080/",
}
We are importing the Kora Client from the Kora SDK and a few types/helpers from Solana Kit library for building transactions. We are also importing a couple of helper functions from the gill library to simplify transaction building.

We are also creating a global configuration object that defines:

Compute Budget - Units and price for transaction prioritization
Transaction Version - Using V0 for address lookup table support
RPC Endpoints - Local Solana and Kora RPC servers
Leave these defaults for now--after the demo, you can experiment with different values to see how they affect the transaction flow.

Utility Functions
The demo includes a helper function for loading keypairs from environment variables:


async function getEnvKeyPair(envKey: string) {
    if (!process.env[envKey]) {
        throw new Error(`Environment variable ${envKey} is not set`);
    }
    const base58Encoder = getBase58Encoder();
    const b58SecretEncoded = base58Encoder.encode(process.env[envKey]);
    return await createKeyPairSignerFromBytes(b58SecretEncoded);
}
This function:

Reads base58-encoded private keys from environment variables
Encodes the private key string to a U8 byte array
Converts them to keypair signer objects
Step 1: Initialize Clients
First, we set up our connection to both Kora and Solana:


async function initializeClients() {
    console.log('\n[1/6] Initializing clients');
    console.log('  → Kora RPC:', CONFIG.koraRpcUrl);
    console.log('  → Solana RPC:', CONFIG.solanaRpcUrl);
    
    const client = new KoraClient({
        rpcUrl: CONFIG.koraRpcUrl,
        // apiKey: process.env.KORA_API_KEY, // Uncomment if authentication is enabled
        // hmacSecret: process.env.KORA_HMAC_SECRET, // Uncomment if HMAC is enabled
    });
    const { rpc, rpcSubscriptions } = createSolanaClient({
        urlOrMoniker: CONFIG.solanaRpcUrl,
    });
    const confirmTransaction = createRecentSignatureConfirmationPromiseFactory({ 
        rpc, 
        rpcSubscriptions 
    });
    
    return { client, rpc, confirmTransaction };
}
This function:

Creates a Kora client instance by passing in our Kora RPC URL.
Establishes a Solana RPC connection with subscription support (we will use this for sending and confirming transactions to the Solana cluster)
Sets up transaction confirmation utilities
Note: Our kora.toml file does not include any authentication, so we don't need to pass in an api key or hmac secret, but we have left the commented out code in for reference.

Step 2: Setup Keys
Load the required keypairs from environment variables and fetch the Kora signer address:


async function setupKeys(client: KoraClient) {
    console.log('\n[2/6] Setting up keypairs');
    
    const testSenderKeypair = await getEnvKeyPair('TEST_SENDER_KEYPAIR');
    const destinationKeypair = await getEnvKeyPair('DESTINATION_KEYPAIR');
    const { signer_address } = await client.getPayerSigner();
    console.log('  → Sender:', testSenderKeypair.address);
    console.log('  → Destination:', destinationKeypair.address);
    console.log('  → Kora signer address:', signer_address);
    
    return { testSenderKeypair, destinationKeypair, signer_address };
}
Here we are using our getEnvKeyPair function to load the keypairs from the environment variables. The keypairs represent:

Sender - The user initiating the transaction and responsible for paying the Kora node in the payment token.
Destination - The recipient of the transfers.
We also use the getPayerSigner method to fetch the Kora signer address. This is the address that will be used to sign the transaction with Kora's signature. It is important that we fetch a valid signer from the Kora node and use it consistently throughout our transaction flow.

Step 3: Create Demo Instructions
Next, we build a set of instructions that that our testSender wants to send to the network. We will be using the Kora Client to build some of these instructions and the @solana/programs library to build others to demonstrate how to use both.


async function createInstructions(
    client: KoraClient, 
    testSenderKeypair: KeyPairSigner, 
    destinationKeypair: KeyPairSigner
) {
    console.log('\n[3/6] Creating demonstration instructions');
    
    const paymentToken = await client.getConfig().then(config => config.validation_config.allowed_spl_paid_tokens[0]);
    console.log('  → Payment token:', paymentToken);
    // Create token transfer (will initialize ATA if needed)
    const transferTokens = await client.transferTransaction({
        amount: 10_000_000, // 10 USDC (6 decimals)
        token: paymentToken,
        source: testSenderKeypair.address,
        destination: destinationKeypair.address
    });
    console.log('  ✓ Token transfer instruction created');
    // Create SOL transfer
    const transferSol = await client.transferTransaction({
        amount: 10_000_000, // 0.01 SOL (9 decimals)
        token: '11111111111111111111111111111111', // SOL mint address
        source: testSenderKeypair.address,
        destination: destinationKeypair.address
    });
    console.log('  ✓ SOL transfer instruction created');
    // Add memo instruction
    const memoInstruction = getAddMemoInstruction({
        memo: 'Hello, Kora!',
    });
    console.log('  ✓ Memo instruction created');
    const instructions = [
        ...transferTokens.instructions,
        ...transferSol.instructions,
        memoInstruction
    ];
    
    console.log(`  → Total: ${instructions.length} instructions`);
    return { instructions, paymentToken };
}
There's quite a bit happening here, so let's walk through it step by step:

We use getConfig to get the payment token from Kora's configuration. Because we set up our server, we know there's only one token in the allowlist, so we can access it directly in the 1st position (config.validation_config.allowed_spl_paid_tokens[0]).
We create a token transfer instruction using the Kora Client's transferTransaction method. This is a helper method that makes it easy to create a token transfer instruction.
We create a SOL transfer instruction using the Kora Client's transferTransaction method. We are including this here to show how to build SOL transfers using the Kora Client--note that we use the Native SOL mint 11111111111111111111111111111111 to indicate we want to transfer SOL instead of an SPL token transfer.
We add a memo instruction using the @solana/programs library's getAddMemoInstruction function.
We combine all the instructions into a single array. We will use this array to build our estimate transaction in the next step.
Step 4: Get Payment Instruction from Kora
Create a transaction that will generate a payment instruction to Kora in exchange for the fees required to execute the transaction.


async function getPaymentInstruction(
    client: KoraClient, 
    instructions: Instruction[],
    testSenderKeypair: KeyPairSigner,
    paymentToken: string
): Promise<{ paymentInstruction: Instruction }> {
    console.log('\n[4/6] Estimating Kora fee and assembling payment instruction');
    
    const { signer_address } = await client.getPayerSigner();
    const noopSigner = createNoopSigner(address(signer_address));
    const latestBlockhash = await client.getBlockhash();
    
    console.log('  → Fee payer:', signer_address.slice(0, 8) + '...');
    console.log('  → Blockhash:', latestBlockhash.blockhash.slice(0, 8) + '...');
    // Create estimate transaction to get payment instruction
    const estimateTransaction = await createTransaction({
        version: CONFIG.transactionVersion as TransactionVersion,
        instructions,
        feePayer: noopSigner,
        latestBlockhash: {
            blockhash: latestBlockhash.blockhash as Blockhash,
            lastValidBlockHeight: 0n,
        },
        computeUnitPrice: CONFIG.computeUnitPrice,
        computeUnitLimit: CONFIG.computeUnitLimit
    });
    const signedEstimateTransaction = await partiallySignTransactionMessageWithSigners(estimateTransaction);
    const base64EncodedWireTransaction = getBase64EncodedWireTransaction(signedEstimateTransaction);
    console.log('  ✓ Estimate transaction built');
    // Get payment instruction from Kora
    const paymentInstruction = await client.getPaymentInstruction({
        transaction: base64EncodedWireTransaction,
        fee_token: paymentToken,
        source_wallet: testSenderKeypair.address,
    });
    console.log('  ✓ Payment instruction received from Kora');
    
    return { paymentInstruction: paymentInstruction.payment_instruction };
}
The Kora SDK has a helper method getPaymentInstruction that will calculate the exact fees required for the transaction and create a payment transfer instruction. Here's how we're using it:

First, we create an estimateTransaction that includes our desired instructions--this transaction will be simulated on the Kora server to estimate the fees required for the transaction.
We then partially sign the transaction to get a base64 encoded wire string.
We pass our base64 encoded wire transaction to the getPaymentInstruction method with the payment token and source of the payment. This will return an Instruction object that we can add to our transaction.
Key concepts here:

Valid Blockhash - We use the getBlockhash method to get a valid blockhash for our transaction. This is required for estimating the transaction as it will simulate the transaction on the server.
Noop Signer - Placeholder signer used when building transactions before Kora signs. This will allow us to specify a fee payer in our transaction before we have Kora's signature. For more information on Noop Signers, see Solana Kit Documentation.
Partial Signing - In order to get our transaction as a base64 encoded wire string (we need this to send the transaction via the Kora RPC), we need to partially sign the transaction. For more information on Partial Signers, see Solana Kit Documentation.
Step 5: Create and Sign Final Transaction
Now that we have our payment instruction, we can create a final transaction that includes our original instructions and the payment instruction.


async function getFinalTransaction(
    client: KoraClient, 
    paymentInstruction: Instruction,
    testSenderKeypair: KeyPairSigner, 
    instructions: Instruction[], 
    signer_address: string
): Promise<Base64EncodedWireTransaction> {
    console.log('\n[5/6] Creating and signing final transaction (with payment)');
    const noopSigner = createNoopSigner(address(signer_address));
    // Build final transaction with payment instruction
    const newBlockhash = await client.getBlockhash();
    const fullTransaction = await createTransaction({
        version: CONFIG.transactionVersion as TransactionVersion,
        instructions: [...instructions, paymentInstruction],
        feePayer: noopSigner,
        latestBlockhash: {
            blockhash: newBlockhash.blockhash as Blockhash,
            lastValidBlockHeight: 0n,
        },
        computeUnitPrice: CONFIG.computeUnitPrice,
        computeUnitLimit: CONFIG.computeUnitLimit
    });
    console.log('  ✓ Final transaction built with payment');
    // Sign with user keypair
    const signedFullTransaction = await partiallySignTransactionMessageWithSigners(fullTransaction);
    const userSignedTransaction = await partiallySignTransaction([testSenderKeypair.keyPair], signedFullTransaction);
    const base64EncodedWireFullTransaction = getBase64EncodedWireTransaction(userSignedTransaction);
    console.log('  ✓ Transaction signed by user');
    
    return base64EncodedWireFullTransaction;
}
We use the same createTransaction helper to assemble our transaction. Our final transaction includes:

Our original instructions
The payment instruction
A fresh blockhash
The same noop signer as previously used to build the estimate transaction
We then call the same partiallySignTransactionMessageWithSigners function to get a base64 encoded wire string of the transaction. This time, however, we also run partiallySignTransaction to sign the transaction with our testSenderKeypair. Though our Kora node is paying the network fees, our testSender still needs to sign to authorize the token payment and the other transfer instructions we created. For Kora nodes that do not require payment, certain instructions may not require this signing step. Finally, we return the base64 encoded wire string of the transaction.

Step 6: Submit Transaction
Finally, we need to get the Kora node to sign the transaction so we can send a fully signed transaction to the network. We do this by calling the signTransactionIfPaid method on the Kora client.


async function submitTransaction(
    client: KoraClient, 
    rpc: Rpc<SolanaRpcApi>, 
    confirmTransaction: ReturnType<typeof createRecentSignatureConfirmationPromiseFactory>, 
    signedTransaction: Base64EncodedWireTransaction, 
    signer_address: string
) {
    console.log('\n[6/6] Signing transaction with Kora and sending to Solana cluster');
    
    // Get Kora's signature
    const { signed_transaction } = await client.signTransactionIfPaid({
        transaction: signedTransaction,
        signer_key: signer_address
    });
    console.log('  ✓ Transaction co-signed by Kora');
    // Submit to Solana network
    const signature = await rpc.sendTransaction(signed_transaction as Base64EncodedWireTransaction, {
        encoding: 'base64'
    }).send();
    console.log('  ✓ Transaction submitted to network');
    
    console.log('  ⏳ Awaiting confirmation...');
    await confirmTransaction({
        commitment: 'confirmed',
        signature,
        abortSignal: new AbortController().signal
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUCCESS: Transaction confirmed on Solana');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nTransaction signature:');
    console.log(signature);
    console.log('\nView on explorer:');
    console.log(getExplorerLink({transaction: signature, cluster: 'localhost'}));
    
    return signature;
}
Here we are doing three things:

We call the signTransactionIfPaid method on the Kora client to get the Kora node to sign the transaction. The node will introspect the transaction to ensure the payment is sufficient and then sign the transaction. Note: some Kora nodes may enable signTransaction that do not require payment. You can check your node's configuration to see if this is enabled by running getConfig().
We send the fully signed transaction to the Solana network using the Solana RPC client.
We wait for the transaction to be confirmed on the network.
Main Orchestration Function
The main function ties everything together and calls each of our functions in sequence:


async function main() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('KORA GASLESS TRANSACTION DEMO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        // Step 1: Initialize clients
        const { client, rpc, confirmTransaction } = await initializeClients();
        
        // Step 2: Setup keys
        const { testSenderKeypair, destinationKeypair, signer_address } = await setupKeys(client);
        
        // Step 3: Create demo instructions
        const { instructions, paymentToken } = await createInstructions(client, testSenderKeypair, destinationKeypair);
        
        // Step 4: Get payment instruction from Kora
        const { paymentInstruction } = await getPaymentInstruction(client, instructions, testSenderKeypair, paymentToken);
        
        // Step 5: Create and partially sign final transaction
        const finalSignedTransaction = await getFinalTransaction(
            client,  
            paymentInstruction, 
            testSenderKeypair, 
            instructions, 
            signer_address
        );
        
        // Step 6: Get Kora's signature and submit to Solana cluster
        await submitTransaction(client, rpc, confirmTransaction, finalSignedTransaction, signer_address);
    } catch (error) {
        console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('ERROR: Demo failed');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('\nDetails:', error);
        process.exit(1);
    }
}
Running the Full Demo
To run the complete gasless transaction demo:

1. Ensure Prerequisites
Set up three terminal windows:

Start your local test validator:

solana-test-validator -r
Start your Kora RPC server (from the docs/getting-started/demo/server directory):

kora rpc start --signers-config signers.toml
Initialize your environment (from the docs/getting-started/demo/client directory):

pnpm init-env
2. Run the Demo

# From the client directory
pnpm full-demo
3. Expected Output
You should see the step-by-step execution with a successful transaction at the end. The transaction will:

Transfer tokens from sender to destination
Transfer SOL from sender to destination
Include a "Hello, Kora!" memo message
Pay fees to the Kora node operator in your configured SPL token
Have transaction gas fees paid by the Kora node operator
Recap: Understanding the Flow
Let's review what happens in this demonstration:

User Intent - User assembled a transaction that included a variety of instructions that they wanted to execute.
Fee Estimation - Kora calculated the transaction cost in the user's preferred token and created a payment instruction.
Transaction Assembly - User assembled a final transaction that included the user's intended instructions and the Kora payment instruction.
Transaction Signing - User partially signed the transaction with their keypair and sent to the Kora node for signing after verifying the payment was sufficient.
Atomic Execution - User sends transaction to the Solana and everything happens in a single transaction:
User's intended transfers execute
Payment for fees transfers to Kora
Kora pays the Solana network fees and signs the transaction
And like that, users do not need to hold SOL to pay for gas fees--they can pay for everything in the tokens they already hold!

Troubleshooting
Common Issues
Transaction Validation Fails

Verify all programs are whitelisted in kora.toml
Check that token mints are in allowed_spl_paid_tokens
Ensure transaction doesn't exceed max_allowed_lamports
Generating Payment Instruction Fails

Confirm the estimate transaction has a fresh blockhash for simulation
Verify Kora's payment address has initialized ATAs
Check that the payment token is properly configured
Signature Verification Fails

Ensure all required signers are included (Kora and any signers required for token payments or other instructions included in your transaction)
Verify the transaction hasn't been modified after signing
Check that keypairs are loaded correctly
Wrap Up
Congratulations! You've successfully implemented a complete gasless transaction flow with Kora.

Kora makes it possible to provide users with a seamless Web3 experience where they never need to worry about gas fees or holding SOL. Whether you're building a NeoBank, gaming platform, or liquid staking platform, Kora's gasless transactions remove a major barrier to user adoption.

Additional Resources