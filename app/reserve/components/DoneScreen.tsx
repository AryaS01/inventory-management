type Props = {
  type: "confirmed" | "released"
  productName: string | null
  warehouseName: string | null
  quantity: number
}

export default function DoneScreen({ type, productName, warehouseName, quantity }: Props) {
  return (
    <main className="min-h-screen bg-[#f9f7f4] flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10 max-w-md w-full text-center">
        {type === "confirmed" ? (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Order confirmed</h2>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{quantity}x {productName}</strong> from {warehouseName} is yours.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Reservation cancelled</h2>
            <p className="text-sm text-gray-500 mb-6">
              The stock has been released and is available again.
            </p>
          </>
        )}
        <button
          onClick={() => window.location.href = "/"}
          className="text-sm px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          Back to products
        </button>
      </div>
    </main>
  )
}