// Generated from contracts/artifacts after `npx hardhat compile`
export const INVOICE_REGISTRY_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "payer", "type": "address" }, { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "dueDate", "type": "uint256" }],
    "name": "createInvoice",
    "outputs": [{ "internalType": "uint256", "name": "invoiceId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "invoiceId", "type": "uint256" }],
    "name": "pay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "invoiceId", "type": "uint256" }],
    "name": "cancel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "invoiceId", "type": "uint256" }],
    "name": "getInvoice",
    "outputs": [{ "components": [{ "internalType": "address", "name": "creator", "type": "address" }, { "internalType": "address", "name": "payer", "type": "address" }, { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "dueDate", "type": "uint256" }, { "internalType": "enum InvoiceRegistry.Status", "name": "status", "type": "uint8" }], "internalType": "struct InvoiceRegistry.Invoice", "name": "", "type": "tuple" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "uint256", "name": "invoiceId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "creator", "type": "address" }, { "indexed": true, "internalType": "address", "name": "payer", "type": "address" }, { "indexed": false, "internalType": "address", "name": "token", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "dueDate", "type": "uint256" }],
    "name": "InvoiceCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "uint256", "name": "invoiceId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "payer", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "InvoicePaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "uint256", "name": "invoiceId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "creator", "type": "address" }],
    "name": "InvoiceCancelled",
    "type": "event"
  }
] as const;

export const ERC20_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
