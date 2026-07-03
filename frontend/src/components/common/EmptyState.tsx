interface EmptyStateProps {
  icon?: string
  message: string
  hint?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📋', message, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="text-base font-medium text-gray-700">{message}</p>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
