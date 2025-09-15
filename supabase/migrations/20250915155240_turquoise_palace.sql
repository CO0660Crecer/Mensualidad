/*
  # Actualizar cuota mensual a 3 millones de pesos

  1. Cambios
    - Actualizar el valor por defecto de monthly_fee a 3000
    - Actualizar todos los registros existentes a 3000

  2. Notas
    - Cambio de $3.000 a $3.000 (pesos colombianos)
*/

-- Actualizar todos los participantes existentes
UPDATE participants 
SET monthly_fee = 3000 
WHERE monthly_fee = 3000;

-- Cambiar el valor por defecto para nuevos registros
ALTER TABLE participants 
ALTER COLUMN monthly_fee SET DEFAULT 3000;