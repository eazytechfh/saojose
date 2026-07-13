-- Registra o resultado da venda do veículo e, quando necessário, o carro alternativo procurado.
ALTER TABLE "BASE_DE_LEADS"
ADD COLUMN IF NOT EXISTS status_venda_veiculo VARCHAR(20),
ADD COLUMN IF NOT EXISTS detalhes_outro_veiculo TEXT,
ADD COLUMN IF NOT EXISTS outro_veiculo_marca VARCHAR(100),
ADD COLUMN IF NOT EXISTS outro_veiculo_modelo VARCHAR(100),
ADD COLUMN IF NOT EXISTS outro_veiculo_ano VARCHAR(20),
ADD COLUMN IF NOT EXISTS outro_veiculo_cor VARCHAR(60),
ADD COLUMN IF NOT EXISTS outro_veiculo_valor NUMERIC(14, 2);

ALTER TABLE "BASE_DE_LEADS"
DROP CONSTRAINT IF EXISTS base_de_leads_status_venda_veiculo_check;

ALTER TABLE "BASE_DE_LEADS"
ADD CONSTRAINT base_de_leads_status_venda_veiculo_check
CHECK (status_venda_veiculo IS NULL OR status_venda_veiculo IN ('vendido', 'nao_vendido', 'procura_outro'));
