import { Suspense } from "react"
import ReserveContent from "./ReserveContent"

export default function ReservePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#f9f7f4] flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    }>
      <ReserveContent />
    </Suspense>
  )
}