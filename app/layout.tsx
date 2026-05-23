import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Allo Inventory",
  description: "Multi-warehouse inventory and order fulfillment",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <body style={{ backgroundColor: "#f9f7f4", colorScheme: "light" }} className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  )
}