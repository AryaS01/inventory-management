"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import QuantitySelector from "./components/QuantitySelector"
import Countdown from "./components/Countdown"
import DoneScreen from "./components/DoneScreen"

type Reservation = {
  id: string
  expiresAt: string
}

export default function ReservePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const stockLevelId = searchParams.get("stockLevelId")
  const productName = searchParams.get("product")
  const warehouseName = searchParams.get("warehouse")
  const available = Number(searchParams.get("available") || 1)

  const [quantity, setQuantity] = useState(1)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<"confirmed" | "released" | null>(null)

  useEffect(() => {
  if (!reservation) return
  const interval = setInterval(() => {
    const left = Math.floor(
      (new Date(reservation.expiresAt).getTime() - Date.now()) / 1000
    )
    if (left <= 0) {
      clearInterval(interval)
      // Actually release the stock in the database
      fetch(`/api/reservations/${reservation.id}/release`, { method: "POST" })
      setError("Your reservation has expired. The stock has been released.")
      setReservation(null)
    } else {
      setTimeLeft(left)
    }
  }, 1000)
  return () => clearInterval(interval)
}, [reservation])

  async function handleReserve() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockLevelId, quantity }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || "Failed to reserve")
      setReservation(data)
    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reservations/${reservation!.id}/confirm`, {
        method: "POST",
      })
      if (res.status === 410) {
        setError("Your reservation expired before you could confirm.")
        return setReservation(null)
      }
      if (!res.ok) {
        const data = await res.json()
        return setError(data.error || "Failed to confirm")
      }
      setDone("confirmed")
    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    setLoading(true)
    try {
      await fetch(`/api/reservations/${reservation!.id}/release`, { method: "POST" })
      setDone("released")
    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function handleBack() {
    if (reservation) {
      await fetch(`/api/reservations/${reservation.id}/release`, { method: "POST" })
    }
    window.location.href = "/"
  }

  if (done) {
    return (
      <DoneScreen
        type={done}
        productName={productName}
        warehouseName={warehouseName}
        quantity={quantity}
      />
    )
  }

  return (
    <main className="min-h-screen bg-[#f9f7f4]">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <span className="text-base font-semibold text-gray-700">
            Inventory Management
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-10">
        <button
          onClick={handleBack}
          className="text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Reserve item
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Pick a quantity and confirm within 10 minutes.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
            <button
              onClick={() => window.location.href = "/"}
              className="block mt-2 underline text-xs"
            >
              Go back
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-6 flex flex-col gap-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Product</p>
            <p className="text-base font-semibold text-gray-800">{productName}</p>
            <p className="text-sm text-gray-500">{warehouseName}</p>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Quantity</p>
            {!reservation ? (
              <QuantitySelector
                quantity={quantity}
                available={available}
                onChange={setQuantity}
              />
            ) : (
              <p className="text-base text-gray-800">
                {quantity} unit{quantity > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {reservation && (
            <div className="border-t border-gray-100 pt-5">
              <Countdown timeLeft={timeLeft} />
            </div>
          )}

          <div className="border-t border-gray-100 pt-5">
            {!reservation ? (
              <button
                onClick={handleReserve}
                disabled={loading}
                className="w-full text-sm py-2.5 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Holding..." : `Reserve ${quantity} unit${quantity > 1 ? "s" : ""}`}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 text-sm py-2.5 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm purchase"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 text-sm py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}