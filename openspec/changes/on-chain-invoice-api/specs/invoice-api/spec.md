## ADDED Requirements

### Requirement: Create invoice endpoint
The API SHALL expose `POST /invoices` that accepts a JSON body with `payer`, `token`, `amount`, and optional `dueDate`. It MUST submit a `createInvoice` transaction to the contract, wait for confirmation, and return the created invoice object including the on-chain `invoiceId` and `txHash`.

#### Scenario: Successful invoice creation
- **WHEN** `POST /invoices` is called with valid `payer`, `token`, and `amount` fields
- **THEN** the API returns HTTP 201 with `{ invoiceId, creator, payer, token, amount, dueDate, status: "Pending", txHash }`

#### Scenario: Missing required fields
- **WHEN** `POST /invoices` is called without `payer`, `token`, or `amount`
- **THEN** the API returns HTTP 400 with `{ error: "<field> is required" }`

#### Scenario: Invalid Ethereum address
- **WHEN** `POST /invoices` is called with a malformed `payer` or `token` address
- **THEN** the API returns HTTP 400 with `{ error: "Invalid Ethereum address" }`

### Requirement: Get invoice endpoint
The API SHALL expose `GET /invoices/:id` that returns the current state of a single invoice, reading from the off-chain SQLite cache.

#### Scenario: Existing invoice
- **WHEN** `GET /invoices/:id` is called with a valid invoice ID
- **THEN** the API returns HTTP 200 with the full invoice object

#### Scenario: Non-existent invoice
- **WHEN** `GET /invoices/:id` is called with an ID not in the cache
- **THEN** the API returns HTTP 404 with `{ error: "Invoice not found" }`

### Requirement: List invoices endpoint
The API SHALL expose `GET /invoices` with optional query parameters `creator` and `payer` (Ethereum addresses) to filter results from the SQLite cache. Both filters MAY be combined.

#### Scenario: List all invoices
- **WHEN** `GET /invoices` is called with no query params
- **THEN** the API returns HTTP 200 with an array of all invoices

#### Scenario: Filter by creator
- **WHEN** `GET /invoices?creator=0x...` is called
- **THEN** only invoices where `creator` matches are returned

#### Scenario: Filter by payer
- **WHEN** `GET /invoices?payer=0x...` is called
- **THEN** only invoices where `payer` matches are returned

### Requirement: Cancel invoice endpoint
The API SHALL expose `DELETE /invoices/:id` that submits a `cancel(invoiceId)` transaction to the contract using the backend's signing wallet (which MUST be the invoice creator). It MUST wait for confirmation and return the updated invoice.

#### Scenario: Successful cancellation
- **WHEN** `DELETE /invoices/:id` is called for a Pending invoice created by the backend wallet
- **THEN** the API returns HTTP 200 with the invoice showing `status: "Cancelled"` and `txHash`

#### Scenario: Invoice not cancellable
- **WHEN** `DELETE /invoices/:id` is called on a Paid or already-Cancelled invoice
- **THEN** the API returns HTTP 409 with `{ error: "Invoice cannot be cancelled" }`

### Requirement: API error handling
The API SHALL return consistent JSON error responses for all failure cases. Unhandled contract reverts MUST be caught and returned as HTTP 500 with a sanitized message (no raw stack traces).

#### Scenario: Contract revert propagation
- **WHEN** the contract transaction reverts for any reason
- **THEN** the API returns HTTP 500 with `{ error: "Transaction failed: <revert reason>" }`
