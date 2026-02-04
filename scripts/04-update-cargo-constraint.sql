-- Remover a constraint antiga e adicionar nova com mais cargos
ALTER TABLE "AUTORIZAÇÃO" DROP CONSTRAINT IF EXISTS "AUTORIZAÇÃO_cargo_check";

-- Adicionar nova constraint com todos os cargos permitidos
ALTER TABLE "AUTORIZAÇÃO" ADD CONSTRAINT "AUTORIZAÇÃO_cargo_check" 
CHECK (cargo IN ('administrador', 'convidado', 'sdr', 'gestor', 'vendedor'));
