type Props = {
  timeLeft: number
}

export default function Countdown({ timeLeft }: Props) {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0")
  const seconds = String(timeLeft % 60).padStart(2, "0")
  const isUrgent = timeLeft <= 60 && timeLeft > 0

  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
        Time remaining
      </p>
      <p className={`text-2xl font-mono font-bold ${isUrgent ? "text-red-500" : "text-gray-800"}`}>
        {minutes}:{seconds}
      </p>
      {isUrgent && (
        <p className="text-xs text-red-400 mt-1">Expiring soon — confirm now</p>
      )}
    </div>
  )
}