## 1. Project Scaffolding

- [x] 1.1 Initialize monorepo structure: `contracts/` (Hardhat) and `backend/` (Express) directories with separate `package.json` files
- [x] 1.2 Install Hardhat, OpenZeppelin contracts, and ethers.js v6 in `contracts/`
- [x] 1.3 Install Express, Prisma, ethers.js v6, and dotenv in `backend/`
- [x] 1.4 Configure Hardhat (`hardhat.config.ts`) with localhost and Sepolia networks
- [x] 1.5 Define Prisma schema for `Invoice` model (invoiceId, creator, payer, token, amount, dueDate, status, txHash, createdAt)
- [x] 1.6 Run `prisma migrate dev` to create the SQLite database
- [x] 1.7 Create `.env.example` with `RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`, `DATABASE_URL`

## 2. Smart Contract

- [x] 2.1 Create `contracts/contracts/InvoiceRegistry.sol` with `Invoice` struct (creator, payer, token, amount, dueDate, status enum)
- [x] 2.2 Implement `createInvoice(payer, token, amount, dueDate)` with input validation and auto-incrementing ID
- [x] 2.3 Emit `InvoiceCreated(invoiceId, creator, payer, token, amount, dueDate)` event
- [x] 2.4 Implement `pay(invoiceId)` with payer-only guard, Pending-only guard, and `IERC20.transferFrom` call
- [x] 2.5 Emit `InvoicePaid(invoiceId, payer, amount)` event
- [x] 2.6 Implement `cancel(invoiceId)` with creator-only guard and Pending-only guard
- [x] 2.7 Emit `InvoiceCancelled(invoiceId, creator)` event
- [x] 2.8 Implement `getInvoice(invoiceId)` public view function returning full Invoice struct

## 3. Contract Tests

- [x] 3.1 Write Hardhat test for `createInvoice` happy path (verify storage, event, returned ID)
- [x] 3.2 Write tests for `createInvoice` reverts (zero amount, zero address payer)
- [x] 3.3 Write Hardhat test for `pay` happy path (deploy mock ERC-20, approve, pay, verify balances and status)
- [x] 3.4 Write tests for `pay` reverts (non-payer, already paid, insufficient allowance)
- [x] 3.5 Write Hardhat test for `cancel` happy path and reverts (non-creator, non-Pending)
- [x] 3.6 Run `npx hardhat test` and confirm all tests pass

## 4. Deploy Script

- [x] 4.1 Create `contracts/scripts/deploy.ts` that deploys `InvoiceRegistry` and prints the contract address
- [x] 4.2 Test deploy against `npx hardhat node` (localhost); confirm address output
- [x] 4.3 Copy deployed ABI and address into `backend/src/config/contract.ts`

## 5. Backend — Core Setup

- [x] 5.1 Create Express app entry point (`backend/src/index.ts`) with JSON body parsing and error-handling middleware
- [x] 5.2 Create `backend/src/lib/provider.ts` that initializes an ethers `JsonRpcProvider` and a signing `Wallet` from env vars
- [x] 5.3 Create `backend/src/lib/contract.ts` that exports a typed `InvoiceRegistry` contract instance (read + write)
- [x] 5.4 Create `backend/src/lib/db.ts` that exports a Prisma client singleton

## 6. Backend — REST API

- [x] 6.1 Implement `POST /invoices` handler: validate body, call `contract.createInvoice(...)`, wait for receipt, upsert into SQLite, return 201
- [x] 6.2 Implement `GET /invoices/:id` handler: query SQLite by invoiceId, return 200 or 404
- [x] 6.3 Implement `GET /invoices` handler: query SQLite with optional `creator` / `payer` filter, return 200 array
- [x] 6.4 Implement `DELETE /invoices/:id` handler: check status in cache, call `contract.cancel(...)`, wait for receipt, update cache, return 200 or 409
- [x] 6.5 Add input validation middleware (address format check) shared by create and list endpoints

## 7. Backend — Status Sync Service

