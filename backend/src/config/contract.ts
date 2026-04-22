// Populated after: npx hardhat compile && npx hardhat run scripts/deploy.ts --network localhost
// Copy CONTRACT_ADDRESS to .env and update abi if contract changes.

export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS ?? "";

export const CONTRACT_ABI = [
  "function createInvoice(address payer, address token, uint256 amount, uint256 dueDate) external returns (uint256)",
  "function pay(uint256 invoiceId) external",
  "function cancel(uint256 invoiceId) external",
  "function getInvoice(uint256 invoiceId) external view returns (tuple(address creator, address payer, address token, uint256 amount, uint256 dueDate, uint8 status))",
  "event InvoiceCreated(uint256 indexed invoiceId, address indexed creator, address indexed payer, address token, uint256 amount, uint256 dueDate)",
  "event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 amount)",
  "event InvoiceCancelled(uint256 indexed invoiceId, address indexed creator)",
] as const;
