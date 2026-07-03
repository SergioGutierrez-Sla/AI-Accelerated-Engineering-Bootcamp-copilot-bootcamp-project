type Strength = 'weak' | 'fair' | 'strong'

function computeStrength(password: string): Strength {
  if (!password) return 'weak'
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (score <= 2) return 'weak'
  if (score === 3) return 'fair'
  return 'strong'
}

const strengthConfig: Record<Strength, { label: string; barColor: string; textColor: string; width: string }> = {
  weak: { label: 'Weak', barColor: 'bg-red-500', textColor: 'text-red-600', width: 'w-1/3' },
  fair: { label: 'Fair', barColor: 'bg-yellow-500', textColor: 'text-yellow-600', width: 'w-2/3' },
  strong: { label: 'Strong', barColor: 'bg-green-500', textColor: 'text-green-600', width: 'w-full' },
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null

  const strength = computeStrength(password)
  const { label, barColor, textColor, width } = strengthConfig[strength]

  return (
    <div className="mt-1" aria-live="polite">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full transition-all duration-300 ${barColor} ${width}`} />
      </div>
      <p className="mt-1 text-xs text-gray-600">
        Password strength:{' '}
        <span className={`font-medium ${textColor}`}>{label}</span>
      </p>
    </div>
  )
}
