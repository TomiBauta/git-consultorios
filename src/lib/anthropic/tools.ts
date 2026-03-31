import type Anthropic from '@anthropic-ai/sdk'

export const agentTools: Anthropic.Tool[] = [
  {
    name: 'identify_patient',
    description: 'Identifica al paciente por número de teléfono o DNI. Usar siempre al inicio de la conversación.',
    input_schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Número de teléfono WhatsApp (formato internacional, ej: 5491112345678)' },
        dni:   { type: 'string', description: 'DNI del paciente si lo proporcionó' },
      },
      required: ['phone'],
    },
  },
  {
    name: 'check_availability',
    description: 'Consulta los turnos disponibles para una especialidad en un rango de fechas.',
    input_schema: {
      type: 'object',
      properties: {
        specialty: {
          type: 'string',
          enum: ['oftalmologia', 'gastroenterologia', 'diabetologia', 'clinica_medica'],
          description: 'Especialidad médica',
        },
        date_from: { type: 'string', description: 'Fecha desde (YYYY-MM-DD)' },
        date_to:   { type: 'string', description: 'Fecha hasta (YYYY-MM-DD)' },
        doctor_id: { type: 'string', description: 'ID del médico específico (opcional)' },
      },
      required: ['specialty', 'date_from', 'date_to'],
    },
  },
  {
    name: 'get_patient_appointments',
    description: 'Obtiene los próximos turnos de un paciente.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'ID del paciente' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'create_appointment',
    description: 'Crea un nuevo turno para el paciente.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id:   { type: 'string', description: 'ID del paciente' },
        doctor_id:    { type: 'string', description: 'ID del médico' },
        specialty:    { type: 'string', description: 'Especialidad' },
        scheduled_at: { type: 'string', description: 'Fecha y hora del turno (ISO 8601, ej: 2024-04-15T10:30:00)' },
        reason:       { type: 'string', description: 'Motivo de la consulta (opcional)' },
      },
      required: ['patient_id', 'doctor_id', 'specialty', 'scheduled_at'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancela un turno existente.',
    input_schema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'string', description: 'ID del turno' },
        reason:         { type: 'string', description: 'Motivo de cancelación' },
      },
      required: ['appointment_id'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Reprograma un turno a una nueva fecha y hora.',
    input_schema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'string', description: 'ID del turno a reprogramar' },
        new_scheduled_at: { type: 'string', description: 'Nueva fecha y hora (ISO 8601)' },
      },
      required: ['appointment_id', 'new_scheduled_at'],
    },
  },
  {
    name: 'escalate_to_human',
    description: 'Escala la conversación a un operador humano cuando el agente no puede resolver la consulta.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Motivo de la escalada' },
      },
      required: ['reason'],
    },
  },
]
