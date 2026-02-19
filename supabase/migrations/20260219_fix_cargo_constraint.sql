-- Fix cargo constraint in AUTORIZAÇÃO table
-- Add missing cargo values: sdr, gestor, vendedor

ALTER TABLE "AUTORIZAÇÃO" 
DROP CONSTRAINT IF EXISTS "AUTORIZAÇÃO_cargo_check";

ALTER TABLE "AUTORIZAÇÃO" 
ADD CONSTRAINT "AUTORIZAÇÃO_cargo_check" 
CHECK (cargo IN ('administrador', 'convidado', 'sdr', 'gestor', 'vendedor'));
