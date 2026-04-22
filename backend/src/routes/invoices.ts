import { Router, Request, Response, NextFunction } from "express";
import { ethers } from "ethers";
import db from "../lib/db";
import { getWriteContract } from "../lib/contract";

const router = Router();

function isAddress(val: unknown): val is string {
  return typeof val === "string" && ethers.isAddress(val);
}

// POST /invoices
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const { payer, token, amount, dueDate } = req.body;
  if (!payer) return res.status(400).json({ error: "payer is required" }) as any;
  if (!token) return res.status(400).json({ error: "token is required" }) as any;
  if (!amount) return res.status(400).json({ error: "amount is required" }) as any;
  if (!isAddress(payer) || !isAddress(token)) {
    return res.status(400).json({ error: "Invalid Ethereum address" }) as any;
  }

  try {
    const contract = getWriteContract();
    const amountBN = BigInt(amount);
    const dueDateBN = dueDate ? BigInt(Math.floor(new Date(dueDate).getTime() / 1000)) : 0n;

    const tx = await contract.createInvoice(payer, token, amountBN, dueDateBN);
    const receipt = await tx.wait();

    const iface = contract.interface;
    const log = receipt.logs
      .map((l: any) => { try { return iface.parseLog(l); } catch { return null; } })
      .find((e: any) => e?.name === "InvoiceCreated");

    const invoiceId = log?.args.invoiceId ?? 0n;

    const record = await db.invoice.upsert({
      where: { invoiceId },
      create: {
        invoiceId,
        creator: log?.args.creator ?? "",
        payer,
        token,
        amount: amount.toString(),
        dueDate: dueDateBN,
        status: "Pending",
        txHash: receipt.hash,
      },
      update: { txHash: receipt.hash },
    });

    return res.status(201).json(serialise(record));
  } catch (err: any) {
    next(err);
  }
});

// GET /invoices
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const { creator, payer } = req.query;
  if (creator && !isAddress(creator)) return res.status(400).json({ error: "Invalid Ethereum address" }) as any;
  if (payer && !isAddress(payer)) return res.status(400).json({ error: "Invalid Ethereum address" }) as any;

  try {
    const where: any = {};
    if (creator) where.creator = (creator as string).toLowerCase();
    if (payer) where.payer = (payer as string).toLowerCase();

    const records = await db.invoice.findMany({ where, orderBy: { invoiceId: "asc" } });
    return res.json(records.map(serialise));
  } catch (err) {
    next(err);
  }
});

// GET /invoices/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await db.invoice.findUnique({ where: { invoiceId: BigInt(req.params.id) } });
    if (!record) return res.status(404).json({ error: "Invoice not found" }) as any;
    return res.json(serialise(record));
  } catch (err) {
    next(err);
  }
});

// DELETE /invoices/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = BigInt(req.params.id);
    const record = await db.invoice.findUnique({ where: { invoiceId } });
    if (!record) return res.status(404).json({ error: "Invoice not found" }) as any;
    if (record.status !== "Pending") return res.status(409).json({ error: "Invoice cannot be cancelled" }) as any;

    const contract = getWriteContract();
    const tx = await contract.cancel(invoiceId);
    const receipt = await tx.wait();

    const updated = await db.invoice.update({
      where: { invoiceId },
      data: { status: "Cancelled", txHash: receipt.hash },
    });

    return res.json(serialise(updated));
  } catch (err: any) {
    next(err);
  }
});

function serialise(r: any) {
  return {
    ...r,
    invoiceId: r.invoiceId.toString(),
    dueDate: r.dueDate.toString(),
  };
}

export default router;
