## Why

Web3 payment flows lack a simple, developer-friendly invoicing primitive: most on-chain payments are ad-hoc transfers with no structured request, metadata, or status lifecycle. This project builds a portfolio-grade On-chain Invoice system that demonstrates full-stack Web3 competency — smart contracts, a REST backend, ERC-20 token settlement, and a minimal web UI — in a single cohesive system.

## What Changes

- Introduce a Solidity smart contract (`InvoiceRegistry`) that creates, stores, and settles payment requests on-chain
- Introduce a REST API backend (Node.js / Express) that wraps contract interactions and exposes invoice CRUD + status endpoints
- ERC-20 token settlement: payers call `pay(invoiceId)` on-chain; the contract pulls approved tokens from the payer
- Backend indexes on-chain events (via ethers.js listeners or polling) to sync invoice status (Pending → Paid / Cancelled)
- REST endpoints: create invoice, get invoice, list invoices by creator/payer, cancel invoice
- Simple React UI: dashboard listing invoices, a form to create an invoice, and a pay/cancel action flow with MetaMask wallet connection

## Capabilities

### New Capabilities

- `invoice-registry-contract`: Solidity smart contract that stores invoice data on-chain, enforces access control (only creator can cancel), and handles ERC-20 token settlement via `transferFrom`
- `invoice-api`: REST API exposing invoice lifecycle — create, read, list, cancel — backed by contract calls and an off-chain status cache
- `invoice-status-sync`: Event listener / polling service that watches `InvoicePaid` and `InvoiceCancelled` contract events and updates backend state
- `invoice-ui`: React single-page app with MetaMask wallet connection, invoice dashboard, create-invoice form, and pay/cancel actions that submit transactions directly via the user's wallet

### Modified Capabilities

(none — greenfield project)

## Impact

- **Smart contracts**: Solidity ≥0.8, OpenZeppelin ERC-20 interface, Hardhat for compile/test/deploy
- **Backend**: Node.js + Express, ethers.js v6, a lightweight database (SQLite via Prisma) for off-chain status cache
- **Frontend**: React + Vite, wagmi + viem for wallet/contract interaction, TailwindCSS for styling
- **External dependencies**: A local Hardhat node (dev) or a public testnet (Sepolia) for deployment; MetaMask browser extension for the UI
- **Portfolio signal**: demonstrates contract design, event-driven sync, REST API design, ERC-20 token mechanics, and a wallet-connected frontend end-to-end
