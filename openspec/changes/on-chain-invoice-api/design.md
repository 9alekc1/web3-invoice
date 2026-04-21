## Context

Greenfield portfolio project. No existing codebase to migrate. The system has three layers:

1. **Smart contract layer** — `InvoiceRegistry.sol` deployed on a local Hardhat node (dev) or Sepolia testnet. Holds all invoice data and settlement logic on-chain. ERC-20 tokens are transferred from payer to creator via `transferFrom`, so the payer must `approve` the contract first.
2. **Backend layer** — Express REST API that acts as a gateway: it writes invoices by submitting contract transactions, reads invoice state from the chain (with an off-chain cache for fast queries), and syncs status changes by listening to contract events.
3. **Frontend layer** — React SPA (Vite) with wagmi for wallet connection and contract interaction. The UI talks to the backend for invoice reads/creates/cancels, and talks directly to the user's MetaMask wallet for the two-step ERC-20 pay flow (approve + pay).

## Goals / Non-Goals

**Goals:**
- On-chain invoice creation with creator, payer, amount, token address, and due date stored in contract storage
- ERC-20 settlement: payer approves contract, then calls pay — tokens move from payer to creator atomically
- REST API for create, read, list (by creator/payer), and cancel invoice
- Event-driven status sync: backend listens for `InvoicePaid` / `InvoiceCancelled` events and updates SQLite cache
- Hardhat test suite for the contract; Jest tests for the API

**Non-Goals:**
- Multi-token swap / DEX integration (payers must already hold the invoiced token)
- Mobile-responsive polish (desktop viewport is sufficient for portfolio)
- Production mainnet deployment (testnet is sufficient for portfolio)
- Role-based access control beyond creator-only cancel

## Decisions

### 1. Store invoice data fully on-chain (not IPFS/calldata)

**Chosen**: Store `creator`, `payer`, `token`, `amount`, `dueDate`, `status` as struct fields in a `mapping(uint256 => Invoice)`.

**Alternatives considered**:
- Emit-only (events, no storage): cheaper gas but can't read current state without indexing — adds complexity.
- IPFS metadata: unnecessary indirection for a portfolio demo.

**Rationale**: On-chain storage makes the contract self-contained and easy to query. Gas cost is acceptable for a portfolio scale.

---

### 2. ERC-20 pull payment via `transferFrom`

**Chosen**: Payer calls `approve(InvoiceRegistry, amount)` on the token contract, then calls `InvoiceRegistry.pay(invoiceId)`. The registry calls `IERC20(token).transferFrom(payer, creator, amount)`.

**Alternatives considered**:
- Push payment (payer sends tokens directly): requires a fallback/receive hook per token — complex and error-prone.
- Native ETH payment: doesn't demonstrate ERC-20 mechanics.

**Rationale**: `transferFrom` is the canonical ERC-20 payment pattern and the most recognizable to reviewers.

---

### 3. Off-chain SQLite cache for API reads

**Chosen**: Prisma + SQLite mirrors invoice state. On startup the backend hydrates from contract events; during runtime it listens for new events and updates the cache. REST reads hit SQLite, not the chain.

**Alternatives considered**:
- Read directly from chain on every request: too slow and rate-limited on public RPCs.
- PostgreSQL: overkill for a portfolio demo; SQLite keeps the repo self-contained.

**Rationale**: Demonstrates event-driven sync pattern without requiring a database server.

---

### 4. Hardhat for contract tooling

**Chosen**: Hardhat + ethers.js v6 throughout (contract scripts, tests, backend SDK).

**Alternatives considered**:
- Foundry: excellent for contract-only projects but less familiar to JS-stack reviewers; harder to share tooling with the Express backend.

**Rationale**: Unified JS toolchain reduces friction for a portfolio reviewer cloning the repo.

---

### 5. wagmi + viem for frontend wallet/contract interaction

**Chosen**: wagmi v2 + viem in the React frontend. wagmi provides React hooks for wallet connection (`useAccount`, `useConnect`) and contract calls (`useWriteContract`, `useWaitForTransactionReceipt`). The pay flow triggers two sequential MetaMask prompts: `approve` then `pay`.

**Alternatives considered**:
- ethers.js directly in the UI: more verbose, no built-in React hooks, manual state management for loading/error.
- web3.js: older API, less TypeScript support.

**Rationale**: wagmi is the current standard for React + EVM wallet UX and will be recognizable to Web3 hiring reviewers.

---

### 6. UI calls backend for create/cancel; calls contract directly for pay

**Chosen**: Create and cancel go through the backend REST API (backend wallet signs). The pay action (approve + pay) is signed by the user's MetaMask wallet directly via wagmi — the backend cannot sign on behalf of the payer.

**Alternatives considered**:
- All actions via backend: impossible for pay (backend doesn't hold payer's private key).
- All actions via MetaMask: would require removing the backend signing wallet entirely, making the create flow require the user to also be the creator — acceptable but limits demo flexibility.

**Rationale**: Mixed model is the realistic production pattern and demonstrates both backend-signed and user-signed transaction flows.

## Risks / Trade-offs

- **Re-org / missed events** → Mitigation: use `fromBlock` hydration on startup + confirmation depth of 1 block (acceptable for testnet/local).
- **Approve + pay UX** → The two-step ERC-20 flow is a known friction point; the UI surfaces each step explicitly (two sequential MetaMask prompts with clear labels).
- **No invoice amendment** → Once created, amount/token/payer are immutable. Cancellation is the only mutation. Keeps contract logic simple.
- **SQLite not production-grade** → Acceptable for portfolio; the sync architecture is the same pattern used with Postgres in production.

## Migration Plan

1. `npx hardhat compile` — compile contracts
2. `npx hardhat test` — run contract tests against in-process Hardhat node
3. `npx hardhat node` — start local chain
4. `npx hardhat run scripts/deploy.ts --network localhost` — deploy; copy contract address + ABI to backend config
5. `npm run dev` (backend) — starts Express + event listener hydration
6. `npm run dev` (frontend) — starts Vite dev server; set `VITE_CONTRACT_ADDRESS` + `VITE_API_URL` in `frontend/.env`
7. For Sepolia: repeat steps 3-6 with `--network sepolia`; set `SEPOLIA_RPC_URL` + `PRIVATE_KEY` (backend) and point MetaMask to Sepolia

Rollback: redeploy a new contract instance (no migration needed — greenfield).

## Open Questions

- Should `dueDate` enforcement be on-chain (revert if past due) or advisory (backend warns only)? → Lean toward advisory to keep the contract simple; revisit if time allows.
- Include a `Cancelled` event distinct from `InvoiceCancelled`? → Use `InvoiceCancelled` to keep naming consistent with `InvoicePaid`.
