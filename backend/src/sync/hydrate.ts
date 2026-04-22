import { ethers } from "ethers";
import db from "../lib/db";
import { getReadContract } from "../lib/contract";

export let lastProcessedBlock = 0;

export async function hydrate(fromBlock = 0) {
  const contract = getReadContract();
  const provider = contract.runner as ethers.Provider;
  const currentBlock = await (provider as ethers.JsonRpcProvider).getBlockNumber();

  const [created, paid, cancelled] = await Promise.all([
    contract.queryFilter(contract.filters.InvoiceCreated(), fromBlock, currentBlock),
    contract.queryFilter(contract.filters.InvoicePaid(), fromBlock, currentBlock),
    contract.queryFilter(contract.filters.InvoiceCancelled(), fromBlock, currentBlock),
  ]);

  // Build final status map: invoiceId → status
  const statusMap = new Map<bigint, string>();
  for (const e of created) {
    const args = (e as ethers.EventLog).args;
    statusMap.set(args.invoiceId, "Pending");
  }
  for (const e of paid) {
    const args = (e as ethers.EventLog).args;
    statusMap.set(args.invoiceId, "Paid");
  }
  for (const e of cancelled) {
    const args = (e as ethers.EventLog).args;
    statusMap.set(args.invoiceId, "Cancelled");
  }

  // Upsert from InvoiceCreated events
  for (const e of created) {
    const args = (e as ethers.EventLog).args;
    const invoiceId: bigint = args.invoiceId;
    await db.invoice.upsert({
      where: { invoiceId },
      create: {
        invoiceId,
        creator: args.creator.toLowerCase(),
        payer: args.payer.toLowerCase(),
        token: args.token.toLowerCase(),
        amount: args.amount.toString(),
        dueDate: args.dueDate,
        status: statusMap.get(invoiceId) ?? "Pending",
        txHash: e.transactionHash,
      },
      update: { status: statusMap.get(invoiceId) ?? "Pending" },
    });
  }

  lastProcessedBlock = currentBlock;
  console.log(`[hydrate] synced blocks 0–${currentBlock}, ${created.length} invoices`);
}
