import { CTA } from '../components/CTA'
import { Developers } from '../components/Developers'
import { Features } from '../components/Features'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Developers />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
