import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import StatusBadge from "./StatusBadge";
import PayButton from "./PayButton";
import CancelButton from "./CancelButton";

const API_URL = import.meta.env.VITE_API_URL ?? "";

type Invoice = {
  invoiceId: string;
  creator: string;
  payer: string;
  token: string;
  amount: string;
  dueDate: string;
  status: string;
};

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

type Props = {
  showToast: (msg: string, type: "success" | "error") => void;
  refreshKey: number;
};

export default function InvoiceDashboard({ showToast, refreshKey }: Props) {
  const { address, isConnected } = useAccount();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [byCreator, byPayer] = await Promise.all([
        fetch(`${API_URL}/invoices?creator=${address}`).then((r) => r.json()),
        fetch(`${API_URL}/invoices?payer=${address}`).then((r) => r.json()),
      ]);
      const combined = [...byCreator, ...byPayer];
      const unique = Array.from(new Map(combined.map((i: Invoice) => [i.invoiceId, i])).values());
      setInvoices(unique.sort((a: Invoice, b: Invoice) => Number(a.invoiceId) - Number(b.invoiceId)));
    } catch {
      showToast("Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  }, [address, showToast]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices, refreshKey]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchInvoices, 10_000);
    return () => clearInterval(interval);
  }, [fetchInvoices]);

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-gray-500">
        Connect your wallet to view invoices.
      </div>
    );
  }

  if (loading && invoices.length === 0) {
    return <div className="text-center py-20 text-gray-400">Loading invoices…</div>;
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No invoices yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Payer</th>
            <th className="px-4 py-3 text-left">Token</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map((inv) => (
            <tr key={inv.invoiceId} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-gray-700">#{inv.invoiceId}</td>
              <td className="px-4 py-3 font-mono text-gray-600">{truncate(inv.payer)}</td>
              <td className="px-4 py-3 font-mono text-gray-600">{truncate(inv.token)}</td>
              <td className="px-4 py-3 text-right font-mono">{inv.amount}</td>
              <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
              <td className="px-4 py-3">
                {inv.status === "Pending" && (
                  <div className="flex gap-2 flex-wrap">
                    {inv.payer.toLowerCase() === address?.toLowerCase() && (
                      <PayButton
                        invoiceId={inv.invoiceId}
                        token={inv.token}
                        amount={inv.amount}
                        onSuccess={fetchInvoices}
                        showToast={showToast}
                      />
                    )}
                    {inv.creator.toLowerCase() === address?.toLowerCase() && (
                      <CancelButton
                        invoiceId={inv.invoiceId}
                        onSuccess={fetchInvoices}
                        showToast={showToast}
                      />
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
