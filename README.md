# On-Chain Invoice / Payment Request API

A portfolio project demonstrating full-stack Web3 development:

- **Smart contract** (`InvoiceRegistry.sol`) — stores invoices on-chain, handles ERC-20 token settlement
- **REST backend** (Express + ethers.js + Prisma/SQLite) — creates/cancels invoices, syncs status via events
- **React frontend** (Vite + wagmi) — wallet connection, invoice dashboard, MetaMask-signed pay flow

## Architecture

```
MetaMask (payer)
     │ approve + pay (direct contract call via wagmi)
     ▼
InvoiceRegistry.sol  ──────────────────────────────┐
     │ InvoiceCreated / InvoicePaid / InvoiceCancelled │
     ▼                                              │
  Backend (Express)  ◄── events (ethers listener) ─┘
     │ SQLite cache (Prisma)
     ▼
  React UI ◄── GET /invoices
```

**Key design decision:** Create/cancel go through the backend (backend wallet signs). Pay goes directly through MetaMask — the backend can't sign on behalf of the payer.

## Prerequisites

- Node.js 20+
- MetaMask browser extension
- (Optional) Infura/Alchemy API key for Sepolia

## Local Setup

### 1. Contracts

```bash
cd contracts
cp .env.example .env        # edit if using Sepolia
npm install
npx hardhat compile
npx hardhat test            # 11 tests, all green

# Terminal A — keep running:
npx hardhat node

# Terminal B:
npx hardhat run scripts/deploy.ts --network localhost
# → prints: InvoiceRegistry deployed to: 0x5FbDB2315678...
```

Copy the deployed address into `backend/.env` as `CONTRACT_ADDRESS`.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env:
#   CONTRACT_ADDRESS=<address from step 1>
#   PRIVATE_KEY=<first Hardhat account key, already in .env.example>

npm install
npm run db:migrate          # creates SQLite DB
npm run dev                 # listens on http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env:
#   VITE_CONTRACT_ADDRESS=<same address>
#   VITE_API_URL=http://localhost:3000

npm run dev                 # http://localhost:5173
```

Open http://localhost:5173 in a browser with MetaMask. Switch MetaMask to **Localhost 8545** (chainId 31337).

## API Reference

### Create invoice

```bash
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -d '{"payer":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","token":"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512","amount":"1000000000000000000"}'
```

### Get invoice

```bash
curl http://localhost:3000/invoices/1
```

### List invoices (filter by creator or payer)

```bash
curl "http://localhost:3000/invoices?creator=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
curl "http://localhost:3000/invoices?payer=0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
```

### Cancel invoice

```bash
curl -X DELETE http://localhost:3000/invoices/1
```

## Sepolia Deployment

1. Get a Sepolia RPC URL (Infura / Alchemy) and a funded wallet private key
2. In `contracts/.env`: set `SEPOLIA_RPC_URL` and `PRIVATE_KEY`
3. `npx hardhat run scripts/deploy.ts --network sepolia`
4. Copy the deployed address to `backend/.env` and `frontend/.env`
5. Set `VITE_API_URL` to your deployed backend URL
6. Switch MetaMask to Sepolia

## Running API Tests

Requires a running Hardhat node (Terminal A above) and compiled contracts:

```bash
cd backend
npm test
```

## Project Structure

```
payments/
├── contracts/
│   ├── contracts/
│   │   ├── InvoiceRegistry.sol   ← main contract
│   │   └── MockERC20.sol         ← test helper
│   ├── scripts/deploy.ts
│   ├── test/InvoiceRegistry.test.ts
│   └── hardhat.config.ts
├── backend/
│   ├── src/
│   │   ├── index.ts              ← Express app + startup
│   │   ├── config/contract.ts   ← ABI + address
│   │   ├── lib/                 ← provider, contract, db singletons
│   │   ├── routes/invoices.ts   ← REST handlers
│   │   └── sync/                ← hydrate + listener
│   ├── prisma/schema.prisma
│   └── __tests__/invoices.test.ts
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── wagmi.ts
    │   ├── abi/InvoiceRegistry.ts
    │   └── components/
    │       ├── Header.tsx
    │       ├── InvoiceDashboard.tsx
    │       ├── CreateInvoiceModal.tsx
    │       ├── PayButton.tsx        ← 2-step MetaMask flow
    │       ├── CancelButton.tsx
    │       ├── StatusBadge.tsx
    │       └── Toast.tsx
    └── vite.config.ts
```
