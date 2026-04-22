import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Header({ onCreateClick }: { onCreateClick: () => void }) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-900">On-Chain Invoices</h1>
      <div className="flex items-center gap-3">
        {isConnected && (
          <button
            onClick={onCreateClick}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + New Invoice
          </button>
        )}
        {isConnected ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1.5 rounded-lg">
              {truncate(address!)}
            </span>
            <button
              onClick={() => disconnect()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => connect({ connector: injected() })}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
