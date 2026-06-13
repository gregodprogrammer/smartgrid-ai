import Link from 'next/link'
import { Zap } from 'lucide-react'
import { SignInForm } from '@/components/sign-in-form'
import { getAuthConfig } from '@/lib/auth-actions'

export const dynamic = 'force-dynamic'

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const config = await getAuthConfig()
  const { notice } = await searchParams

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1f5e 0%, #2d3480 60%, #1a1f5e 100%)',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(245,166,35,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(45,52,128,0.5) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: 'var(--accent)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(245,166,35,0.4)',
              }}
            >
              <Zap size={28} color="#fff" fill="#fff" />
            </div>
            <div>
              <h1
                className="font-sora font-bold text-white"
                style={{ fontSize: 24, lineHeight: 1.1, marginBottom: 4 }}
              >
                SmartGrid AI
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>by Keotera</p>
            </div>
          </Link>
          <p
            className="font-sora font-semibold text-white mt-6"
            style={{ fontSize: 20 }}
          >
            Welcome to SmartGrid AI
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 6 }}>
            Nigeria&apos;s real-time energy intelligence platform
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 24,
            padding: '32px 28px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 className="font-sora font-bold text-center" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
              Sign in to your account
            </h2>
          </div>

          {notice === 'invite-only' && (
            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                <strong>Account registration is by invitation only.</strong><br />
                Please contact <a href="mailto:admin@keotera.com" style={{ color: '#92400e', fontWeight: 600 }}>admin@keotera.com</a> to request access.
              </p>
            </div>
          )}

          <SignInForm providers={config.oAuthProviders ?? []} />

        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 24 }}>
          SmartGrid AI · Powered by Keotera
        </p>
      </div>
    </div>
  )
}
