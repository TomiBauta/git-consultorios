import Link from 'next/link'

const sections = [
  { href: '/configuracion/medicos',        icon: '👨‍⚕️', title: 'Médicos',        desc: 'Gestionar médicos y horarios de atención' },
  { href: '/configuracion/usuarios',       icon: '👥', title: 'Usuarios',        desc: 'Administrar usuarios y roles del sistema' },
  { href: '/configuracion/obras-sociales', icon: '🏥', title: 'Obras sociales',  desc: 'Gestionar obras sociales disponibles' },
]

export default function ConfiguracionPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>Configuración</h1>
      <div className="grid grid-cols-3 gap-4">
        {sections.map(s => (
          <Link key={s.href} href={s.href}>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:border-[#BFDBFE] hover:shadow-sm transition-all cursor-pointer">
              <p className="text-3xl mb-3">{s.icon}</p>
              <p className="font-semibold text-[#0F172A]">{s.title}</p>
              <p className="text-sm text-[#64748B] mt-1">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
