import Link from "next/link"
import { prisma } from "@/lib/prisma"
import AutoRefresh from "./components/AutoRefresh"
export default async function Home() {
  const products = await prisma.product.findMany({
    include: {
      stockLevels: {
        include: {
          warehouse: true,
        },
      },
    },
  })

  return (
    <main className="min-h-screen bg-[#f9f7f4]">
      {/* Header */}
      <AutoRefresh />
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <span className="text-base font-semibold text-gray-700">
            Inventory Management
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Browse products
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Pick a product and warehouse to reserve stock.
        </p>

        <div className="flex flex-col gap-4">
          {products.map((product :any) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm"
            >
              <h2 className="text-base font-semibold text-gray-800">
                {product.name}
              </h2>
              {product.description && (
                <p className="text-sm text-gray-500 mt-0.5 mb-4">
                  {product.description}
                </p>
              )}

              <div className="flex flex-col gap-2 mt-3">
                {product.stockLevels.map((stock : any) => {
                  const available = stock.total - stock.reserved
                  const outOfStock = available === 0
                  const lowStock = available > 0 && available <= 2

                  return (
                    <div
                      key={stock.id}
                      className="flex items-center justify-between py-2 border-t border-gray-100"
                    >
                      <div>
                        <p className="text-sm text-gray-700">
                          {stock.warehouse.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {stock.warehouse.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {outOfStock ? (
                          <span className="text-xs text-red-400">
                            Out of stock
                          </span>
                        ) : lowStock ? (
                          <span className="text-xs text-amber-500">
                            Only {available} left
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {available} in stock
                          </span>
                        )}

                        {outOfStock ? (
                          <button
                            disabled
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                          >
                            Reserve
                          </button>
                        ) : (
                          <Link
                            href={`/reserve?stockLevelId=${stock.id}&product=${encodeURIComponent(product.name)}&warehouse=${encodeURIComponent(stock.warehouse.name)}&available=${available}`}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                          >
                            Reserve
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}