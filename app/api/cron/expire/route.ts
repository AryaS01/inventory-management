import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
  })

  for (const reservation of expiredReservations) {
    await prisma.$transaction([
      prisma.stockLevel.update({
        where: { id: reservation.stockLevelId },
        data: { reserved: { decrement: reservation.quantity } },
      }),
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: "RELEASED" },
      }),
    ])
  }

  revalidatePath("/")

  return NextResponse.json({
    released: expiredReservations.length,
  })
}