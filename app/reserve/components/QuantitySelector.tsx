type Props = {
  quantity: number
  available: number
  onChange: (q: number) => void
}

export default function QuantitySelector({ quantity, available, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-lg"
      >
        −
      </button>
      <span className="text-base font-medium text-gray-800 w-6 text-center">
        {quantity}
      </span>
      <button
        onClick={() => onChange(Math.min(available, quantity + 1))}
        disabled={quantity >= available}
        className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-lg"
      >
        +
      </button>
      <span className="text-xs text-gray-400">{available} available</span>
    </div>
  )
}