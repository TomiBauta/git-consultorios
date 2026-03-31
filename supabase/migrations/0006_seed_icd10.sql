-- Tabla de catálogo ICD-10 para búsqueda (separada de diagnoses que son por consulta)
-- Reutilizamos la tabla diagnoses como catálogo usando una consulta especial
-- En su lugar, creamos una tabla dedicada de búsqueda

CREATE TABLE IF NOT EXISTS icd10_catalog (
  code        text PRIMARY KEY,
  description text NOT NULL,
  category    text,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish', code || ' ' || description)
  ) STORED
);

CREATE INDEX IF NOT EXISTS icd10_catalog_search_idx ON icd10_catalog USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS icd10_catalog_code_idx ON icd10_catalog(code text_pattern_ops);

-- RLS: todos los usuarios autenticados pueden leer
ALTER TABLE icd10_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "icd10_catalog_select_all" ON icd10_catalog FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- Oftalmología
-- ============================================================
INSERT INTO icd10_catalog (code, description, category) VALUES
('H00.0',  'Orzuelo', 'oftalmologia'),
('H01.0',  'Blefaritis', 'oftalmologia'),
('H02.4',  'Ptosis del párpado', 'oftalmologia'),
('H04.1',  'Obstrucción de las vías lagrimales', 'oftalmologia'),
('H10.0',  'Conjuntivitis mucopurulenta', 'oftalmologia'),
('H10.1',  'Conjuntivitis atópica aguda', 'oftalmologia'),
('H10.2',  'Otras conjuntivitis agudas', 'oftalmologia'),
('H10.4',  'Conjuntivitis crónica', 'oftalmologia'),
('H11.0',  'Pterigión', 'oftalmologia'),
('H11.3',  'Hemorragia subconjuntival', 'oftalmologia'),
('H15.0',  'Escleritis', 'oftalmologia'),
('H16.0',  'Úlcera corneal', 'oftalmologia'),
('H18.6',  'Queratocono', 'oftalmologia'),
('H20.0',  'Iridociclitis aguda', 'oftalmologia'),
('H25.0',  'Catarata senil incipiente', 'oftalmologia'),
('H25.1',  'Catarata senil nuclear', 'oftalmologia'),
('H25.9',  'Catarata senil no especificada', 'oftalmologia'),
('H26.0',  'Catarata infantil y juvenil', 'oftalmologia'),
('H27.0',  'Afaquia', 'oftalmologia'),
('H33.0',  'Desprendimiento de retina con desgarro', 'oftalmologia'),
('H33.5',  'Otras degeneraciones retinianas', 'oftalmologia'),
('H34.0',  'Oclusión arterial retiniana transitoria', 'oftalmologia'),
('H35.0',  'Retinopatía del fondo de ojo y cambios vasculares', 'oftalmologia'),
('H35.1',  'Retinopatía de la prematurez', 'oftalmologia'),
('H35.3',  'Degeneración de la mácula y del polo posterior', 'oftalmologia'),
('H40.0',  'Sospecha de glaucoma', 'oftalmologia'),
('H40.1',  'Glaucoma primario de ángulo abierto', 'oftalmologia'),
('H40.2',  'Glaucoma primario de ángulo cerrado', 'oftalmologia'),
('H43.1',  'Hemorragia del cuerpo vítreo', 'oftalmologia'),
('H44.1',  'Oftalmía simpática', 'oftalmologia'),
('H52.0',  'Hipermetropía', 'oftalmologia'),
('H52.1',  'Miopía', 'oftalmologia'),
('H52.2',  'Astigmatismo', 'oftalmologia'),
('H52.4',  'Presbicia', 'oftalmologia'),
('H53.0',  'Ambliopía por anisometropía', 'oftalmologia'),
('H54.0',  'Ceguera binocular', 'oftalmologia'),
('H57.0',  'Anomalías de la función pupilar', 'oftalmologia'),

