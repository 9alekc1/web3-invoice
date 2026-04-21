## ADDED Requirements

### Requirement: Invoice creation
The contract SHALL allow any address (the creator) to create an invoice by specifying a payer address, ERC-20 token address, amount (in token's smallest unit), and an optional due date (Unix timestamp, 0 = no deadline). Each invoice MUST be assigned a unique auto-incrementing `invoiceId` starting at 1.

#### Scenario: Successful invoice creation
- **WHEN** a caller submits a valid `createInvoice(payer, token, amount, dueDate)` call
- **THEN** the contract stores the invoice with status `Pending`, emits `InvoiceCreated(invoiceId, creator, payer, token, amount, dueDate)`, and returns the `invoiceId`

#### Scenario: Zero amount rejected
- **WHEN** a caller submits `createInvoice` with `amount == 0`
- **THEN** the transaction MUST revert with reason `"Amount must be > 0"`

#### Scenario: Zero address payer rejected
- **WHEN** a caller submits `createInvoice` with `payer == address(0)`
- **THEN** the transaction MUST revert with reason `"Invalid payer"`

### Requirement: ERC-20 settlement
The contract SHALL allow the designated payer (and only the payer) to settle a `Pending` invoice by calling `pay(invoiceId)`. The contract MUST use `IERC20.transferFrom(payer, creator, amount)` to move tokens. The invoice status MUST change to `Paid` after a successful transfer.

#### Scenario: Successful payment
- **WHEN** the payer has approved the contract for at least `amount` tokens and calls `pay(invoiceId)`
- **THEN** tokens transfer from payer to creator, status becomes `Paid`, and `InvoicePaid(invoiceId, payer, amount)` is emitted

#### Scenario: Non-payer payment rejected
- **WHEN** any address other than the designated payer calls `pay(invoiceId)`
- **THEN** the transaction MUST revert with reason `"Not the payer"`

#### Scenario: Payment on non-Pending invoice rejected
- **WHEN** `pay(invoiceId)` is called on an invoice whose status is `Paid` or `Cancelled`
- **THEN** the transaction MUST revert with reason `"Invoice not payable"`

#### Scenario: Insufficient allowance rejected
- **WHEN** the payer calls `pay(invoiceId)` but has not approved sufficient tokens
- **THEN** the `transferFrom` call reverts (token contract error propagated)

### Requirement: Invoice cancellation
The contract SHALL allow only the invoice creator to cancel a `Pending` invoice by calling `cancel(invoiceId)`. Status MUST change to `Cancelled`.

#### Scenario: Successful cancellation
- **WHEN** the creator calls `cancel(invoiceId)` on a `Pending` invoice
- **THEN** status becomes `Cancelled` and `InvoiceCancelled(invoiceId, creator)` is emitted

#### Scenario: Non-creator cancellation rejected
- **WHEN** any address other than the creator calls `cancel(invoiceId)`
- **THEN** the transaction MUST revert with reason `"Not the creator"`

#### Scenario: Cancellation of non-Pending invoice rejected
- **WHEN** `cancel(invoiceId)` is called on a `Paid` or `Cancelled` invoice
- **THEN** the transaction MUST revert with reason `"Cannot cancel"`

### Requirement: Invoice read access
The contract SHALL expose a public `getInvoice(invoiceId)` view function returning all stored invoice fields: `creator`, `payer`, `token`, `amount`, `dueDate`, `status`.

#### Scenario: Read existing invoice
- **WHEN** `getInvoice(invoiceId)` is called with a valid ID
- **THEN** all fields are returned correctly

#### Scenario: Read non-existent invoice
- **WHEN** `getInvoice(invoiceId)` is called with an ID that has never been created
- **THEN** all fields return zero values (address(0), 0, etc.) — no revert
