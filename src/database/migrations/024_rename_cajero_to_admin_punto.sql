-- 024_rename_cajero_to_admin_punto.sql
-- Renombrar el rol de Cajero a Administrador de Punto

UPDATE KS_ROLES 
SET RL_NOMBRE = 'ADMINISTRADOR_PUNTO' 
WHERE RL_NOMBRE = 'CAJERO';
