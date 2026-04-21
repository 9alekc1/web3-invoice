## 1. Project Scaffolding

- [ ] 1.1 Initialize monorepo structure: `contracts/` (Hardhat) and `backend/` (Express) directories with separate `package.json` files
- [ ] 1.2 Install Hardhat, OpenZeppelin contracts, and ethers.js v6 in `contracts/`
- [ ] 1.3 Install Express, Prisma, ethers.js v6, and dotenv in `backend/`
- [ ] 1.4 Configure Hardhat (`hardhat.config.ts`) with localhost and Sepolia networks
- [ ] 1.5 Define Prisma schema for `Invoice` model (invoiceId, creator, payer, token, amount, dueDate, status, txHash, createdAt)
- [ ] 1.6 Run `prisma migrate dev` to create the SQLite database
- [ ] 1.7 Create `.env.example` with `RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`, `DATABASE_URL`

## 2. Smart Contract

- [ ] 2.1 Create `contracts/contracts/InvoiceRegistry.sol` with `Invoice` struct (creator, payer, token, amount, dueDate, status enum)
- [ ] 2.2 Implement `createInvoice(payer, token, amount, dueDate)` with input validation and auto-incrementing ID
- [ ] 2.3 Emit `InvoiceCreated(invoiceId, creator, payer, token, amount, dueDate)` event
- [ ] 2.4 Implement `pay(invoiceId)` with payer-only guard, Pending-only guard, and `IERC20.transferFrom` call
- [ ] 2.5 Emit `InvoicePaid(invoiceId, payer, amount)` event
- [ ] 2.6 Implement `cancel(invoiceId)` with creator-only guard and Pending-only guard
- [ ] 2.7 Emit `InvoiceCancelled(invoiceId, creator)` event
- [ ] 2.8 Implement `getInvoice(invoiceId)` public view function returning full Invoice struct

## 3. Contract Tests

- [ ] 3.1 Write Hardhat test for `createInvoice` happy path (verify storage, event, returned ID)
- [ ] 3.2 Write tests for `createInvoice` reverts (zero amount, zero address payer)
- [ ] 3.3 Write Hardhat test for `pay` happy path (deploy mock ERC-20, approve, pay, verify balances and status)
- [ ] 3.4 Write tests for `pay` reverts (non-payer, already paid, insufficient allowance)
- [ ] 3.5 Write Hardhat test for `cancel` happy path and reverts (non-creator, non-Pending)
- [ ] 3.6 Run `npx hardhat test` and confirm all tests pass

## 4. Deploy Script

- [ ] 4.1 Create `contracts/scripts/deploy.ts` that deploys `InvoiceRegistry` and prints the contract address
- [ ] 4.2 Test deploy against `npx hardhat node` (localhost); confirm address output
- [ ] 4.3 Copy deployed ABI and address into `backend/src/config/contract.ts`

## 5. Backend — Core Setup

- [ ] 5.1 Create Express app entry point (`backend/src/index.ts`) with JSON body parsing and error-handling middleware
- [ ] 5.2 Create `backend/src/lib/provider.ts` that initializes an ethers `JsonRpcProvider` and a signing `Wallet` from env vars
- [ ] 5.3 Create `backend/src/lib/contract.ts` that exports a typed `InvoiceRegistry` contract instance (read + write)
- [ ] 5.4 Create `backend/src/lib/db.ts` that exports a Prisma client singleton

## 6. Backend — REST API

- [ ] 6.1 Implement `POST /invoices` handler: validate body, call `contract.createInvoice(...)`, wait for receipt, upsert into SQLite, return 201
- [ ] 6.2 Implement `GET /invoices/:id` handler: query SQLite by invoiceId, return 200 or 404
- [ ] 6.3 Implement `GET /invoices` handler: query SQLite with optional `creator` / `payer` filter, return 200 array
- [ ] 6.4 Implement `DELETE /invoices/:id` handler: check status in cache, call `contract.cancel(...)`, wait for receipt, update cache, return 200 or 409
- [ ] 6.5 Add input validation middleware (address format check) shared by create and list endpoints

## 7. Backend — Status Sync Service

