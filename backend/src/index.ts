import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import invoiceRoutes from "./routes/invoices";
import { hydrate } from "./sync/hydrate";
import { startListener } from "./sync/listener";

const app = express();
app.use(express.json());

app.use("/invoices", invoiceRoutes);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const reason = err?.reason ?? err?.message ?? "Unknown error";
  const status = err?.status ?? 500;
  res.status(status).json({ error: `Transaction failed: ${reason}` });
});

const PORT = Number(process.env.PORT ?? 3000);

async function start() {
  await hydrate();
  await startListener();
  app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("[server] startup error:", err);
  process.exit(1);
});

export { app };
