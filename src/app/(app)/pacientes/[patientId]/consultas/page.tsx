import { redirect } from 'next/navigation'

export default async function ConsultasRedirect({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params
  redirect(`/pacientes/${patientId}/historia`)
}
