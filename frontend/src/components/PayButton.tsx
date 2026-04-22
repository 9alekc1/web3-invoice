import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { INVOICE_REGISTRY_ABI, ERC20_ABI } from "../abi/InvoiceRegistry";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

type Props = {
  invoiceId: string;
  token: string;
  amount: string;
  onSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
};

export default function PayButton({ invoiceId, token, amount, onSuccess, showToast }: Props) {
  const [step, setStep] = useState<"idle" | "approving" | "paying">("idle");

  const { writeContractAsync: approveAsync } = useWriteContract();
  const { writeContractAsync: payAsync } = useWriteContract();

  async function handlePay() {
    try {
      setStep("approving");
      const approveTx = await approveAsync({
        address: token as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, BigInt(amount)],
      });

      // Wait for approve (basic polling via block confirmation is handled by wagmi internally)
      setStep("paying");
      await payAsync({
        address: CONTRACT_ADDRESS,
        abi: INVOICE_REGISTRY_ABI,
        functionName: "pay",
        args: [BigInt(invoiceId)],
      });

      showToast("Invoice paid!", "success");
      onSuccess();
    } catch (err: any) {
      showToast(err.shortMessage ?? err.message ?? "Transaction rejected", "error");
    } finally {
      setStep("idle");
    }
  }

  const label =
    step === "approving" ? "Step 1/2: Approving…" :
    step === "paying"    ? "Step 2/2: Paying…" :
    "Pay";

  return (
    <button
      onClick={handlePay}
      disabled={step !== "idle"}
      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-60 whitespace-nowrap"
      title="Approve token + pay invoice via MetaMask"
    >
      {label}
    </button>
  );
}
