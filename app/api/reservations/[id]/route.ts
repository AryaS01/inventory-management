import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  const action = url.pathname.split("/").pop()

  if (action === "confirm") {
    return handleConfirm(id)
  } else if (action === "release") {
    return handleRelease(id)
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

async function handleConfirm(id: string) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      )
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Reservation is no longer pending" },
        { status: 409 }
      )
    }

    // Check if reservation has expired
    if (new Date() > reservation.expiresAt) {
      // Release the stock back
      await prisma.stockLevel.update({
        where: { id: reservation.stockLevelId },
        data: { reserved: { decrement: reservation.quantity } },
      })

      await prisma.reservation.update({
        where: { id },
        data: { status: "RELEASED" },
      })

      return NextResponse.json(
        { error: "Reservation has expired" },
        { status: 410 }
      )
    }

    // Confirm — decrement total stock and reserved together
    await prisma.$transaction([
      prisma.stockLevel.update({
        where: { id: reservation.stockLevelId },
        data: {
          total: { decrement: reservation.quantity },
          reserved: { decrement: reservation.quantity },
        },
      }),
      prisma.reservation.update({
        where: { id },
        data: { status: "CONFIRMED" },
      }),
    ])

    const updated = await prisma.reservation.findUnique({
      where: { id },
      include: {
        stockLevel: {
          include: { product: true, warehouse: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to confirm reservation" },
      { status: 500 }
    )
  }
}

async function handleRelease(id: string) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      )
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Reservation is no longer pending" },
        { status: 409 }
      )
    }

    // Release — give the reserved units back
    await prisma.$transaction([
      prisma.stockLevel.update({
        where: { id: reservation.stockLevelId },
        data: { reserved: { decrement: reservation.quantity } },
      }),
      prisma.reservation.update({
        where: { id },
        data: { status: "RELEASED" },
      }),
    ])

    const updated = await prisma.reservation.findUnique({
      where: { id },
      include: {
        stockLevel: {
          include: { product: true, warehouse: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to release reservation" },
      { status: 500 }
    )
  }
}