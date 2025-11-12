# x402 Demo Setup Guide

This guide will help you set up and run the x402 payment demo locally.

## Prerequisites

Before you begin, make sure you have:

- Node.js (v18 or higher)
- Rust and Cargo (for Kora RPC)
- A Solana wallet (Phantom, Solflare, etc.)
- Git

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/laniakea.git
cd laniakea
git checkout x402
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Get Devnet Tokens

You'll need tokens on Solana Devnet to test the demo:

**Get Devnet SOL:**
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

**Get Devnet USDC:**
- Visit [Circle's USDC Faucet](https://faucet.circle.com/)
- Select "Solana Devnet"
- Enter your wallet address
- Request USDC tokens

## Running the Demo

### Terminal 1: Start Kora RPC Server

Navigate to your Kora directory and start the RPC server:

```bash
cd kora-source
cargo run --bin kora -- --config ../kora/kora.toml --rpc-url https://api.devnet.solana.com rpc start --signers-config ../kora/signers.toml
```

**Important:** Keep this terminal running. Kora needs to be active to co-sign transactions and provide gasless payments.

### Terminal 2: Start All Other Services

In a new terminal, navigate back to the project root and run:

```bash
./start.sh
```

This script will start:
- **Frontend** (React + Vite) on `http://localhost:5173`
- **API Server** on `http://localhost:4021`
- **x402 Facilitator** on `http://localhost:3000`

## Accessing the Demo

1. Open your browser to `http://localhost:5173`
2. Connect your Solana wallet (make sure it's on Devnet)
3. Navigate to the x402 Demo page
4. Enter a wallet address to query (or use the default demo wallet)
5. Click "Try API Call" and approve the transaction

## Configuration

### Kora Configuration

The Kora RPC server is configured via `kora/kora.toml` and uses signers from `kora/signers.toml`. Make sure these files are properly set up before starting Kora.

### Environment Variables

Create a `.env` file in the project root if needed:

```env
VITE_API_BASE_URL=http://localhost:4021
VITE_FACILITATOR_URL=http://localhost:3000
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Troubleshooting

### Kora RPC Not Starting
- Ensure Rust and Cargo are installed: `cargo --version`
- Check that `kora.toml` and `signers.toml` exist and are valid
- Verify you have network access to Solana Devnet

### Payment Fails with "Insufficient Balance"
- Make sure you have enough USDC on devnet
- Check that the data provider wallet has a USDC token account

### Transaction Fails with "Account Not Found"
- The recipient wallet needs a USDC token account created
- Use a wallet that already has received USDC on devnet

### Frontend Not Loading
- Check that all services started successfully
- Verify ports 5173, 4021, and 3000 are not in use
- Try clearing your browser cache

## Testing the Flow

1. **Discovery**: The API returns a 402 Payment Required response
2. **Build Transaction**: Payment splits are calculated (70/20/10)
3. **User Signs**: You approve the USDC payment (no SOL needed!)
4. **Settlement**: Kora co-signs and submits the transaction
5. **Success**: View the transaction on Solana Explorer and see live balance updates

## Demo Wallets

**Default Demo Wallet (Data Provider):**
```
5oo5EhwdroKz5Jgrm2ezKsXrWrAVC2guejze8rGc1Kvo
```

This wallet is pre-configured and has data available on devnet.

## Additional Resources

- [x402 Documentation](https://docs.x402.org)
- [Kora RPC Documentation](https://docs.kora.com)
- [Solana Devnet Explorer](https://explorer.solana.com/?cluster=devnet)

## Need Help?

If you encounter any issues:
1. Check that all terminals are still running
2. Verify you're connected to Solana Devnet
3. Ensure you have sufficient USDC on devnet
4. Check the browser console for errors

Happy testing! 🚀
