import { ethers } from "ethers";
import db from "../lib/db";
import { getReadContract } from "../lib/contract";
import { hydrate, lastProcessedBlock } from "./hydrate";
import { resetProvider } from "../lib/provider";

let _contract: ethers.Contract | null = null;

async function attachListeners(contract: ethers.Contract) {
  contract.on("InvoiceCreated", async (invoiceId, creator, payer, token, amount, dueDate, event) => {
    await db.invoice.upsert({
      where: { invoiceId },
      create: {
        invoiceId,
        creator: creator.toLowerCase(),
        payer: payer.toLowerCase(),
        token: token.toLowerCase(),
        amount: amount.toString(),
        dueDate,
        status: "Pending",
        txHash: event.log.transactionHash,
      },
      update: {},
    });
  });

  contract.on("InvoicePaid", async (invoiceId) => {
    await db.invoice.updateMany({ where: { invoiceId }, data: { status: "Paid" } });
  });

  contract.on("InvoiceCancelled", async (invoiceId) => {
    await db.invoice.updateMany({ where: { invoiceId }, data: { status: "Cancelled" } });
  });

  const provider = contract.runner! as ethers.JsonRpcProvider;
  (provider as any).on("error", handleDisconnect);
}

async function handleDisconnect() {
  console.warn("[listener] provider disconnected — reconnecting in 3s");
  if (_contract) {
    await _contract.removeAllListeners();
    _contract = null;
  }
  await new Promise((r) => setTimeout(r, 3000));
  resetProvider();
  await hydrate(lastProcessedBlock);
  await startListener();
}

export async function startListener() {
  _contract = getReadContract();
  await attachListeners(_contract);
  console.log("[listener] subscribed to InvoiceCreated / InvoicePaid / InvoiceCancelled");
}
