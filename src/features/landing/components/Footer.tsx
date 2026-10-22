import { Github, Twitter } from 'lucide-react'
import { Link } from 'react-router-dom'

const groups = [
  { title: 'Product', links: [['Features', '#features'], ['Pricing', 'mailto:borrowit@ustp.edu.ph?subject=BorrowIT%20pricing'], ['Changelog', 'mailto:borrowit@ustp.edu.ph?subject=BorrowIT%20updates']] },
  { title: 'Company', links: [['About', '#about'], ['Developers', '#developers'], ['Contact', 'mailto:borrowit@ustp.edu.ph'], ['Careers', 'mailto:borrowit@ustp.edu.ph?subject=Careers']] },
  { title: 'Resources', links: [['Docs', 'mailto:borrowit@ustp.edu.ph?subject=Documentation'], ['Support', 'mailto:borrowit@ustp.edu.ph?subject=Support'], ['Status', 'mailto:borrowit@ustp.edu.ph?subject=Service%20status']] },
  { title: 'Legal', links: [['Privacy', '#privacy'], ['Terms', '#terms']] },
]

export function Footer() {
  return (
    <footer id="about" className="bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 sm:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-9 md:grid-cols-4">
          {groups.map((group) => <div key={group.title}><h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-100">{group.title}</h3><ul className="mt-4 space-y-3">{group.links.map(([label, href]) => <li key={label}><a href={href} className="text-sm text-zinc-400 transition-colors hover:text-white">{label}</a></li>)}</ul></div>)}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-zinc-800 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 BorrowIT. Built by Group 4 at USTP.</p>
          <div className="flex items-center gap-4"><a href="https://github.com" aria-label="GitHub" className="hover:text-white"><Github size={16} /></a><a href="https://x.com" aria-label="X" className="hover:text-white"><Twitter size={16} /></a><Link to="/login" className="hover:text-white">Log in</Link></div>
        </div>
      </div>
    </footer>
  )
}
