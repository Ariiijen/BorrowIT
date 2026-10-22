import { Bell, BookOpenCheck, ClipboardList, FileBarChart2, LayoutDashboard, Laptop, LogOut, Menu, Shield, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { UserRole } from '@/types'

const navigation: Record<UserRole, { label: string; to: string; icon: typeof LayoutDashboard }[]> = {
  Borrower: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Browse equipment', to: '/equipment', icon: Laptop },
    { label: 'My requests', to: '/requests', icon: ClipboardList },
    { label: 'History', to: '/history', icon: BookOpenCheck },
    { label: 'Notifications', to: '/notifications', icon: Bell },
  ],
  Faculty: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Browse equipment', to: '/equipment', icon: Laptop },
    { label: 'My requests', to: '/requests', icon: ClipboardList },
    { label: 'History', to: '/history', icon: BookOpenCheck },
    { label: 'Notifications', to: '/notifications', icon: Bell },
  ],
  Lender: [
    { label: 'Dashboard', to: '/lender/dashboard', icon: LayoutDashboard },
    { label: 'My listings', to: '/equipment', icon: Laptop },
    { label: 'Incoming requests', to: '/requests', icon: ClipboardList },
    { label: 'Track lent items', to: '/lender/dashboard#lent', icon: BookOpenCheck },
    { label: 'History', to: '/history', icon: ClipboardList },
    { label: 'Notifications', to: '/notifications', icon: Bell },
  ],
  Admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manage equipment', to: '/equipment', icon: Laptop },
    { label: 'Manage users', to: '/admin/users', icon: Users },
    { label: 'Approve requests', to: '/requests', icon: ClipboardList },
    { label: 'Disputes', to: '/disputes', icon: Shield },
    { label: 'Reports', to: '/reports', icon: FileBarChart2 },
    { label: 'Notifications', to: '/notifications', icon: Bell },
  ],
}

function NavItems({ items, close }: { items: (typeof navigation)[UserRole]; close?: () => void }) {
  return <nav className="space-y-1" aria-label="Workspace navigation">
    {items.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} onClick={close} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 ${isActive ? 'bg-pink-50 text-pink-900 dark:bg-pink-950 dark:text-pink-300' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'}`}><Icon size={17} strokeWidth={1.8} />{label}</NavLink>)}
  </nav>
}

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = navigation[profile?.role ?? 'Borrower']

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('You have been signed out.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not sign out.')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950 lg:flex">
        <div className="mb-9 px-3"><a href="/dashboard" className="text-lg font-bold tracking-tight">Borrow<span className="text-pink-700 dark:text-pink-400">IT</span></a><p className="mt-1 text-xs text-zinc-500">Equipment services · USTP</p></div>
        <NavItems items={items} />
        <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="mb-3 px-3"><p className="truncate text-sm font-medium">{profile?.full_name || profile?.email}</p><p className="mt-0.5 text-xs text-zinc-500">{profile?.role}</p></div>
          <button type="button" onClick={handleSignOut} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:text-zinc-300 dark:hover:bg-zinc-800"><LogOut size={17} />Log out</button>
        </div>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-50 bg-white p-5 dark:bg-zinc-950 lg:hidden" role="dialog" aria-modal="true" aria-label="Workspace menu"><div className="mb-7 flex items-center justify-between"><span className="text-lg font-bold">Borrow<span className="text-pink-700 dark:text-pink-400">IT</span></span><button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={20} /></button></div><NavItems items={items} close={() => setMobileOpen(false)} /><Button variant="outline" className="mt-6 w-full" onClick={handleSignOut}><LogOut size={16} />Log out</Button></div>}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/90 px-5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-8">
          <div className="flex items-center gap-3"><button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 lg:hidden dark:border-zinc-800 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={18} /></button><p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Campus equipment, accounted for.</p></div>
          <div className="flex items-center gap-3"><NavLink to="/notifications" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950" aria-label="Notifications"><Bell size={18} /></NavLink><div className="hidden text-right sm:block"><p className="max-w-48 truncate text-sm font-medium">{profile?.full_name || profile?.email}</p><p className="text-xs text-zinc-500">{profile?.role}</p></div><button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus-visible:ring-offset-zinc-950" aria-label={`Signed in as ${profile?.full_name || profile?.email}`}>{(profile?.full_name || profile?.email || 'U').slice(0, 1).toUpperCase()}</button></div>
        </header>
        <main className="mx-auto max-w-7xl p-5 sm:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
