import { UserRound } from 'lucide-react'

const developers = [
  {
    name: 'Allyza',
    role: 'Project Leader · UI/UX Designer',
    description: 'Guides the project direction and shapes a clear, welcoming experience for every user.',
  },
  {
    name: 'Dianne',
    role: 'Frontend Developer',
    description: 'Builds the responsive interface and brings the product experience to life.',
  },
  {
    name: 'Zoe',
    role: 'Quality Assurance (QA)',
    description: 'Checks the details, tests key flows, and helps make each release more reliable.',
  },
  {
    name: 'Seighfred',
    role: 'Back-End Engineer',
    description: 'Develops the services and data flows that keep the application working smoothly.',
  },
  {
    name: 'Uoiea',
    role: 'DevOps / Infrastructure Engineer',
    description: 'Supports the infrastructure and delivery process behind the BorrowIT platform.',
  },
]

export function Developers() {
  return (
    <section id="developers" className="scroll-mt-16 border-y border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/40 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Meet the team</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">The people behind BorrowIT</h2>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">A team working together to make campus equipment easier to share.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {developers.map(({ name, role, description }, index) => (
            <article key={name} className={`group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 ${index === 3 ? 'lg:col-start-1' : ''}`}>
              <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-rose-100 via-stone-100 to-zinc-100 dark:from-rose-950/40 dark:via-zinc-900 dark:to-zinc-900">
                <div aria-hidden="true" className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-pink-200/50 blur-2xl transition-transform duration-300 group-hover:scale-125 dark:bg-pink-800/20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-white/70 text-zinc-400 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
                  <UserRound size={32} strokeWidth={1.5} aria-hidden="true" />
                  <span className="sr-only">Profile photo for {name} will be added later</span>
                </div>
                <span className="absolute bottom-3 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-medium text-zinc-500 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400">Photo coming soon</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">{name}</h3>
                <p className="mt-1 text-sm font-medium text-pink-800 dark:text-pink-300">{role}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
