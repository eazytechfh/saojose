-- Adiciona colunas de CPF e data de nascimento na tabela de leads
ALTER TABLE "BASE_DE_LEADS"
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
ADD COLUMN IF NOT EXISTS data_nascimento DATE;
