import { BarChart3, Bell, ClipboardCheck, ShieldCheck, Users, Zap } from 'lucide-react'

const features = [
  { icon: Zap, title: 'Real-time availability', description: "See exactly what's available right now, not what was available yesterday." },
  { icon: ShieldCheck, title: 'Double-booking prevention', description: 'Date overlap checks block conflicting requests before a loan is confirmed.' },
  { icon: ClipboardCheck, title: 'Accountability built in', description: 'Every borrow, return, and condition note stays on the equipment record.' },
  { icon: Users, title: 'Two-sided lending', description: 'Students can lend their own gear. Admins can manage school assets.' },
  { icon: Bell, title: 'Useful notifications', description: 'Get updates when a request is reviewed or a return date is approaching.' },
  { icon: BarChart3, title: 'Reports that matter', description: 'Review overdue items, frequent borrowers, and equipment utilization.' },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-y border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/40 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl"><p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">The essentials, in one place</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">Everything you need to manage campus equipment</h2></div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors duration-150 hover:border-emerald-500/50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-700"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"><Icon size={19} strokeWidth={1.8} /></div><h3 className="mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p></article>)}
        </div>
      </div>
    </section>
  )
}
