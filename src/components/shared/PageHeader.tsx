import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  )
}
