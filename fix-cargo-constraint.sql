-- Execute this SQL in Supabase SQL Editor to fix the cargo constraint
-- This allows sdr, gestor, and vendedor roles in addition to administrador and convidado

ALTER TABLE "AUTORIZAÇÃO" 
DROP CONSTRAINT IF EXISTS "AUTORIZAÇÃO_cargo_check";

ALTER TABLE "AUTORIZAÇÃO" 
ADD CONSTRAINT "AUTORIZAÇÃO_cargo_check" 
CHECK (cargo IN ('administrador', 'convidado', 'sdr', 'gestor', 'vendedor'));
