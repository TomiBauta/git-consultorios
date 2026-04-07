import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, ChevronRight, Settings, Stethoscope, User, Users, Zap } from 'lucide-react'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia:      'Oftalmología',
  gastroenterologia: 'Gastroenterología',
  diabetologia:      'Diabetología',
  clinica_medica:    'Clínica Médica',
}

const DOW_LABELS: Record<number, string> = {
  1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 0: 'Dom',
}

const AVATAR_COLORS = ['#00113a', '#002366', '#0891B2', '#059669']

function initials(name: string) {
  return name
    .split(' ')
    .filter(w => !['Dr.', 'Dra.'].includes(w))
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export default async function ConfiguracionPage() {
  const supabase = await createClient()

  const { data: doctors } = await supabase
    .from('profiles')
    .select('id, full_name, specialty, is_active')
    .eq('role', 'doctor')
    .order('full_name')

  const { data: availability } = await supabase
    .from('doctor_availability')
    .select('doctor_id, day_of_week')
    .eq('is_active', true)

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:-m-8 lg:h-[calc(100vh-0px)] lg:overflow-hidden">

      {/* ── Left nav ── */}
      <aside
        className="col-span-3 flex flex-col p-5 lg:p-6 overflow-y-auto"
        style={{ background: 'var(--surface-container-lowest)', borderRight: '1px solid rgba(196,198,208,0.08)' }}
      >
        <div className="mb-8">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            Configuración
          </p>
          <h2
            className="text-xl font-extrabold"
            style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}
          >
            Ajustes del sistema
          </h2>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { href: '/configuracion',         icon: Stethoscope, label: 'Gestión de Médicos',       active: true  },
            { href: '/configuracion/medicos',  icon: CalendarDays, label: 'Horarios y Disponibilidad', active: false },
            { href: '#',                       icon: Settings,     label: 'Ajustes de la Clínica',    active: false },
            { href: '#',                       icon: User,         label: 'Perfil de Usuario',         active: false },
            { href: '#',                       icon: Users,        label: 'Obras Sociales',            active: false },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded transition-all"
              style={item.active
                ? { background: '#00113a', color: '#ffffff' }
                : { color: 'var(--on-surface-variant)' }
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-semibold">{item.label}</span>
              {item.active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Plan card */}
        <div
          className="mt-6 p-4 rounded"
          style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4" style={{ color: '#ffffff' }} />
            <span className="text-xs font-bold" style={{ color: '#ffffff' }}>Plan Activo</span>
          </div>
          <p className="text-sm font-extrabold text-white mb-0.5">Clínica Pro</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {doctors?.length ?? 0} médico{doctors?.length !== 1 ? 's' : ''} · Turnos ilimitados
          </p>
        </div>
      </aside>

      {/* ── Right content ── */}
      <main className="col-span-9 overflow-y-auto p-5 lg:p-8 space-y-8">

        {/* ── Doctors section ── */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                Cuerpo Médico
              </p>
              <h3 className="text-xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                Médicos Activos
              </h3>
            </div>
            <Link
              href="/configuracion/medicos"
              className="text-xs font-bold px-4 py-2 rounded transition-all hover:opacity-80"
              style={{ background: '#00113a', color: '#ffffff' }}
            >
              Gestionar horarios →
            </Link>
          </div>

          {(!doctors || doctors.length === 0) ? (
            <div
              className="p-12 rounded text-center"
              style={{ background: 'var(--surface-container-low)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                No hay médicos registrados aún.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((doctor, i) => {
                const doctorDays = (availability ?? [])
                  .filter(a => a.doctor_id === doctor.id)
                  .map(a => DOW_LABELS[a.day_of_week])
                  .filter(Boolean)
                const bg = avatarColor(doctor.full_name)
                const spec = SPECIALTY_LABELS[doctor.specialty ?? ''] ?? doctor.specialty ?? 'Especialidad'

                return (
                  <div
                    key={doctor.id}
                    className="p-5 rounded transition-all hover:shadow-md"
                    style={{
                      background: 'var(--surface-container-lowest)',
                      boxShadow: '0px 4px 16px rgba(0,17,58,0.04)',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div
                        className="w-14 h-14 rounded flex items-center justify-center text-white font-extrabold text-lg shrink-0"
                        style={{ background: bg }}
                      >
                        {initials(doctor.full_name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-extrabold truncate" style={{ color: 'var(--on-surface)' }}>
                            {doctor.full_name}
                          </p>
                          <span
                            className="shrink-0 w-2 h-2 rounded-full"
                            style={{ background: doctor.is_active ? '#b3e5f0' : '#c4c6d0' }}
                            title={doctor.is_active ? 'Disponible' : 'Inactivo'}
                          />
                        </div>
                        <p className="text-xs mb-2" style={{ color: 'var(--on-surface-variant)' }}>{spec}</p>
                        {doctorDays.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {doctorDays.map(d => (
                              <span
                                key={d}
                                className="text-[10px] font-bold px-2 py-0.5 rounded"
                                style={{ background: `${bg}18`, color: bg }}
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px]" style={{ color: 'var(--outline)' }}>Sin horarios configurados</span>
                        )}
                      </div>

                      {/* Edit button */}
                      <Link
                        href="/configuracion/medicos"
                        className="shrink-0 w-8 h-8 rounded flex items-center justify-center transition-all hover:opacity-80"
                        style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
                        title="Editar horarios"
                      >
                        <CalendarDays className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Clinic settings form ── */}
        <section>
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--on-surface-variant)' }}>
              Clínica
            </p>
            <h3 className="text-xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Ajustes de la Clínica
            </h3>
          </div>

          <div
            className="p-6 rounded space-y-5"
            style={{
              background: 'var(--surface-container-lowest)',
              boxShadow: '0px 4px 16px rgba(0,17,58,0.04)',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Clinic name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                  Nombre de la clínica
                </label>
                <input
                  type="text"
                  defaultValue="DIT Consultorios"
                  className="settings-input"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                  Email de contacto
                </label>
                <input
                  type="email"
                  defaultValue="contacto@ditconsultorios.com"
                  className="settings-input"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  defaultValue="+54 11 0000-0000"
                  className="settings-input"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                  Dirección
                </label>
                <input
                  type="text"
                  defaultValue="Buenos Aires, Argentina"
                  className="settings-input"
                />
              </div>
            </div>

            {/* Online booking toggle */}
            <div
              className="flex items-center justify-between p-4 rounded"
              style={{ background: 'var(--surface-container-low)' }}
            >
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>
                  Reservas online
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                  Habilitar el portal público de turnos para pacientes
                </p>
              </div>
              <div
                className="w-11 h-6 rounded-full relative cursor-pointer"
                style={{ background: '#00113a' }}
              >
                <span
                  className="absolute top-1 left-5 w-4 h-4 rounded-full bg-white dark:bg-[#1a2235] shadow transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                className="px-6 py-2.5 rounded text-sm font-bold transition-all hover:opacity-80"
                style={{ background: '#00113a', color: '#ffffff' }}
              >
                Guardar cambios
              </button>
              <button
                className="px-6 py-2.5 rounded text-sm font-bold transition-all hover:opacity-80"
                style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
              >
                Descartar
              </button>
            </div>
          </div>
        </section>

        {/* ── Bottom bento row ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-8">
          {/* Servicios y Costos */}
          <div
            className="p-6 rounded flex flex-col justify-between"
            style={{
              background: 'var(--surface-container-lowest)',
              boxShadow: '0px 4px 16px rgba(0,17,58,0.04)',
              minHeight: '160px',
            }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                Catálogo
              </p>
              <h4 className="text-base font-extrabold mb-1" style={{ color: 'var(--on-surface)' }}>
                Servicios y Costos
              </h4>
              <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                Gestioná los servicios ofrecidos, aranceles y coberturas por obra social.
              </p>
            </div>
            <Link
              href="/configuracion/obras-sociales"
              className="mt-4 text-xs font-bold flex items-center gap-1 transition-all hover:opacity-70"
              style={{ color: 'var(--on-surface)' }}
            >
              Configurar servicios <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Horarios Globales */}
          <div
            className="p-6 rounded flex flex-col justify-between"
            style={{
              background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)',
              minHeight: '160px',
            }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#ffffff' }}>
                Disponibilidad
              </p>
              <h4 className="text-base font-extrabold mb-1 text-white">
                Horarios Globales
              </h4>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Definí los horarios de apertura de la clínica y franjas disponibles para turnos.
              </p>
            </div>
            <Link
              href="/configuracion/medicos"
              className="mt-4 text-xs font-bold flex items-center gap-1 transition-all hover:opacity-70"
              style={{ color: '#ffffff' }}
            >
              Ver disponibilidad <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

      </main>
    </div>
  )
}
