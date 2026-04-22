import { useState, FormEvent } from "react";
import { isAddress } from "viem";

const API_URL = import.meta.env.VITE_API_URL ?? "";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
};

export default function CreateInvoiceModal({ onClose, onSuccess, showToast }: Props) {
  const [payer, setPayer] = useState("");
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!payer) e.payer = "Required";
    else if (!isAddress(payer)) e.payer = "Invalid Ethereum address";
    if (!token) e.token = "Required";
    else if (!isAddress(token)) e.token = "Invalid Ethereum address";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = "Must be a positive number";
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payer, token, amount, dueDate: dueDate || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create invoice");
      showToast(`Invoice #${data.invoiceId} created!`, "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Create Invoice</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Payer Address" error={errors.payer}>
            <input className={input(errors.payer)} value={payer} onChange={(e) => setPayer(e.target.value)} placeholder="0x..." />
          </Field>
          <Field label="Token Address (ERC-20)" error={errors.token}>
            <input className={input(errors.token)} value={token} onChange={(e) => setToken(e.target.value)} placeholder="0x..." />
          </Field>
          <Field label="Amount (token smallest unit)" error={errors.amount}>
            <input className={input(errors.amount)} type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 1000000" />
          </Field>
          <Field label="Due Date (optional)">
            <input className={input()} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
              {loading ? "Creating…" : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

function input(error?: string) {
  const base = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  return error ? `${base} border-red-400` : `${base} border-gray-300`;
}
