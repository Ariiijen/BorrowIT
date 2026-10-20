import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function CTA() {
  return (
    <section className="bg-zinc-950 py-16 text-white sm:py-20">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 sm:px-8 md:flex-row md:items-center">
        <div><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to stop losing equipment?</h2><p className="mt-3 text-sm text-zinc-400 sm:text-base">Make every campus handoff easy to find and easy to trust.</p></div>
        <Link to="/register"><Button className="shrink-0 border-emerald-500 bg-emerald-600 hover:bg-emerald-500">Get started — it&apos;s free <ArrowRight size={16} /></Button></Link>
      </div>
    </section>
  )
}
