-- Obras sociales más comunes en Argentina
INSERT INTO obras_sociales (name, code) VALUES
  ('OSDE', 'OSDE'),
  ('Swiss Medical', 'SWMED'),
  ('Galeno', 'GALEN'),
  ('Medicus', 'MEDIC'),
  ('IOMA', 'IOMA'),
  ('PAMI', 'PAMI'),
  ('Obra Social del Personal de Comercio (OSECAC)', 'OSECAC'),
  ('Unión Personal', 'UPAT'),
  ('Obra Social de Empleados de Comercio (OSPECOM)', 'OSPECOM'),
  ('Federada Salud', 'FEDSALUD'),
  ('Sancor Salud', 'SANCOR'),
  ('SIMECO', 'SIMECO'),
  ('Luis Pasteur', 'PASTEUR'),
  ('ACCORD', 'ACCORD'),
  ('Consolidar Salud', 'CONSOL'),
  ('Obra Social Bancaria (OSBA)', 'OSBA'),
  ('Daspu', 'DASPU'),
  ('Obra Social del Personal Gráfico (OSALCO)', 'OSALCO'),
  ('AMPE', 'AMPE'),
  ('Particular / Sin obra social', NULL)
ON CONFLICT (name) DO NOTHING;
