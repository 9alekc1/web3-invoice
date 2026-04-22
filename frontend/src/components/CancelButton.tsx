import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

type Props = {
  invoiceId: string;
  onSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
};

export default function CancelButton({ invoiceId, onSuccess, showToast }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleCancel() {
    setConfirming(false);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/invoices/${invoiceId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel");
      showToast("Invoice cancelled", "success");
      onSuccess();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex gap-1">
        <span className="text-xs text-gray-600">Cancel #{invoiceId}?</span>
        <button onClick={handleCancel} className="text-xs text-red-600 font-medium hover:underline">Yes</button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-500 hover:underline">No</button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={loading}
      className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-60"
    >
      {loading ? "Cancelling…" : "Cancel"}
    </button>
  );
}