- [x] 7.1 Create `backend/src/sync/hydrate.ts` that queries `InvoiceCreated`, `InvoicePaid`, `InvoiceCancelled` events from block 0 to current and upserts all into SQLite
- [x] 7.2 Create `backend/src/sync/listener.ts` that subscribes to the three event types and updates SQLite on each event
- [x] 7.3 Add reconnect logic: on provider `error` or `close`, wait 3 seconds then re-initialize provider, re-hydrate from last processed block, and re-attach listeners
- [x] 7.4 Call `hydrate()` then start `listener()` in `index.ts` before `app.listen()`

## 8. API Tests

- [x] 8.1 Write Jest integration test for `POST /invoices` against a local Hardhat node (deploy contract in beforeAll)
- [x] 8.2 Write Jest test for `GET /invoices/:id` (existing and missing invoice)
- [x] 8.3 Write Jest test for `GET /invoices` with creator/payer filters
- [x] 8.4 Write Jest test for `DELETE /invoices/:id` (success and 409 cases)
- [x] 8.5 Run `npm test` in `backend/` and confirm all tests pass

## 9. Frontend — Setup

- [x] 9.1 Scaffold `frontend/` with Vite + React + TypeScript template
- [x] 9.2 Install wagmi v2, viem, @tanstack/react-query, and TailwindCSS
- [x] 9.3 Configure wagmi client in `frontend/src/main.tsx` with a localhost (and Sepolia) chain and MetaMask connector
- [x] 9.4 Create `frontend/.env.example` with `VITE_CONTRACT_ADDRESS` and `VITE_API_URL`
- [x] 9.5 Export contract ABI from Hardhat artifacts into `frontend/src/abi/InvoiceRegistry.ts`

## 10. Frontend — Wallet & Layout

- [x] 10.1 Create `Header` component with "Connect Wallet" button (wagmi `useConnect`) and connected address display (truncated, e.g. `0x1234...abcd`)
- [x] 10.2 Wrap the app in a `WagmiProvider` + `QueryClientProvider` and render `Header` + main content area
- [x] 10.3 Disable all action buttons when wallet is disconnected; show tooltip "Connect wallet to continue"

## 11. Frontend — Invoice Dashboard

- [x] 11.1 Create `InvoiceDashboard` component that fetches `GET /invoices?creator=<addr>&payer=<addr>` on mount (using connected address for both filters merged client-side)
- [x] 11.2 Render invoices in a table: ID, payer (truncated), token (truncated), amount, status badge (yellow/green/grey), actions column
- [x] 11.3 Add empty state: "No invoices yet. Create one to get started."
- [x] 11.4 Auto-refresh the invoice list every 10 seconds to pick up status changes from the sync service

## 12. Frontend — Create Invoice Form

- [x] 12.1 Create `CreateInvoiceModal` component with fields: payer address, token address, amount (number), due date (date picker, optional)
- [x] 12.2 Add inline validation: required fields, Ethereum address format for payer and token
- [x] 12.3 On submit call `POST /invoices` via fetch; show spinner on button while pending
- [x] 12.4 On success close modal and refresh dashboard; on error show error toast with message from API

## 13. Frontend — Pay Action

- [x] 13.1 Add "Pay" button to invoice rows where `connectedAddress === payer` and `status === "Pending"`
- [x] 13.2 On click: call `useWriteContract` for `approve(contractAddress, amount)` on the ERC-20 token contract; show "Step 1/2: Approving…" spinner
- [x] 13.3 After approve confirms: call `useWriteContract` for `InvoiceRegistry.pay(invoiceId)`; show "Step 2/2: Paying…" spinner
- [x] 13.4 On final confirmation show success toast "Invoice paid!" and refresh dashboard; on any rejection show error toast

## 14. Frontend — Cancel Action

- [x] 14.1 Add "Cancel" button to invoice rows where `connectedAddress === creator` and `status === "Pending"`
- [x] 14.2 Show a confirmation dialog ("Are you sure you want to cancel invoice #N?") before proceeding
- [x] 14.3 On confirm call `DELETE /invoices/:id` via fetch; show spinner while pending
- [x] 14.4 On success show toast "Invoice cancelled" and refresh dashboard

## 15. Documentation

- [x] 15.1 Write root `README.md` covering: project overview, prerequisites, local setup steps (contracts → backend → frontend), and Sepolia deployment instructions
- [x] 15.2 Add example `curl` commands for create, get, list, and cancel to the README
- [x] 15.3 Add a screenshot or short GIF of the UI to the README
