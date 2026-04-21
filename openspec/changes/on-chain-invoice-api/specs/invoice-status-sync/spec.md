## ADDED Requirements

### Requirement: Startup hydration
On backend startup the sync service SHALL query all historical `InvoiceCreated`, `InvoicePaid`, and `InvoiceCancelled` events from the contract's deployment block to the current block, and MUST upsert the resulting invoice state into the SQLite cache before the HTTP server begins accepting requests.

#### Scenario: Fresh database hydration
- **WHEN** the backend starts with an empty SQLite database and a contract with existing on-chain invoices
- **THEN** all invoices are loaded into the cache before the first HTTP request is served

#### Scenario: Hydration with existing cache
- **WHEN** the backend restarts and the cache already contains invoices
- **THEN** any invoices created or updated since the last run are upserted without duplicating existing records

### Requirement: Real-time event listening
After hydration the sync service SHALL subscribe to `InvoiceCreated`, `InvoicePaid`, and `InvoiceCancelled` contract events and update the SQLite cache within one block confirmation of each event.

#### Scenario: New invoice created on-chain
- **WHEN** an `InvoiceCreated` event is emitted by the contract
- **THEN** the cache is updated with the new invoice record (status `Pending`) within one block

#### Scenario: Invoice paid on-chain
- **WHEN** an `InvoicePaid` event is emitted
- **THEN** the cached invoice's status is updated to `Paid`

#### Scenario: Invoice cancelled on-chain
- **WHEN** an `InvoiceCancelled` event is emitted
- **THEN** the cached invoice's status is updated to `Cancelled`

### Requirement: Sync resilience
The sync service SHALL reconnect and re-hydrate from the last known block if the WebSocket / polling connection to the RPC provider is dropped, without requiring a full application restart.

#### Scenario: Provider disconnection and reconnect
- **WHEN** the RPC connection is interrupted and then restored
- **THEN** the service resumes event listening from the last processed block and catches up on any missed events

#### Scenario: Missed events on reconnect
- **WHEN** events were emitted while the connection was down
- **THEN** those events are replayed during catch-up hydration and the cache reflects the correct final state
