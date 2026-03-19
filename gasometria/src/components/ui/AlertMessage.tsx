type AlertTone = 'error' | 'info'

type AlertMessageProps = {
  message: string
  tone?: AlertTone
}

const toneClassName: Record<AlertTone, string> = {
  error: 'border-red-300 bg-red-50 text-red-700',
  info: 'border-blue-300 bg-blue-50 text-blue-700',
}

export function AlertMessage({ message, tone = 'error' }: AlertMessageProps) {
  return <p className={`mb-4 rounded-xl border px-4 py-3 text-sm ${toneClassName[tone]}`}>{message}</p>
}
