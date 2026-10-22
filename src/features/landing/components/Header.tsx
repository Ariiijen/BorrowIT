import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Developers', href: '#developers' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="text-lg font-bold tracking-tight" aria-label="BorrowIT home">
          Borrow<span className="text-pink-700 dark:text-pink-400">IT</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {links.map((link) => <a key={link.href} href={link.href} className="rounded-sm text-sm text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-4 dark:text-zinc-400 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950">{link.label}</a>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login"><Button variant="ghost">Log in</Button></Link>
          <Link to="/register"><Button>Get started</Button></Link>
        </div>
        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 md:hidden dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {menuOpen && <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Site navigation">
        <button type="button" className="absolute inset-0 cursor-default bg-zinc-950/30" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
        <div className="absolute inset-y-0 right-0 flex w-[min(86vw,360px)] flex-col border-l border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-6 flex items-center justify-between"><span className="text-lg font-bold">Borrow<span className="text-pink-700 dark:text-pink-400">IT</span></span><button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={19} /></button></div>
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {links.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:text-zinc-200 dark:hover:bg-zinc-800">{link.label}</a>)}
          </nav>
          <div className="mt-auto grid grid-cols-2 gap-2">
            <Link to="/login" onClick={() => setMenuOpen(false)}><Button variant="outline" className="w-full">Log in</Button></Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}><Button className="w-full">Get started</Button></Link>
          </div>
        </div>
      </div>}
    </header>
  )
}
