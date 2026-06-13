'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Zap, Map, Users, AlertTriangle, MessageCircle, ChevronRight, Activity, Shield } from 'lucide-react'

const OutageMap = dynamic(() => import('@/components/outage-map'), { ssr: false })

type Stats = {
  activeZones: number
  outagesToday: number
  customersServed: number
}

function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: scrolled ? 'rgba(26,31,94,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'background 0.3s',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div
              style={{
                width: 36,
                height: 36,
                background: 'var(--accent)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={20} color="#fff" fill="#fff" />
            </div>
            <div>
              <span
                className="font-sora font-bold text-white text-lg leading-none block"
              >
                SmartGrid AI
              </span>
              <span className="text-xs text-white/60 leading-none">by Keotera</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#map" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              Live Map
            </a>
            <a href="#about" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              About
            </a>
            <a href="#stats" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              Stats
            </a>
            <Link
              href="/auth/sign-in"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                padding: '8px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dark)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Login
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <a href="#map" className="block text-white/80 hover:text-white py-2 text-sm" onClick={() => setMobileOpen(false)}>Live Map</a>
            <a href="#about" className="block text-white/80 hover:text-white py-2 text-sm" onClick={() => setMobileOpen(false)}>About</a>
            <a href="#stats" className="block text-white/80 hover:text-white py-2 text-sm" onClick={() => setMobileOpen(false)}>Stats</a>
            <Link href="/auth/sign-in" className="block text-white font-medium py-2 text-sm" onClick={() => setMobileOpen(false)}>Login →</Link>
          </div>
        )}
      </div>
    </nav>
  )
}

function StatsTicker({ stats }: { stats: Stats }) {
  return (
    <div
      id="stats"
      style={{
        background: 'rgba(255,255,255,0.05)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
      className="py-4"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-sora text-2xl font-bold text-white">{stats.activeZones}</div>
            <div className="text-xs text-white/60 mt-1">Active Zones</div>
          </div>
          <div>
            <div className="font-sora text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.outagesToday}</div>
            <div className="text-xs text-white/60 mt-1">Outages Today</div>
          </div>
          <div>
            <div className="font-sora text-2xl font-bold text-white">{stats.customersServed.toLocaleString()}</div>
            <div className="text-xs text-white/60 mt-1">Customers Served</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div
      id="about"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      className="hover:shadow-lg hover:-translate-y-1"
    >
      <div
        style={{
          width: 48,
          height: 48,
          background: 'rgba(26,31,94,0.08)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        {icon}
      </div>
      <h3 className="font-sora font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {desc}
      </p>
    </div>
  )
}

export default function HomePage() {
  const [stats] = useState<Stats>({
    activeZones: 8,
    outagesToday: 2,
    customersServed: 142650,
  })

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <NavBar />

      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1a1f5e 0%, #2d3480 50%, #1a1f5e 100%)',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 80,
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(245,166,35,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(45,52,128,0.5) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            pointerEvents: 'none',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6" style={{
            background: 'rgba(245,166,35,0.15)',
            border: '1px solid rgba(245,166,35,0.4)',
            borderRadius: 100,
            padding: '6px 16px',
          }}>
            <Activity size={14} color="var(--accent)" />
            <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              Nigeria Grid Intelligence — Live Platform
            </span>
          </div>

          <h1
            className="font-sora font-bold text-white mx-auto"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', lineHeight: 1.1, maxWidth: 800, marginBottom: 24 }}
          >
            Real-time Energy Intelligence{' '}
            <span style={{ color: 'var(--accent)' }}>for Nigeria</span>
          </h1>

          <p
            className="text-white/70 mx-auto mb-8"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', maxWidth: 600 }}
          >
            Powered by Keotera — AI-driven grid monitoring, fraud detection, and loss analysis.
            Built for Nigeria&apos;s electricity distribution sector.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#map"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.2s, transform 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dark)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Map size={18} />
              View Live Map
            </a>
            <Link
              href="/auth/sign-in"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              Customer Login
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Stats ticker inside hero bottom */}
        <StatsTicker stats={stats} />
      </section>

      {/* Live Map Section */}
      <section id="map" style={{ padding: '64px 0 0', background: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="font-sora font-bold text-3xl mb-3" style={{ color: 'var(--text-primary)' }}>
              Nigeria Grid — Live Status
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Real-time monitoring of distribution zones across Nigeria
            </p>
          </div>
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(26,31,94,0.08)',
            }}
          >
            <OutageMap />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" style={{ padding: '80px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-sora font-bold text-3xl mb-3" style={{ color: 'var(--text-primary)' }}>
              Built for Nigeria&apos;s Energy Future
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
              SmartGrid AI combines real-time data with artificial intelligence to deliver
              actionable insights for distribution companies, regulators, and consumers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Map size={24} color="var(--primary)" />}
              title="Live Grid Mapping"
              desc="Real-time zone status, outage tracking, and infrastructure visualization across all Nigerian distribution areas."
            />
            <FeatureCard
              icon={<Shield size={24} color="var(--primary)" />}
              title="Fraud Detection"
              desc="AI-powered anomaly detection identifies meter tampering, energy theft, and billing irregularities automatically."
            />
            <FeatureCard
              icon={<Activity size={24} color="var(--primary)" />}
              title="Load Balancing"
              desc="Predictive demand forecasting and intelligent load management to reduce unplanned outages and technical losses."
            />
            <FeatureCard
              icon={<MessageCircle size={24} color="var(--primary)" />}
              title="AI Assistant"
              desc="Natural language interface lets customers and operators query grid status, outage causes, and restoration times."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: 'var(--primary)',
          color: 'rgba(255,255,255,0.7)',
          padding: '48px 0 24px',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} color="#fff" fill="#fff" />
                </div>
                <span className="font-sora font-bold text-white text-lg">SmartGrid AI</span>
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Next-generation energy management platform for Nigeria&apos;s distribution companies.
              </p>
            </div>
            <div>
              <h4 className="font-sora font-semibold text-white mb-3 text-sm uppercase tracking-wide">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#map" className="hover:text-white transition-colors">Live Grid Map</a></li>
                <li><Link href="/auth/sign-in" className="hover:text-white transition-colors">Customer Portal</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-sora font-semibold text-white mb-3 text-sm uppercase tracking-wide">Keotera</h4>
              <ul className="space-y-2 text-sm">
                <li><span>Built for AEDC — Nigeria&apos;s leading electricity distribution company</span></li>
                <li><span>Nigeria Energy Transition</span></li>
              </ul>
            </div>
          </div>
          <div
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          >
            <span>© 2026 Keotera. SmartGrid AI — All rights reserved.</span>
            <span style={{ color: 'var(--accent)' }}>Nigeria Energy Transition Initiative</span>
          </div>
        </div>
      </footer>

      {/* Floating chat button */}
      <Link
        href="/dashboard"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          background: 'var(--accent)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(245,166,35,0.4)',
          zIndex: 40,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,166,35,0.5)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,166,35,0.4)' }}
        title="Open SmartGrid Assistant"
      >
        <MessageCircle size={24} color="#fff" />
      </Link>
    </div>
  )
}
