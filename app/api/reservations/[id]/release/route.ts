import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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