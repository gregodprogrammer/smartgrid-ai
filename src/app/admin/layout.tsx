'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Zap,
  LayoutDashboard,
  Map,
  AlertTriangle,
  FileText,
  Upload,
  BarChart2,
  LogOut,
  Menu,
  X,
  TrendingDown,
  ClipboardList,
  TrendingUp,
  Receipt,
  Coins,
  Radio,
  Activity,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

type NavSection = {
  label: string
  items: { href: string; label: string; icon: any; exact?: boolean }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Grid Intelligence',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/zones', label: 'Zones', icon: Map },
      { href: '/admin/energy-balance', label: 'Energy Balance', icon: BarChart2 },
    ],
  },
  {
    label: 'Product 1 — Planning',
    items: [
      { href: '/admin/fraud', label: 'Fraud Alerts', icon: AlertTriangle },
      { href: '/admin/atcc', label: 'ATC&C Losses', icon: TrendingDown },
      { href: '/admin/investment', label: 'Investment Intel', icon: TrendingUp },
      { href: '/admin/nerc', label: 'NERC Reports', icon: ClipboardList },
      { href: '/admin/billing', label: 'Billing Transition', icon: Receipt },
      { href: '/admin/subsidy', label: 'Subsidy Tracker', icon: Coins },
    ],
  },
  {
    label: 'Product 2 — DER',
    items: [
      { href: '/admin/der', label: 'DER Assets', icon: Radio },
      { href: '/admin/vpp', label: 'VPP Dispatch', icon: Activity },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: '/admin/reports', label: 'Reports', icon: FileText },
      { href: '/admin/import', label: 'Import', icon: Upload },
    ],
  },
]

function NavItem({ href, label, icon: Icon, exact }: { href: string; label: string; icon: any; exact?: boolean }) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 14px',
        borderRadius: 9,
        color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
        background: isActive ? 'rgba(245,166,35,0.15)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
        fontWeight: isActive ? 600 : 400,
        fontSize: 13,
        transition: 'all 0.15s',
        textDecoration: 'none',
      }}
    >
      <Icon size={16} />
      {label}
    </Link>
  )
}

function NavSection({ section }: { section: NavSection }) {
  const pathname = usePathname()
  const isAnyActive = section.items.some(i => i.exact ? pathname === i.href : pathname.startsWith(i.href))
  const [open, setOpen] = useState(true)

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '6px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: isAnyActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 2,
        }}
      >
        {section.label}
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {section.items.map(item => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      )}
    </div>
  )
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <div
      style={{
        width: 248,
        background: 'var(--primary)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '18px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="#fff" fill="#fff" />
          </div>
          <div>
            <div className="font-sora font-bold text-white text-sm leading-none">SmartGrid AI</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>Admin Console</div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_SECTIONS.map(section => (
          <NavSection key={section.label} section={section} />
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ padding: '8px 14px', marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logged in as</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginTop: 2 }}>Admin · Keotera</div>
        </div>
        <Link
          href="/auth/sign-out"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 14px',
            borderRadius: 9,
            color: 'rgba(255,255,255,0.65)',
            fontSize: 13,
            transition: 'color 0.15s',
          }}
        >
          <LogOut size={16} />
          Sign Out
        </Link>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex" style={{ flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 40,
            }}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 50,
              display: 'flex',
            }}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile topbar */}
        <div
          className="lg:hidden"
          style={{
            background: 'var(--primary)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={15} color="#fff" fill="#fff" />
            </div>
            <span className="font-sora font-bold text-white text-sm">SmartGrid AI Admin</span>
          </div>
        </div>

        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
