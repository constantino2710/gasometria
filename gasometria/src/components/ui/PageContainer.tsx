import type { ReactNode } from 'react'

type PageContainerProps = {
  children: ReactNode
  maxWidthClassName?: string
}

export function PageContainer({ children, maxWidthClassName = 'max-w-6xl' }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className={`mx-auto w-full ${maxWidthClassName}`}>{children}</div>
    </div>
  )
}