-- ============================================================
-- Gastroenterología
-- ============================================================
('K20',    'Esofagitis', 'gastroenterologia'),
('K21.0',  'Enfermedad por reflujo gastroesofágico con esofagitis', 'gastroenterologia'),
('K21.9',  'Enfermedad por reflujo gastroesofágico sin esofagitis', 'gastroenterologia'),
('K25.0',  'Úlcera gástrica aguda con hemorragia', 'gastroenterologia'),
('K25.9',  'Úlcera gástrica no especificada', 'gastroenterologia'),
('K26.9',  'Úlcera duodenal no especificada', 'gastroenterologia'),
('K29.0',  'Gastritis aguda hemorrágica', 'gastroenterologia'),
('K29.5',  'Gastritis crónica no especificada', 'gastroenterologia'),
('K29.7',  'Gastritis no especificada', 'gastroenterologia'),
('K30',    'Dispepsia', 'gastroenterologia'),
('K31.8',  'Otras enfermedades especificadas del estómago y del duodeno', 'gastroenterologia'),
('K35.8',  'Apendicitis aguda no especificada', 'gastroenterologia'),
('K40.9',  'Hernia inguinal no especificada', 'gastroenterologia'),
('K44.9',  'Hernia diafragmática no especificada', 'gastroenterologia'),
('K50.0',  'Enfermedad de Crohn del intestino delgado', 'gastroenterologia'),
('K50.1',  'Enfermedad de Crohn del intestino grueso', 'gastroenterologia'),
('K51.0',  'Enterocolitis ulcerativa', 'gastroenterologia'),
('K51.9',  'Colitis ulcerativa no especificada', 'gastroenterologia'),
('K52.9',  'Gastroenteritis y colitis no infecciosa no especificada', 'gastroenterologia'),
('K57.3',  'Diverticulosis del intestino grueso sin perforación ni absceso', 'gastroenterologia'),
('K58.0',  'Síndrome del colon irritable con diarrea', 'gastroenterologia'),
('K58.9',  'Síndrome del colon irritable sin diarrea', 'gastroenterologia'),
('K59.0',  'Estreñimiento', 'gastroenterologia'),
('K63.5',  'Pólipo del colon', 'gastroenterologia'),
('K70.0',  'Hígado graso alcohólico', 'gastroenterologia'),
('K72.0',  'Insuficiencia hepática aguda y subaguda', 'gastroenterologia'),
('K73.9',  'Hepatitis crónica no especificada', 'gastroenterologia'),
('K74.6',  'Cirrosis hepática no especificada', 'gastroenterologia'),
('K75.0',  'Absceso hepático', 'gastroenterologia'),
('K76.0',  'Degeneración grasa del hígado - NASH/NAFLD', 'gastroenterologia'),
('K80.1',  'Cálculos biliares con otras colecistitis', 'gastroenterologia'),
('K80.2',  'Cálculos biliares sin colecistitis', 'gastroenterologia'),
('K81.0',  'Colecistitis aguda', 'gastroenterologia'),
('K81.1',  'Colecistitis crónica', 'gastroenterologia'),
('K85.9',  'Pancreatitis aguda no especificada', 'gastroenterologia'),
('K86.1',  'Otras pancreatitis crónicas', 'gastroenterologia'),
('K92.1',  'Melena', 'gastroenterologia'),

