-- ============================================================
-- DIT Consultorios - RLS Policies
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_sociales ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function para verificar si es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- OBRAS SOCIALES (todos pueden leer, solo admins escriben)
-- ============================================================
CREATE POLICY "obras_sociales_select_all" ON obras_sociales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "obras_sociales_write_admin" ON obras_sociales FOR ALL USING (is_admin());

-- ============================================================
-- PATIENTS
-- ============================================================
-- Admins y recepcionistas: leen todos
CREATE POLICY "patients_select_admin_receptionist" ON patients FOR SELECT
  USING (get_my_role() IN ('admin', 'receptionist') AND deleted_at IS NULL);

-- Médicos: solo ven pacientes con quienes tienen turno o consulta
CREATE POLICY "patients_select_doctor" ON patients FOR SELECT
  USING (
    get_my_role() = 'doctor'
    AND deleted_at IS NULL
    AND (
      EXISTS (SELECT 1 FROM appointments WHERE patient_id = patients.id AND doctor_id = auth.uid())
      OR
      EXISTS (SELECT 1 FROM consultations WHERE patient_id = patients.id AND doctor_id = auth.uid())
    )
  );

-- Admins y recepcionistas: escriben
CREATE POLICY "patients_insert_admin_receptionist" ON patients FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'receptionist'));
CREATE POLICY "patients_update_admin_receptionist" ON patients FOR UPDATE
  USING (get_my_role() IN ('admin', 'receptionist'));

-- ============================================================
-- DOCTOR AVAILABILITY
-- ============================================================
CREATE POLICY "doctor_availability_select_all" ON doctor_availability FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "doctor_availability_write_admin" ON doctor_availability FOR ALL USING (is_admin());
CREATE POLICY "doctor_availability_write_own" ON doctor_availability FOR ALL USING (auth.uid() = doctor_id);

-- ============================================================
-- DOCTOR BLOCKS
-- ============================================================
CREATE POLICY "doctor_blocks_select_all" ON doctor_blocks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "doctor_blocks_write_admin" ON doctor_blocks FOR ALL USING (is_admin());
CREATE POLICY "doctor_blocks_write_own" ON doctor_blocks FOR ALL USING (auth.uid() = doctor_id);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
-- Admins y recepcionistas: todos los turnos
CREATE POLICY "appointments_select_admin_receptionist" ON appointments FOR SELECT
  USING (get_my_role() IN ('admin', 'receptionist'));
-- Médicos: solo los propios
CREATE POLICY "appointments_select_doctor" ON appointments FOR SELECT
  USING (get_my_role() = 'doctor' AND doctor_id = auth.uid());

-- Admins y recepcionistas: escriben
CREATE POLICY "appointments_write_admin_receptionist" ON appointments FOR ALL
  USING (get_my_role() IN ('admin', 'receptionist'));
-- Médicos: pueden actualizar el estado de los propios
CREATE POLICY "appointments_update_doctor" ON appointments FOR UPDATE
  USING (get_my_role() = 'doctor' AND doctor_id = auth.uid());

-- ============================================================
-- CONSULTATIONS
-- ============================================================
CREATE POLICY "consultations_all_admin" ON consultations FOR ALL USING (is_admin());
CREATE POLICY "consultations_select_receptionist" ON consultations FOR SELECT
  USING (get_my_role() = 'receptionist');
CREATE POLICY "consultations_all_doctor" ON consultations FOR ALL
  USING (get_my_role() = 'doctor' AND doctor_id = auth.uid());

-- ============================================================
-- DIAGNOSES (heredan acceso de consultations)
-- ============================================================
CREATE POLICY "diagnoses_all_admin" ON diagnoses FOR ALL USING (is_admin());
CREATE POLICY "diagnoses_select_receptionist" ON diagnoses FOR SELECT USING (get_my_role() = 'receptionist');
CREATE POLICY "diagnoses_doctor" ON diagnoses FOR ALL
  USING (
    get_my_role() = 'doctor'
    AND EXISTS (SELECT 1 FROM consultations WHERE id = diagnoses.consultation_id AND doctor_id = auth.uid())
  );

-- ============================================================
-- TREATMENTS
-- ============================================================
CREATE POLICY "treatments_all_admin" ON treatments FOR ALL USING (is_admin());
CREATE POLICY "treatments_select_receptionist" ON treatments FOR SELECT USING (get_my_role() = 'receptionist');
CREATE POLICY "treatments_doctor" ON treatments FOR ALL
  USING (
    get_my_role() = 'doctor'
    AND EXISTS (SELECT 1 FROM consultations WHERE id = treatments.consultation_id AND doctor_id = auth.uid())
  );

-- ============================================================
-- MEDICAL FILES
-- ============================================================
CREATE POLICY "medical_files_all_admin" ON medical_files FOR ALL USING (is_admin());
CREATE POLICY "medical_files_select_receptionist" ON medical_files FOR SELECT USING (get_my_role() = 'receptionist');
CREATE POLICY "medical_files_doctor" ON medical_files FOR ALL
  USING (
    get_my_role() = 'doctor'
    AND (
      uploaded_by = auth.uid()
      OR EXISTS (SELECT 1 FROM consultations WHERE id = medical_files.consultation_id AND doctor_id = auth.uid())
    )
  );

-- ============================================================
-- WHATSAPP (solo admins desde el browser; service_role bypasea RLS)
-- ============================================================
CREATE POLICY "whatsapp_conv_admin" ON whatsapp_conversations FOR ALL USING (is_admin());
CREATE POLICY "whatsapp_msg_admin" ON whatsapp_messages FOR ALL USING (is_admin());

-- ============================================================
-- AUDIT LOG (solo lectura para admins; escritura solo service_role)
-- ============================================================
CREATE POLICY "audit_log_select_admin" ON audit_log FOR SELECT USING (is_admin());
