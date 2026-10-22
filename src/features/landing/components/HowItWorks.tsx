import { ArrowRight, CalendarDays, Check, Search } from 'lucide-react'

const steps = [
  { number: '01', title: 'Browse & request', description: 'Find what you need, choose your dates, and send a request.', icon: Search },
  { number: '02', title: 'Get approved', description: 'The equipment owner or administrator reviews the request.', icon: Check },
  { number: '03', title: 'Return & repeat', description: 'Record the return and condition. Your history stays clear.', icon: CalendarDays },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-xl"><p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">A straightforward handoff</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">From request to return, without the paper trail</h2></div>
        <div className="relative mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
          <div aria-hidden="true" className="absolute left-[12%] right-[12%] top-6 hidden h-px bg-zinc-200 md:block dark:bg-zinc-700" />
          {steps.map(({ number, title, description, icon: Icon }, index) => <article key={number} className="relative grid grid-cols-[52px_1fr] gap-4 md:block">
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">{number}</div>
            <div className="pb-2 md:pt-5"><div className="flex items-center gap-2"><Icon size={16} className="text-zinc-500 dark:text-zinc-400" /><h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>{index < 2 && <ArrowRight size={14} className="ml-auto text-zinc-300 md:hidden" />}</div><p className="mt-2 max-w-xs text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p></div>
          </article>)}
        </div>
      </div>
    </section>
  )
}
