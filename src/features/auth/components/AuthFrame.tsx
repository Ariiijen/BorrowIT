import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 lg:grid-cols-[3fr_2fr]">
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <Link to="/" className="text-lg font-bold tracking-tight" aria-label="BorrowIT home">
            Borrow<span className="text-emerald-700 dark:text-emerald-400">IT</span>
          </Link>
          <div className="mt-12">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden border-l border-zinc-200 bg-zinc-100 p-12 dark:border-zinc-800 dark:bg-zinc-900 lg:flex lg:items-end">
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(rgba(24,24,27,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.08) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="relative max-w-md border-l-2 border-emerald-600 pl-6">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Campus equipment, accounted for.</p>
          <p className="mt-3 text-2xl font-medium leading-snug text-zinc-800 dark:text-zinc-100">One clear record from the first request to the final return.</p>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">BorrowIT · USTP equipment services</p>
        </div>
      </aside>
    </main>
  )
}