-- ============================================================
-- Diabetología / Endocrinología
-- ============================================================
('E10.9',  'Diabetes mellitus tipo 1 sin complicaciones', 'diabetologia'),
('E11.0',  'Diabetes mellitus tipo 2 con coma', 'diabetologia'),
('E11.2',  'Diabetes mellitus tipo 2 con complicaciones renales', 'diabetologia'),
('E11.3',  'Diabetes mellitus tipo 2 con complicaciones oftálmicas', 'diabetologia'),
('E11.4',  'Diabetes mellitus tipo 2 con complicaciones neurológicas', 'diabetologia'),
('E11.5',  'Diabetes mellitus tipo 2 con complicaciones circulatorias periféricas', 'diabetologia'),
('E11.6',  'Diabetes mellitus tipo 2 con otras complicaciones especificadas', 'diabetologia'),
('E11.7',  'Diabetes mellitus tipo 2 con complicaciones múltiples', 'diabetologia'),
('E11.9',  'Diabetes mellitus tipo 2 sin complicaciones', 'diabetologia'),
('E13.9',  'Otras diabetes mellitus especificadas sin complicaciones', 'diabetologia'),
('E14.9',  'Diabetes mellitus no especificada sin complicaciones', 'diabetologia'),
('E16.0',  'Hipoglucemia por insulina sin coma', 'diabetologia'),
('E16.2',  'Hipoglucemia no especificada', 'diabetologia'),
('E03.9',  'Hipotiroidismo no especificado', 'diabetologia'),
('E05.0',  'Tirotoxicosis con bocio difuso - Graves', 'diabetologia'),
('E05.9',  'Tirotoxicosis no especificada', 'diabetologia'),
('E06.3',  'Tiroiditis autoinmune - Hashimoto', 'diabetologia'),
('E10.3',  'Diabetes mellitus tipo 1 con complicaciones oftálmicas', 'diabetologia'),
('E10.5',  'Diabetes mellitus tipo 1 con complicaciones circulatorias periféricas', 'diabetologia'),
('E66.0',  'Obesidad debida a exceso de calorías', 'diabetologia'),
('E66.9',  'Obesidad no especificada', 'diabetologia'),
('E78.0',  'Hipercolesterolemia pura', 'diabetologia'),
('E78.1',  'Hipergliceridemia pura', 'diabetologia'),
('E78.5',  'Hiperlipidemia no especificada', 'diabetologia'),
('E79.0',  'Hiperuricemia sin gota', 'diabetologia'),
('R73.0',  'Glucosa elevada en sangre - prediabetes', 'diabetologia'),
('R73.09', 'Resistencia a la insulina / prediabetes', 'diabetologia'),

-- ============================================================
-- Clínica médica / General
-- ============================================================
('I10',    'Hipertensión esencial', 'clinica_medica'),
('I11.9',  'Cardiopatía hipertensiva sin insuficiencia cardíaca', 'clinica_medica'),
('I25.1',  'Enfermedad aterosclerótica del corazón', 'clinica_medica'),
('I48.0',  'Fibrilación auricular paroxística', 'clinica_medica'),
('I48.2',  'Fibrilación auricular crónica', 'clinica_medica'),
('I50.0',  'Insuficiencia cardíaca congestiva', 'clinica_medica'),
('I63.9',  'Infarto cerebral no especificado - ACV', 'clinica_medica'),
('J00',    'Rinofaringitis aguda - resfrío común', 'clinica_medica'),
('J06.9',  'Infección aguda de las vías respiratorias superiores', 'clinica_medica'),
('J18.9',  'Neumonía no especificada', 'clinica_medica'),
('J20.9',  'Bronquitis aguda no especificada', 'clinica_medica'),
('J44.1',  'Enfermedad pulmonar obstructiva crónica con exacerbación aguda - EPOC', 'clinica_medica'),
('J45.9',  'Asma no especificada', 'clinica_medica'),
('M10.9',  'Gota no especificada', 'clinica_medica'),
('M54.5',  'Lumbago', 'clinica_medica'),
('N18.9',  'Enfermedad renal crónica no especificada', 'clinica_medica'),
('N39.0',  'Infección de vías urinarias sitio no especificado', 'clinica_medica'),
('R00.0',  'Taquicardia no especificada', 'clinica_medica'),
('R05',    'Tos', 'clinica_medica'),
('R06.0',  'Disnea', 'clinica_medica'),
('R50.9',  'Fiebre no especificada', 'clinica_medica'),
('R51',    'Cefalea', 'clinica_medica'),
('R53',    'Malestar y fatiga', 'clinica_medica'),
('R55',    'Síncope y colapso', 'clinica_medica'),
('Z00.0',  'Examen médico general - control periódico', 'clinica_medica'),
('Z13.6',  'Examen de detección de enfermedades cardiovasculares', 'clinica_medica'),
('Z76.3',  'Persona en buena salud que acompaña al enfermo', 'clinica_medica')
ON CONFLICT (code) DO NOTHING;
