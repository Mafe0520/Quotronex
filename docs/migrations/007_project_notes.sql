-- Notas internas para proyectos
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS notes text;
