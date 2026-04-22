import { useState, useCallback } from 'react'
import Header from './components/Header'
import InvoiceDashboard from './components/InvoiceDashboard'
import CreateInvoiceModal from './components/CreateInvoiceModal'
import Toast from './components/Toast'

type ToastState = { message: string; type: 'success' | 'error' } | null

function App() {
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCreateClick={() => setShowModal(true)} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Invoices</h2>
            <p className="text-sm text-gray-500 mt-0.5">Invoices where you are creator or payer</p>
          </div>
          <InvoiceDashboard showToast={showToast} refreshKey={refreshKey} />
        </div>
      </main>

      {showModal && (
        <CreateInvoiceModal
          onClose={() => setShowModal(false)}
          onSuccess={refresh}
          showToast={showToast}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App
