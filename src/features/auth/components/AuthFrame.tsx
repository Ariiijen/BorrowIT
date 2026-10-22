import { ArrowRight, ClipboardCheck, PackageCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-stone-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
        <div className="w-full max-w-[520px] rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_24px_80px_-40px_rgba(24,24,27,.28)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2.5 rounded-sm text-base font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500" aria-label="BorrowIT home">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-700 text-sm font-bold text-white shadow-sm">B</span>
              <span>Borrow<span className="text-pink-700 dark:text-pink-400">IT</span></span>
            </Link>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">USTP equipment services</span>
          </div>
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
            <p className="mt-1.5 text-sm leading-5 text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
      <aside className="relative hidden min-h-screen overflow-hidden border-l border-zinc-200 bg-gradient-to-br from-rose-100 via-stone-100 to-zinc-100 p-12 dark:border-zinc-800 dark:from-rose-950/40 dark:via-zinc-900 dark:to-zinc-950 lg:flex lg:items-center lg:justify-center">
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-700/10" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-rose-200/50 blur-3xl dark:bg-rose-800/10" />
        <div className="relative w-full max-w-lg">
          <p className="text-sm font-semibold text-pink-800 dark:text-pink-300">BorrowIT · USTP</p>
          <h2 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-white">Campus equipment, without the paper trail.</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-300">One clear place to request, lend, and keep track of the things that help you learn.</p>
          <div className="mt-9 space-y-3">
            <div className="flex items-center gap-4 rounded-xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-700/70 dark:bg-zinc-900/70">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300"><ClipboardCheck size={19} /></span>
              <div className="flex-1"><p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Requests made clear</p><p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">See what you need and where it stands.</p></div>
              <ArrowRight size={16} className="text-zinc-400" />
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-700/70 dark:bg-zinc-900/70">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"><PackageCheck size={19} /></span>
              <div className="flex-1"><p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Every handoff accounted for</p><p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">Keep equipment details and history together.</p></div>
              <ArrowRight size={16} className="text-zinc-400" />
            </div>
          </div>
          <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-400">A simpler way to share campus resources.</p>
        </div>
      </aside>
    </main>
  )
}
