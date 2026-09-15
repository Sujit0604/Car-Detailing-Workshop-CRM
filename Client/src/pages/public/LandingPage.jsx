import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Hero from '../../components/Hero'
import About from '../../components/About'
import Services from '../../components/Services'
import StatsBar from '../../components/StatsBar'
import Packages from '../../components/Packages'
import Process from '../../components/Process'
import Gallery from '../../components/Gallery'
import Testimonials from '../../components/Testimonials'
import Contact from '../../components/Contact'
import Footer from '../../components/Footer'
import AuthModal from '../../components/AuthModal'

export default function LandingPage() {
  const [authMode, setAuthMode] = useState(null)

  return (
    <div className="min-h-full overflow-x-hidden" style={{ background: '#0c0c0c', color: '#f0ede8' }}>
      <Navbar
        onLoginClick={() => setAuthMode('login')}
        onRegisterClick={() => setAuthMode('register')}
      />
      <main>
        <Hero />
        <About />
        <Services />
        <StatsBar />
        <Packages />
        <Process />
        <Gallery />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <AuthModal
        open={authMode !== null}
        initialMode={authMode || 'login'}
        onClose={() => setAuthMode(null)}
      />
    </div>
  )
}