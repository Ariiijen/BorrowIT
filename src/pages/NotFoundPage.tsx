import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return <main className="flex min-h-screen items-center justify-center bg-white px-5 text-zinc-950 dark:bg-zinc-950 dark:text-white"><div className="max-w-md text-center"><p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">404 · Page not found</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">This page isn&apos;t here.</h1><p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">The link may be outdated, or the page may have moved.</p><Link to="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Return to BorrowIT</Link></div></main>
}
