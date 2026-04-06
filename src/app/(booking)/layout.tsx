import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sacar turno · DIT Consultorios Médicos',
  description: 'Reservá tu turno online en DIT Consultorios. Oftalmología, Gastroenterología, Diabetología y Clínica Médica en Buenos Aires.',
}

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-[#1B3A6B] text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-bold text-sm">
            DIT
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">DIT Consultorios</p>
            <p className="text-white/60 text-xs">Reserva de turnos online</p>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#94A3B8]">
        DIT Consultorios Médicos · Buenos Aires
      </footer>
    </div>
  )
}
