-- ============================================================
-- DIT Consultorios - Schema inicial
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- búsqueda fuzzy de texto

-- ============================================================
-- OBRAS SOCIALES (lookup)
-- ============================================================
CREATE TABLE obras_sociales (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  code       text UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROFILES (extiende auth.users)
-- ============================================================
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  role       text NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
  specialty  text CHECK (specialty IN ('oftalmologia', 'gastroenterologia', 'diabetologia', 'clinica_medica')),
  phone      text,
  avatar_url text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT doctor_needs_specialty CHECK (role != 'doctor' OR specialty IS NOT NULL)
);

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE patients (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name         text NOT NULL,
  last_name          text NOT NULL,
  dni                text UNIQUE,
  birth_date         date,
  sex                text CHECK (sex IN ('masculino', 'femenino', 'otro')),
  phone              text,
  phone_whatsapp     text,
  email              text,
  address            text,
  city               text DEFAULT 'Buenos Aires',
  obra_social_id     uuid REFERENCES obras_sociales(id),
  obra_social_number text,
  obra_social_plan   text,
  blood_type         text CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  allergies          text[] DEFAULT '{}',
  allergies_detail   text,
  background_notes   text,
  created_by         uuid REFERENCES profiles(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz,
  -- búsqueda full-text
  search_vector      tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish', coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(dni,''))
  ) STORED
);

CREATE INDEX patients_search_idx ON patients USING GIN (search_vector);
CREATE INDEX patients_phone_wa_idx ON patients(phone_whatsapp);
CREATE INDEX patients_dni_idx ON patients(dni);

-- ============================================================
-- DOCTOR AVAILABILITY (bloques semanales recurrentes)
-- ============================================================
CREATE TABLE doctor_availability (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week     int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  slot_duration   int NOT NULL DEFAULT 30,
  is_active       boolean NOT NULL DEFAULT true,
  effective_from  date,
  effective_until date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DOCTOR BLOCKS (vacaciones, feriados, etc.)
-- ============================================================
CREATE TABLE doctor_blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starts_at  timestamptz NOT NULL,
  ends_at    timestamptz NOT NULL,
  reason     text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE appointments (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id                uuid NOT NULL REFERENCES patients(id),
  doctor_id                 uuid NOT NULL REFERENCES profiles(id),
  specialty                 text NOT NULL,
  scheduled_at              timestamptz NOT NULL,
  duration_mins             int NOT NULL DEFAULT 30,
  status                    text NOT NULL DEFAULT 'pendiente'
                            CHECK (status IN ('pendiente','confirmado','cancelado','ausente','atendido')),
  reason                    text,
  notes                     text,
  whatsapp_reminder_sent_at timestamptz,
  cancelled_reason          text,
  cancelled_by              uuid REFERENCES profiles(id),
  created_by                uuid REFERENCES profiles(id),
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX appointments_doctor_scheduled_idx ON appointments(doctor_id, scheduled_at);
CREATE INDEX appointments_patient_idx ON appointments(patient_id);
CREATE INDEX appointments_status_idx ON appointments(status);
CREATE INDEX appointments_scheduled_idx ON appointments(scheduled_at);

-- ============================================================
-- CONSULTATIONS (historia clínica por visita)
-- ============================================================
CREATE TABLE consultations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id     uuid NOT NULL REFERENCES patients(id),
  appointment_id uuid REFERENCES appointments(id),
  doctor_id      uuid NOT NULL REFERENCES profiles(id),
  specialty      text NOT NULL,
  consulted_at   timestamptz NOT NULL DEFAULT now(),
  -- SOAP
  reason         text,
  subjective     text,
  objective      text,
  assessment     text,
  plan           text,
  -- Signos vitales
  weight_kg      numeric(5,2),
  height_cm      numeric(5,2),
  blood_pressure text,
  heart_rate     int,
  temperature    numeric(4,1),
  glucose        numeric(6,2),
  -- Meta
  is_draft       boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX consultations_patient_idx ON consultations(patient_id, consulted_at DESC);
CREATE INDEX consultations_doctor_idx ON consultations(doctor_id, consulted_at DESC);

-- ============================================================
-- DIAGNOSES (ICD-10, múltiples por consulta)
-- ============================================================
CREATE TABLE diagnoses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id   uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  icd10_code        text NOT NULL,
  icd10_description text NOT NULL,
  is_primary        boolean NOT NULL DEFAULT false,
  type              text CHECK (type IN ('presuntivo','definitivo','cronico')),
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX diagnoses_consultation_idx ON diagnoses(consultation_id);

-- ============================================================
-- TREATMENTS (medicamentos, indicaciones, derivaciones)
-- ============================================================
CREATE TABLE treatments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id      uuid NOT NULL REFERENCES patients(id),
  type            text NOT NULL CHECK (type IN ('medicamento','procedimiento','indicacion','derivacion')),
  name            text NOT NULL,
  dosage          text,
  frequency       text,
  duration        text,
  instructions    text,
  starts_at       date,
  ends_at         date,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX treatments_patient_idx ON treatments(patient_id, is_active);

-- ============================================================
-- MEDICAL FILES (estudios, imágenes, PDFs)
-- ============================================================
CREATE TABLE medical_files (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES patients(id),
  consultation_id uuid REFERENCES consultations(id),
  uploaded_by     uuid NOT NULL REFERENCES profiles(id),
  file_name       text NOT NULL,
  file_type       text NOT NULL,
  file_size       bigint,
  storage_path    text NOT NULL UNIQUE,
  category        text CHECK (category IN ('estudio','imagen','laboratorio','receta','otro')),
  description     text,
  study_date      date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX medical_files_patient_idx ON medical_files(patient_id);
CREATE INDEX medical_files_consultation_idx ON medical_files(consultation_id);

-- ============================================================
-- WHATSAPP CONVERSATIONS
-- ============================================================
CREATE TABLE whatsapp_conversations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid REFERENCES patients(id),
  phone_number     text NOT NULL,
  status           text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','escalated','closed')),
  escalated_at     timestamptz,
  escalated_reason text,
  closed_at        timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX whatsapp_conversations_phone_idx ON whatsapp_conversations(phone_number);

CREATE TABLE whatsapp_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES whatsapp_conversations(id),
  direction       text NOT NULL CHECK (direction IN ('inbound','outbound')),
  role            text NOT NULL CHECK (role IN ('user','assistant','system')),
  content         text NOT NULL,
  wa_message_id   text UNIQUE,
  tokens_used     int,
  model_used      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX whatsapp_messages_conversation_idx ON whatsapp_messages(conversation_id, created_at);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id         bigserial PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id),
  action     text NOT NULL,
  table_name text NOT NULL,
  record_id  text NOT NULL,
  old_data   jsonb,
  new_data   jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_user_idx ON audit_log(user_id, created_at DESC);
CREATE INDEX audit_log_record_idx ON audit_log(table_name, record_id);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_whatsapp_conv_updated_at BEFORE UPDATE ON whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TRIGGER: nuevo usuario → profile automático
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
