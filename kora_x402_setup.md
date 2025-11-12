# Kora + x402 Gasless Payment Setup Guide

This guide walks you through setting up the complete x402 payment integration with Kora for gasless Solana transactions in the Laniakea project.

## Overview

This implementation enables users to pay for API access in USDC without needing SOL for gas fees. Kora handles all transaction fees as the gasless facilitator.

## Prerequisites

- Node.js (LTS or later)
- pnpm (latest version)
- Rust (latest stable version)
- Solana CLI v2.2.x or greater
- Basic understanding of Solana transactions and SPL tokens

## Part 1: Kora Setup

### 1.1 Clone and Build Kora

Since `kora-source` is not part of this repository, you need to set it up separately:

```bash
# Navigate to project root (laniakea directory)
cd laniakea

# Clone Kora into kora-source directory (if not already done)
git clone https://github.com/solana-foundation/kora.git kora-source
cd kora-source

# Checkout the release branch (Kora is in feature freeze for audit)
git checkout release/feature-freeze-for-audit

# Build and install Kora
make install
```

This installs the `kora` binary to your system.

### 1.2 Build Kora TypeScript SDK

The facilitator uses the Kora TypeScript SDK:

```bash
cd kora-source/sdks/ts
pnpm install
pnpm build
```

### 1.3 Configure Kora

The configuration files are in the `kora/` directory (part of this repo):

**`kora/kora.toml`** - Already configured with:
- Devnet cluster
- Port 8080
- API key authentication
- USDC devnet as allowed payment token
- Required programs (System, Token, ATA, Compute Budget)

**`kora/signers.toml`** - Already configured with:
- Memory signer
- References `KORA_SIGNER_PRIVATE_KEY` environment variable

### 1.4 Setup Environment Variables

Create `kora/.env` file with your Kora signer private key:

```bash
# In kora/ directory
cp .env.example .env
```

Edit `kora/.env` and add:
```
KORA_SIGNER_PRIVATE_KEY="[your,private,key,array,here]"
```

**Generate a new keypair for Kora:**
```bash
solana-keygen new --outfile kora-keypair.json
# Then convert to array format for .env
```

**IMPORTANT:** Never commit the `.env` file or keypair files to git!

### 1.5 Fund the Kora Signer Account

The Kora signer needs SOL to pay transaction fees:

```bash
# Get your Kora signer address
solana address -k kora-keypair.json

# Airdrop devnet SOL
solana airdrop 2 <KORA_SIGNER_ADDRESS> --url devnet
```

## Part 2: Facilitator Setup

### 2.1 Install Dependencies

```bash
cd facilitator
pnpm install
```

### 2.2 Build Facilitator

```bash
pnpm run build
```

The facilitator implements three key endpoints:
- `GET /supported` - Returns facilitator capabilities
- `POST /get-payment-instruction` - Gets payment instruction from Kora
- `GET /get-kora-signer` - Returns Kora signer public key
- `POST /settle` - Signs and sends transaction via Kora

## Part 3: Frontend Setup

### 3.1 Install Dependencies

```bash
# In project root
pnpm install
```

### 3.2 Build Frontend

```bash
pnpm run build
```

### 3.3 Fund User Wallet

Users need USDC to pay for transactions (but NOT SOL):

