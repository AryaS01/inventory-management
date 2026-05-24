import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
export async function POST(request: NextRequest) {
  try {
    const idempotencyKey = request.headers.get("idempotency-key")
     if (idempotencyKey) {
      const cached = await redis.get(`idempotency:reserve:${idempotencyKey}`)
      if (cached) {
        return NextResponse.json(cached, { status: 200 })
      }
    }

    const body = await request.json()
    const { stockLevelId, quantity } = body

    if (!stockLevelId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "stockLevelId and quantity are required" },
        { status: 400 }
      )
    }

   const reservation = await prisma.$transaction(async (tx: any) => {
      // Lock the stock level row so no other request can read/modify it
      // until this transaction completes
      const stockLevel = await tx.$queryRaw`
  SELECT id, total, reserved
  FROM "StockLevel"
  WHERE id = ${stockLevelId}
  FOR UPDATE
` as { id: string; total: number; reserved: number }[]

      if (stockLevel.length === 0) {
        throw new Error("STOCK_NOT_FOUND")
      }

      const stock = stockLevel[0]
      const available = stock.total - stock.reserved

      if (available < quantity) {
        throw new Error("INSUFFICIENT_STOCK")
      }

      // Increment reserved count
      await tx.stockLevel.update({
        where: { id: stockLevelId },
        data: { reserved: { increment: quantity } },
      })

      // Create the reservation with 10 seconds expiry
      const expiresAt = new Date(Date.now() + 10 * 1000)

      const newReservation = await tx.reservation.create({
        data: {
          stockLevelId,
          quantity,
          expiresAt,
        },
        include: {
          stockLevel: {
            include: {
              product: true,
              warehouse: true,
            },
          },
        },
      })

      return newReservation
    })

      if (idempotencyKey) {
      await redis.set(
        `idempotency:reserve:${idempotencyKey}`,
        reservation,
        { ex: 60 * 60 * 24 }
      )
    }

    revalidatePath("/")
    return NextResponse.json(reservation, { status: 201 })
  } catch (error: any) {
    if (error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 409 }
      )
    }
    if (error.message === "STOCK_NOT_FOUND") {
      return NextResponse.json(
        { error: "Stock level not found" },
        { status: 404 }
      )
    }
    console.error(error)
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    )
  }
}