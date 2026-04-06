-- ============================================================
-- Reserva online de turnos para pacientes
-- ============================================================

-- 1. Índice parcial único: evita doble reserva a nivel DB
CREATE UNIQUE INDEX IF NOT EXISTS appointments_no_double_booking
  ON appointments (doctor_id, scheduled_at)
  WHERE status NOT IN ('cancelado');

-- 2. Habilitar Realtime en appointments
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- 3. RLS: acceso anónimo para leer disponibilidad
CREATE POLICY "public_read_profiles_doctors" ON profiles
  FOR SELECT USING (role = 'doctor' AND is_active = true);

CREATE POLICY "public_read_doctor_availability" ON doctor_availability
  FOR SELECT USING (is_active = true);

CREATE POLICY "public_read_doctor_blocks" ON doctor_blocks
  FOR SELECT USING (true);

CREATE POLICY "public_read_appointments_slots" ON appointments
  FOR SELECT USING (status NOT IN ('cancelado'));

-- 4. Función atómica de reserva pública
CREATE OR REPLACE FUNCTION book_appointment_public(
  p_doctor_id    uuid,
  p_scheduled_at timestamptz,
  p_first_name   text,
  p_last_name    text,
  p_dni          text,
  p_phone        text,
  p_reason       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id  uuid;
  v_appt_id     uuid;
  v_specialty   text;
  v_duration    int;
BEGIN
  -- Verificar médico activo y obtener especialidad/duración
  SELECT p.specialty, COALESCE(da.slot_duration, 30)
    INTO v_specialty, v_duration
    FROM profiles p
    LEFT JOIN doctor_availability da
      ON da.doctor_id = p.id AND da.is_active = true
   WHERE p.id = p_doctor_id
     AND p.is_active = true
     AND p.role = 'doctor'
   LIMIT 1;

  IF v_specialty IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'doctor_not_found');
  END IF;

  -- Verificar que no esté bloqueado ese horario
  IF EXISTS (
    SELECT 1 FROM doctor_blocks
     WHERE doctor_id = p_doctor_id
       AND starts_at <= p_scheduled_at
       AND ends_at    > p_scheduled_at
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slot_blocked');
  END IF;

  -- El índice único garantiza atomicidad en el INSERT.
  -- Si dos requests llegan simultáneamente, uno obtendrá unique_violation.

  -- Upsert paciente por DNI
  IF p_dni IS NOT NULL AND p_dni != '' THEN
    SELECT id INTO v_patient_id
      FROM patients
     WHERE dni = p_dni AND deleted_at IS NULL
     LIMIT 1;
  END IF;

  IF v_patient_id IS NULL THEN
    INSERT INTO patients (first_name, last_name, dni, phone, phone_whatsapp)
    VALUES (
      p_first_name,
      p_last_name,
      NULLIF(trim(p_dni), ''),
      p_phone,
      p_phone
    )
    RETURNING id INTO v_patient_id;
  ELSE
    UPDATE patients
       SET phone = COALESCE(NULLIF(p_phone,''), phone),
           phone_whatsapp = COALESCE(NULLIF(p_phone,''), phone_whatsapp),
           updated_at = now()
     WHERE id = v_patient_id;
  END IF;

  -- Insertar turno (el índice parcial único bloquea duplicados)
  INSERT INTO appointments (
    patient_id, doctor_id, specialty,
    scheduled_at, duration_mins, reason, status
  ) VALUES (
    v_patient_id, p_doctor_id, v_specialty,
    p_scheduled_at, v_duration,
    NULLIF(trim(p_reason), ''), 'pendiente'
  )
  RETURNING id INTO v_appt_id;

  RETURN jsonb_build_object(
    'ok',             true,
    'appointment_id', v_appt_id,
    'patient_id',     v_patient_id,
    'specialty',      v_specialty,
    'scheduled_at',   p_scheduled_at
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slot_taken');
END;
$$;

-- Permitir al rol anon ejecutar la función
GRANT EXECUTE ON FUNCTION book_appointment_public TO anon;