1. Connect your wallet in the app
2. Get devnet USDC from [Circle's Faucet](https://faucet.circle.com/)
   - Select "Solana Devnet"
   - Use your wallet address
   - Request USDC

## Part 4: Running the System

### Option A: Using start.sh Script (Recommended)

The easiest way to start all services:

```bash
# In project root
./start.sh
```

This script starts:
- Kora RPC server (port 8080)
- Facilitator service (port 3000)
- Frontend dev server (port 5173)

### Option B: Manual Start (Three Terminals)

If you need to start services separately for debugging:

#### Terminal 1: Start Kora RPC Server

```bash
cd kora-source
cargo run --bin kora -- --config ../kora/kora.toml --rpc-url https://api.devnet.solana.com rpc start --signers-config ../kora/signers.toml
```

You should see:
```
INFO kora_lib::rpc_server::server: RPC server started on 0.0.0.0:8080
```

#### Terminal 2: Start Facilitator

```bash
cd facilitator
pnpm run dev
```

You should see:
```
Facilitator service running on port 3000
```

#### Terminal 3: Start Frontend

```bash
# In project root
pnpm run dev
```

You should see:
```
VITE v7.1.6  ready in XXX ms
➜  Local:   http://localhost:5173/
```

## Part 5: Testing the Payment Flow

1. Open http://localhost:5173 in your browser
2. Connect your Solana wallet (make sure it has USDC)
3. Navigate to the x402 Demo section
4. Click "Request Wallet Overview"
5. Approve the transaction in your wallet

**Expected Flow:**
- Frontend builds transaction with USDC payment splits
- Calls facilitator to get Kora payment instruction
- User signs transaction (with Kora as fee payer)
- Facilitator sends to Kora for co-signing
- Kora pays SOL gas fees and submits to Solana
- Transaction confirms on-chain

**Success indicators:**
- Transaction signature displayed
- USDC transferred from user to recipients
- User didn't need SOL for gas (Kora paid it)

## Verification

Check a successful transaction on Solana Explorer:
```
https://explorer.solana.com/tx/[TRANSACTION_SIGNATURE]?cluster=devnet
```

You should see:
- Token transfers (USDC)
- Fee paid by Kora signer address
- No SOL deducted from user wallet

## Troubleshooting

### Kora RPC Connection Failed
- Verify Kora is running on port 8080
- Check `kora/.env` has valid `KORA_SIGNER_PRIVATE_KEY`
- Ensure Kora signer has SOL for gas

### "Insufficient token payment" Error
- This was fixed by adding compute budget instructions
- Ensure you're using the latest code
- Check that USDC payment amount covers estimated fees

### "Blockhash not found" Error
- Fixed by ensuring fresh blockhash before Kora simulation
- Network may be slow - retry the transaction

### Transaction Fails to Submit
- Check Kora logs for validation errors
- Verify all programs are in `allowed_programs` in `kora.toml`
- Ensure USDC mint is in `allowed_spl_paid_tokens`

## Architecture

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │
       │ 1. Build transaction + get payment instruction
       ↓
┌─────────────────┐
│  Facilitator    │  (Port 3000)
│  (TypeScript)   │
└────────┬────────┘
         │
         │ 2. Request payment instruction + sign transaction
         ↓
┌─────────────────┐
│   Kora RPC      │  (Port 8080)
│   (Rust)        │
└────────┬────────┘
         │
         │ 3. Submit fully-signed transaction
         ↓
┌─────────────────┐
│  Solana Devnet  │
└─────────────────┘
```

## Key Files

- `kora/kora.toml` - Kora server configuration
- `kora/signers.toml` - Kora signer configuration
- `kora/.env` - Kora private key (DO NOT COMMIT)
- `facilitator/src/index.ts` - Facilitator endpoints
- `facilitator/src/services/KoraService.ts` - Kora RPC client
- `src/modules/x402/services/x402Service.ts` - Payment transaction builder
- `src/modules/x402/hooks/useX402Payment.ts` - React payment hook

## Security Notes

**Never commit these files:**
- `kora/.env`
- `kora-keypair.json`
- Any files containing private keys

**Safe to commit:**
- `kora.toml`
- `signers.toml`
- `.env.example` files
- All source code

## Additional Resources

- [Kora Documentation](https://github.com/solana-foundation/kora)
- [x402 Protocol](https://github.com/x402/x402)
- [Full Kora Transaction Flow](./kora.md)

## Success Criteria

✅ Kora RPC running on port 8080
✅ Facilitator running on port 3000
✅ Frontend running on port 5173
✅ User can pay in USDC without SOL
✅ Kora co-signs and submits transaction
✅ Transaction confirms on Solana devnet

---

**Questions or issues?** Check the troubleshooting section or review `kora.md` for detailed transaction flow documentation.
