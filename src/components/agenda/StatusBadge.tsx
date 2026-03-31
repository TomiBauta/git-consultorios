import { cn } from '@/lib/utils'

const STATUS = {
  pendiente:  { label: 'Pendiente',  classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmado: { label: 'Confirmado', classes: 'bg-green-100 text-green-800 border-green-200' },
  cancelado:  { label: 'Cancelado',  classes: 'bg-red-100 text-red-700 border-red-200' },
  ausente:    { label: 'Ausente',    classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  atendido:   { label: 'Atendido',   classes: 'bg-blue-100 text-blue-800 border-blue-200' },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status as keyof typeof STATUS] ?? { label: status, classes: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium border', s.classes)}>
      {s.label}
    </span>
  )
}