- [ ] 7.1 Create `backend/src/sync/hydrate.ts` that queries `InvoiceCreated`, `InvoicePaid`, `InvoiceCancelled` events from block 0 to current and upserts all into SQLite
- [ ] 7.2 Create `backend/src/sync/listener.ts` that subscribes to the three event types and updates SQLite on each event
- [ ] 7.3 Add reconnect logic: on provider `error` or `close`, wait 3 seconds then re-initialize provider, re-hydrate from last processed block, and re-attach listeners
- [ ] 7.4 Call `hydrate()` then start `listener()` in `index.ts` before `app.listen()`

## 8. API Tests

- [ ] 8.1 Write Jest integration test for `POST /invoices` against a local Hardhat node (deploy contract in beforeAll)
- [ ] 8.2 Write Jest test for `GET /invoices/:id` (existing and missing invoice)
- [ ] 8.3 Write Jest test for `GET /invoices` with creator/payer filters
- [ ] 8.4 Write Jest test for `DELETE /invoices/:id` (success and 409 cases)
- [ ] 8.5 Run `npm test` in `backend/` and confirm all tests pass

## 9. Frontend — Setup

- [ ] 9.1 Scaffold `frontend/` with Vite + React + TypeScript template
- [ ] 9.2 Install wagmi v2, viem, @tanstack/react-query, and TailwindCSS
- [ ] 9.3 Configure wagmi client in `frontend/src/main.tsx` with a localhost (and Sepolia) chain and MetaMask connector
- [ ] 9.4 Create `frontend/.env.example` with `VITE_CONTRACT_ADDRESS` and `VITE_API_URL`
- [ ] 9.5 Export contract ABI from Hardhat artifacts into `frontend/src/abi/InvoiceRegistry.ts`

## 10. Frontend — Wallet & Layout

- [ ] 10.1 Create `Header` component with "Connect Wallet" button (wagmi `useConnect`) and connected address display (truncated, e.g. `0x1234...abcd`)
- [ ] 10.2 Wrap the app in a `WagmiProvider` + `QueryClientProvider` and render `Header` + main content area
- [ ] 10.3 Disable all action buttons when wallet is disconnected; show tooltip "Connect wallet to continue"

## 11. Frontend — Invoice Dashboard

- [ ] 11.1 Create `InvoiceDashboard` component that fetches `GET /invoices?creator=<addr>&payer=<addr>` on mount (using connected address for both filters merged client-side)
- [ ] 11.2 Render invoices in a table: ID, payer (truncated), token (truncated), amount, status badge (yellow/green/grey), actions column
- [ ] 11.3 Add empty state: "No invoices yet. Create one to get started."
- [ ] 11.4 Auto-refresh the invoice list every 10 seconds to pick up status changes from the sync service

## 12. Frontend — Create Invoice Form

- [ ] 12.1 Create `CreateInvoiceModal` component with fields: payer address, token address, amount (number), due date (date picker, optional)
- [ ] 12.2 Add inline validation: required fields, Ethereum address format for payer and token
- [ ] 12.3 On submit call `POST /invoices` via fetch; show spinner on button while pending
- [ ] 12.4 On success close modal and refresh dashboard; on error show error toast with message from API

## 13. Frontend — Pay Action

- [ ] 13.1 Add "Pay" button to invoice rows where `connectedAddress === payer` and `status === "Pending"`
- [ ] 13.2 On click: call `useWriteContract` for `approve(contractAddress, amount)` on the ERC-20 token contract; show "Step 1/2: Approving…" spinner
- [ ] 13.3 After approve confirms: call `useWriteContract` for `InvoiceRegistry.pay(invoiceId)`; show "Step 2/2: Paying…" spinner
- [ ] 13.4 On final confirmation show success toast "Invoice paid!" and refresh dashboard; on any rejection show error toast

## 14. Frontend — Cancel Action

- [ ] 14.1 Add "Cancel" button to invoice rows where `connectedAddress === creator` and `status === "Pending"`
- [ ] 14.2 Show a confirmation dialog ("Are you sure you want to cancel invoice #N?") before proceeding
- [ ] 14.3 On confirm call `DELETE /invoices/:id` via fetch; show spinner while pending
- [ ] 14.4 On success show toast "Invoice cancelled" and refresh dashboard

## 15. Documentation

- [ ] 15.1 Write root `README.md` covering: project overview, prerequisites, local setup steps (contracts → backend → frontend), and Sepolia deployment instructions
- [ ] 15.2 Add example `curl` commands for create, get, list, and cancel to the README
- [ ] 15.3 Add a screenshot or short GIF of the UI to the README
