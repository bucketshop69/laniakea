# Kora Infrastructure

This directory contains the configuration and documentation for the Kora infrastructure, which provides gasless transaction capabilities for the x402 payment system.

## Overview

Kora is a Solana signer node that provides signing and gasless transaction services. It enables applications to abstract away gas fees, allowing users to pay transaction costs in tokens other than SOL, or have fees sponsored entirely.

## Configuration Files

- `kora.toml`: Main configuration file for the Kora RPC server
- `signers.toml`: Configuration for signer management
- `.env.example`: Example environment variables

## Key Features

- **Gasless Transactions**: Users don't need SOL to execute transactions
- **Fee Abstraction**: Pay fees in USDC or other SPL tokens
- **JSON-RPC Interface**: Simple HTTP API for transaction handling
- **Flexible Signers**: Support for multiple signer backends
- **Policy Engine**: Granular control over transaction validation and fee policies

## Integration with x402

In the context of x402, Kora serves as the perfect backend for facilitators:
- It handles network fees
- It signs transactions
- It validates transactions

The x402 facilitator service uses this infrastructure to verify and settle transactions on behalf of API consumers.

## Setup

The Kora infrastructure has been built and configured as follows:
1. Kora repository cloned and built from the `release/feature-freeze-for-audit` branch
2. TypeScript SDK built and ready for facilitator integration
3. Keypairs generated for signer and payer accounts
4. Configuration files properly formatted and placed
5. Accounts funded with appropriate tokens (SOL and USDC)

## Ports

- Kora RPC Server: `8080` (configured in `kora.toml`)

## Environment Variables

The following environment variables are used:

- `KORA_SIGNER_ADDRESS`: Address of the Kora signer account
- `KORA_SIGNER_PRIVATE_KEY`: Private key for the Kora signer (base58 encoded)
- `PAYER_ADDRESS`: Address of the payer account (for API consumers)
- `PAYER_PRIVATE_KEY`: Private key for the payer account (base58 encoded)
- `KORA_API_KEY`: API key for authenticating requests to the Kora server