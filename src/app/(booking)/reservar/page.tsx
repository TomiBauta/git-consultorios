import Link from 'next/link'

const SPECIALTIES = [
  {
    slug: 'oftalmologia',
    label: 'Oftalmología',
    desc: 'Ojos, visión y salud ocular',
    icon: '👁️',
    color: 'bg-cyan-50 border-cyan-200 hover:border-cyan-400',
    iconBg: 'bg-cyan-100',
  },
  {
    slug: 'gastroenterologia',
    label: 'Gastroenterología',
    desc: 'Sistema digestivo y hepático',
    icon: '🩺',
    color: 'bg-teal-50 border-teal-200 hover:border-teal-400',
    iconBg: 'bg-teal-100',
  },
  {
    slug: 'diabetologia',
    label: 'Diabetología',
    desc: 'Diabetes, tiroides y metabolismo',
    icon: '💉',
    color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    iconBg: 'bg-indigo-100',
  },
  {
    slug: 'clinica_medica',
    label: 'Clínica Médica',
    desc: 'Medicina general y preventiva',
    icon: '🏥',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-100',
  },
]

export default function ReservarPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
          ¿Con qué especialidad querés consultar?
        </h1>
        <p className="text-[#64748B]">Seleccioná la especialidad para ver los turnos disponibles</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SPECIALTIES.map(s => (
          <Link key={s.slug} href={`/reservar/${s.slug}`}>
            <div className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${s.color}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${s.iconBg}`}>
                {s.icon}
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">{s.label}</p>
                <p className="text-sm text-[#64748B]">{s.desc}</p>
              </div>
              <span className="ml-auto text-[#94A3B8]">›</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-[#94A3B8]">
        ¿Tenés dudas? Escribinos por WhatsApp
      </p>
    </div>
  )
}
