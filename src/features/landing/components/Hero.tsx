import { ArrowDownRight, ArrowUpRight, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[580px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_24px_70px_-36px_rgba(24,24,27,.34)] dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex h-11 items-center gap-1.5 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        <div className="ml-4 h-5 w-48 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="grid min-h-[330px] grid-cols-[124px_1fr] sm:min-h-[370px] sm:grid-cols-[145px_1fr]">
        <aside className="border-r border-zinc-100 p-3 dark:border-zinc-800 sm:p-4">
          <div className="mb-5 h-5 w-20 rounded bg-emerald-100 dark:bg-emerald-950" />
          {[0, 1, 2, 3].map((item) => <div key={item} className={`mb-2 flex h-8 items-center gap-2 rounded px-2 ${item === 0 ? 'bg-emerald-50 dark:bg-emerald-950/70' : ''}`}><span className={`h-3 w-3 rounded-sm ${item === 0 ? 'bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-700'}`} /><span className="h-2 w-12 rounded bg-zinc-200 dark:bg-zinc-700" /></div>)}
        </aside>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Overview</p><div className="mt-2 h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-700" /></div><div className="h-8 w-20 rounded-md bg-emerald-700" /></div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {['Available', 'On loan', 'Requests'].map((label, index) => <div key={label} className="rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700 sm:p-3"><p className="text-[9px] text-zinc-500 sm:text-[10px]">{label}</p><p className="mt-2 text-base font-semibold text-zinc-800 dark:text-zinc-100">{['--', '--', '--'][index]}</p></div>)}
          </div>
          <div className="mt-5 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700 sm:p-4">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Recent equipment</span><span className="text-[10px] text-zinc-400">View catalog</span></div>
            {[0, 1, 2].map((item) => <div key={item} className="mt-3 flex items-center gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800"><div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-zinc-800" /><div className="flex-1"><div className="h-2 w-24 rounded bg-zinc-200 dark:bg-zinc-700" /><div className="mt-1.5 h-1.5 w-16 rounded bg-zinc-100 dark:bg-zinc-800" /></div><span className="h-4 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950" /></div>)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[.92fr_1.08fr] lg:gap-12 lg:pb-24 lg:pt-24">
      <div className="max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"><GraduationCap size={15} /> Built for USTP students and faculty</div>
        <h1 className="mt-6 text-5xl font-semibold leading-[1.04] tracking-tight text-zinc-950 sm:text-6xl dark:text-white">Borrow smarter.<br />Return on time.</h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8 dark:text-zinc-400">BorrowIT replaces the paper logbook with a real-time equipment borrowing system. See what&apos;s available, request in seconds, and keep every handoff accounted for.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/register"><Button className="w-full sm:w-auto">Create free account <ArrowUpRight size={16} /></Button></Link>
          <a href="#how-it-works"><Button variant="outline" className="w-full sm:w-auto">See how it works <ArrowDownRight size={16} /></Button></a>
        </div>
        <div className="mt-11 border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">For the people who keep campus moving</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-zinc-500 sm:text-sm dark:text-zinc-400"><span>College of Engineering</span><span>IT Department</span><span>Library Services</span></div>
        </div>
      </div>
      <div className="lg:pl-2"><DashboardPreview /></div>
    </section>
  )
}
