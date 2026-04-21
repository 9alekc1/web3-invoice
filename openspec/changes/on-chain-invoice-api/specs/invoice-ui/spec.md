## ADDED Requirements

### Requirement: Wallet connection
The UI SHALL provide a "Connect Wallet" button that triggers MetaMask (via wagmi) to connect the user's browser wallet. The connected address MUST be displayed in the header while connected. The app SHALL be non-functional (actions disabled) while no wallet is connected.

#### Scenario: User connects wallet
- **WHEN** the user clicks "Connect Wallet" and approves in MetaMask
- **THEN** the connected address is shown in the header and all actions become available

#### Scenario: User not connected
- **WHEN** the page loads with no wallet connected
- **THEN** action buttons (Create, Pay, Cancel) are disabled with a "Connect wallet" tooltip

### Requirement: Invoice dashboard
The UI SHALL display a list of all invoices fetched from `GET /invoices`, filtered by the connected wallet address (showing invoices where the user is creator OR payer). Each row SHALL show: Invoice ID, payer address (truncated), token address (truncated), amount, status badge, and action buttons.

#### Scenario: Dashboard loads invoices
- **WHEN** a wallet is connected and the dashboard mounts
- **THEN** invoices relevant to the connected address are fetched from the backend and rendered in a table

#### Scenario: No invoices found
- **WHEN** the connected address has no invoices
- **THEN** an empty state message "No invoices yet" is displayed

#### Scenario: Status badge colours
- **WHEN** an invoice row is rendered
- **THEN** status badges show: Pending = yellow, Paid = green, Cancelled = grey

### Requirement: Create invoice form
The UI SHALL provide a form (modal or dedicated page) with fields for payer address, ERC-20 token address, amount, and optional due date. On submit it SHALL call `POST /invoices` via the backend API (the backend wallet signs the contract tx). On success the dashboard MUST refresh.

#### Scenario: Successful invoice creation
- **WHEN** the user fills in all required fields and submits
- **THEN** a loading state is shown, the API call completes, and the new invoice appears in the dashboard

#### Scenario: Validation errors shown inline
- **WHEN** the user submits with an invalid Ethereum address or empty required field
- **THEN** the field is highlighted with an error message and the form is not submitted

### Requirement: Pay invoice action
The UI SHALL show a "Pay" button on invoices where the connected wallet matches the payer address and status is Pending. Clicking it SHALL:
1. Call `approve(contractAddress, amount)` on the token contract via the user's MetaMask wallet
2. Call `pay(invoiceId)` on the InvoiceRegistry contract via MetaMask
Both steps MUST be surfaced as separate MetaMask confirmation prompts.

#### Scenario: Successful payment flow
- **WHEN** the payer clicks "Pay", approves both MetaMask prompts, and both transactions confirm
- **THEN** the invoice status updates to Paid in the dashboard

#### Scenario: User rejects MetaMask prompt
- **WHEN** the user rejects either the approve or pay confirmation
- **THEN** an error toast is shown and the invoice status remains unchanged

### Requirement: Cancel invoice action
The UI SHALL show a "Cancel" button on invoices where the connected wallet matches the creator address and status is Pending. Clicking it SHALL call `DELETE /invoices/:id` via the backend API.

#### Scenario: Successful cancellation
- **WHEN** the creator clicks "Cancel" and confirms the action
- **THEN** the invoice status updates to Cancelled in the dashboard

#### Scenario: Confirmation before cancel
- **WHEN** the user clicks "Cancel"
- **THEN** a confirmation dialog MUST appear before the API call is made

### Requirement: Transaction feedback
The UI SHALL display a loading spinner on action buttons while a transaction is pending and show a success or error toast notification on completion.

#### Scenario: Pending transaction state
- **WHEN** any contract transaction has been submitted but not yet confirmed
- **THEN** the triggering button shows a spinner and is disabled to prevent double-submission

#### Scenario: Transaction confirmed
- **WHEN** a transaction confirms on-chain
- **THEN** a success toast appears and the dashboard data refreshes automatically
