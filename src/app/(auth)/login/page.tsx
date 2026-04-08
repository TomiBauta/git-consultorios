'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Stethoscope, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [remember,    setRemember]    = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [timedOut,    setTimedOut]    = useState(false)

  useEffect(() => {
    if (searchParams.get('timeout') === '1') setTimedOut(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: '#f7f9fb', color: '#1a1b1f', fontFamily: 'Inter, sans-serif' }}
    >

      {/* ── Fixed header ── */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <Stethoscope className="w-7 h-7" style={{ color: '#00113a' }} />
          <span className="text-lg font-bold tracking-tight" style={{ color: '#00113a' }}>
            DIT Consultorios Médicos
          </span>
        </div>
        <a
          href="#"
          className="text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: '#3d4a5c' }}
        >
          Ayuda
        </a>
      </header>

      {/* ── Main ── */}
      <main className="relative flex-grow flex items-center justify-center p-4">

        {/* Background depth layer */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #f7f9fb 0%, #f2f4f6 50%, #d9e2fc 100%)',
              opacity: 0.5,
            }}
          />
        </div>

        {/* Login card */}
        <div className="relative z-10 w-full max-w-[440px]">
          <div
            className="p-8 md:p-12 rounded"
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0px 10px 40px rgba(0,17,58,0.08)',
              border: '1px solid rgba(255,255,255,0.6)',
            }}
          >
            {/* Card header */}
            <div className="mb-10">
              <h1
                className="text-3xl font-extrabold tracking-tight mb-2"
                style={{ color: '#00113a', letterSpacing: '-0.02em' }}
              >
                Bienvenido
              </h1>
              <p className="text-sm" style={{ color: '#3d4a5c' }}>
                Inicie sesión para acceder a su portal médico profesional.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div className="space-y-1">
                <label
                  className="block text-xs font-semibold ml-1"
                  style={{ color: '#3d4a5c' }}
                  htmlFor="email"
                >
                  Correo Electrónico
                </label>
                <div className="login-tray rounded px-4 py-3 flex items-center gap-3">
                  <Mail className="w-5 h-5 shrink-0" style={{ color: '#747780' }} />
                  <input
                    id="email"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-sm"
                    style={{ color: '#1a1b1f' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label
                    className="text-xs font-semibold"
                    style={{ color: '#3d4a5c' }}
                    htmlFor="password"
                  >
                    Contraseña
                  </label>
                  <a
                    href="#"
                    className="text-xs font-semibold transition-colors hover:opacity-70"
                    style={{ color: '#002366' }}
                  >
                    ¿Olvidó su contraseña?
                  </a>
                </div>
                <div className="login-tray rounded px-4 py-3 flex items-center gap-3">
                  <Lock className="w-5 h-5 shrink-0" style={{ color: '#747780' }} />
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-sm"
                    style={{ color: '#1a1b1f' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="shrink-0 transition-opacity hover:opacity-60"
                    style={{ color: '#747780' }}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass
                      ? <EyeOff className="w-5 h-5" />
                      : <Eye className="w-5 h-5" />
                    }
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2 px-1">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="rounded h-4 w-4 border-[#c4c6d0] focus:ring-[#002366]"
                  style={{ accentColor: '#00113a' }}
                />
                <label
                  htmlFor="remember"
                  className="text-xs"
                  style={{ color: '#3d4a5c' }}
                >
                  Recordar sesión
                </label>
              </div>

              {/* Timeout notice */}
              {timedOut && (
                <div
                  className="px-4 py-3 rounded text-sm font-medium"
                  style={{ background: '#fff3cd', color: '#7a5800' }}
                >
                  Tu sesión expiró por inactividad. Por favor ingresá nuevamente.
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  className="px-4 py-3 rounded text-sm font-medium"
                  style={{ background: '#ffdad6', color: '#93000a' }}
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)',
                  color: '#ffffff',
                  boxShadow: '0px 8px 24px rgba(0,17,58,0.14)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.12)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = '' }}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Footer divider */}
            <div
              className="mt-10 pt-8 flex flex-col items-center gap-3"
              style={{ borderTop: '1px solid rgba(196,198,208,0.25)' }}
            >
              <p className="text-xs" style={{ color: '#3d4a5c' }}>
                ¿No tiene una cuenta todavía?
              </p>
              <button
                className="text-sm font-bold tracking-tight transition-colors hover:opacity-70"
                style={{ color: '#00113a' }}
              >
                Solicitar acceso institucional
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="w-full py-7"
        style={{ borderTop: '1px solid rgba(244,243,248,0.8)', background: 'rgba(244,243,248,0.4)' }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-4">
          <p className="text-xs" style={{ color: '#3d4a5c' }}>
            © {new Date().getFullYear()} DIT Consultorios Médicos. Todos los derechos reservados.
          </p>
          <div className="flex gap-8">
            {['Privacidad', 'Términos de Uso', 'Soporte Técnico'].map(link => (
              <a
                key={link}
                href="#"
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: '#3d4a5c' }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
