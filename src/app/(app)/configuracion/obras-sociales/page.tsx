import { createClient } from '@/lib/supabase/server'

export default async function ObrasSocialesPage() {
  const supabase = await createClient()
  const { data: os } = await supabase.from('obras_sociales').select('*').order('name')

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>Obras sociales</h1>
      <div className="bg-white dark:bg-[#1a2235] border border-[#E2E8F0] rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F1F5F9]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Código</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody>
            {os?.map(o => (
              <tr key={o.id} className="border-b border-[#F8FAFC] last:border-b-0">
                <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">{o.name}</td>
                <td className="px-4 py-3 text-sm text-[#64748B] font-mono">{o.code ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${o.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {o.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
