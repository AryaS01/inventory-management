import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // Clean existing data
  await prisma.reservation.deleteMany()
  await prisma.stockLevel.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.product.deleteMany()

  // Create warehouses
  const mumbai = await prisma.warehouse.create({
  data: { name: "Andheri Warehouse", location: "Andheri East, Mumbai" },
})

const delhi = await prisma.warehouse.create({
  data: { name: "Connaught Place Warehouse", location: "Connaught Place, New Delhi" },
})

const bangalore = await prisma.warehouse.create({
  data: { name: "Whitefield Warehouse", location: "Whitefield, Bengaluru" },
})

  // Create products
  const sneakers = await prisma.product.create({
    data: { name: "Classic Sneakers", description: "Everyday comfort sneakers in white and grey" },
  })

  const backpack = await prisma.product.create({
    data: { name: "Urban Backpack", description: "Lightweight 30L backpack with laptop sleeve" },
  })

  const watch = await prisma.product.create({
    data: { name: "Minimal Watch", description: "Clean dial, leather strap, water resistant" },
  })

  const headphones = await prisma.product.create({
    data: { name: "Wireless Headphones", description: "40hr battery, active noise cancellation" },
  })

  // Create stock levels (product + warehouse combinations)
  await prisma.stockLevel.createMany({
    data: [
      // Sneakers
      { productId: sneakers.id, warehouseId: mumbai.id,     total: 10, reserved: 0 },
      { productId: sneakers.id, warehouseId: delhi.id,      total: 5,  reserved: 0 },
      { productId: sneakers.id, warehouseId: bangalore.id,  total: 2,  reserved: 0 },

      // Backpack
      { productId: backpack.id, warehouseId: mumbai.id,     total: 8,  reserved: 0 },
      { productId: backpack.id, warehouseId: delhi.id,      total: 3,  reserved: 0 },

      // Watch
      { productId: watch.id,    warehouseId: mumbai.id,     total: 1,  reserved: 0 },
      { productId: watch.id,    warehouseId: bangalore.id,  total: 4,  reserved: 0 },

      // Headphones
      { productId: headphones.id, warehouseId: delhi.id,    total: 6,  reserved: 0 },
      { productId: headphones.id, warehouseId: bangalore.id,total: 1,  reserved: 0 },
    ],
  })

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })