/*
  # Initialize Database Schema

  1. Creates all necessary tables for Altuza Digital CRM system:
    - AUTORIZAÇÃO: User authentication and authorization
    - VENDEDORES: Sales representatives
    - BASE_DE_LEADS: Customer leads and opportunities
    - AGENDAMENTOS: Appointments and test drives
    - estoque: Vehicle inventory
    - altuzadigital_chat_history: Chat message history

  2. Includes sample data for testing
  3. All tables have proper indexes and constraints
*/

-- =====================================================
-- 1. TABELA AUTORIZAÇÃO (Usuários do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS "AUTORIZAÇÃO" (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER NOT NULL,
  nome_empresa VARCHAR(255) NOT NULL,
  nome_usuario VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  plano VARCHAR(50) DEFAULT 'gratuito',
  status VARCHAR(20) DEFAULT 'ativo',
  cargo VARCHAR(20) DEFAULT 'convidado',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Constraints para AUTORIZAÇÃO
ALTER TABLE "AUTORIZAÇÃO" 
DROP CONSTRAINT IF EXISTS "AUTORIZAÇÃO_status_check";
ALTER TABLE "AUTORIZAÇÃO" 
ADD CONSTRAINT "AUTORIZAÇÃO_status_check" 
CHECK (status IN ('ativo', 'pendente', 'inativo'));

ALTER TABLE "AUTORIZAÇÃO" 
DROP CONSTRAINT IF EXISTS "AUTORIZAÇÃO_cargo_check";
ALTER TABLE "AUTORIZAÇÃO" 
ADD CONSTRAINT "AUTORIZAÇÃO_cargo_check" 
CHECK (cargo IN ('administrador', 'convidado', 'sdr', 'gestor', 'vendedor'));

-- Índices para AUTORIZAÇÃO
CREATE INDEX IF NOT EXISTS idx_autorizacao_email_status 
ON "AUTORIZAÇÃO" (email, status);
CREATE INDEX IF NOT EXISTS idx_autorizacao_empresa_status 
ON "AUTORIZAÇÃO" (id_empresa, status);
CREATE INDEX IF NOT EXISTS idx_autorizacao_empresa_cargo 
ON "AUTORIZAÇÃO" (id_empresa, cargo);

-- =====================================================
-- 2. TABELA VENDEDORES
-- =====================================================
CREATE TABLE IF NOT EXISTS "VENDEDORES" (
  "ID_VENDEDOR" SERIAL PRIMARY KEY,
  "NOME" VARCHAR(255) NOT NULL,
  "TELEFONE" VARCHAR(20),
  "EMAIL" VARCHAR(255),
  "CARGO" VARCHAR(100),
  "ID_EMPRESA" INTEGER NOT NULL,
  "ATIVO" BOOLEAN DEFAULT TRUE,
  "CREATED_AT" TIMESTAMP DEFAULT NOW(),
  "UPDATED_AT" TIMESTAMP DEFAULT NOW()
);

-- Índices para VENDEDORES
CREATE INDEX IF NOT EXISTS idx_vendedores_empresa 
ON "VENDEDORES" ("ID_EMPRESA");
CREATE INDEX IF NOT EXISTS idx_vendedores_ativo 
ON "VENDEDORES" ("ID_EMPRESA", "ATIVO");

-- =====================================================
-- 3. TABELA BASE_DE_LEADS
-- =====================================================
CREATE TABLE IF NOT EXISTS "BASE_DE_LEADS" (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER NOT NULL,
  nome_lead VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  origem VARCHAR(100),
  vendedor VARCHAR(255),
  veiculo_interesse VARCHAR(255),
  resumo_qualificacao TEXT,
  estagio_lead VARCHAR(50) DEFAULT 'oportunidade',
  resumo_comercial TEXT,
  valor DECIMAL(15,2) DEFAULT 0.00,
  observacao_vendedor TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Constraint para estagio_lead
ALTER TABLE "BASE_DE_LEADS" 
DROP CONSTRAINT IF EXISTS "BASE_DE_LEADS_estagio_lead_check";
ALTER TABLE "BASE_DE_LEADS" 
ADD CONSTRAINT "BASE_DE_LEADS_estagio_lead_check" 
CHECK (estagio_lead IN (
  'oportunidade', 
  'em_qualificacao', 
  'em_negociacao', 
  'fechado', 
  'nao_fechou', 
  'pesquisa_atendimento', 
  'follow_up'
));

-- Índices para BASE_DE_LEADS
CREATE INDEX IF NOT EXISTS idx_base_leads_empresa 
ON "BASE_DE_LEADS" (id_empresa);
CREATE INDEX IF NOT EXISTS idx_base_leads_estagio 
ON "BASE_DE_LEADS" (id_empresa, estagio_lead);
CREATE INDEX IF NOT EXISTS idx_base_leads_valor 
ON "BASE_DE_LEADS" (valor);
CREATE INDEX IF NOT EXISTS idx_base_leads_observacao 
ON "BASE_DE_LEADS" (id_empresa, observacao_vendedor);

-- =====================================================
-- 4. TABELA AGENDAMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS "AGENDAMENTOS" (
  "ID_AGENDAMENTO" SERIAL PRIMARY KEY,
  "id_empresa" VARCHAR(50) NOT NULL,
  "ID_LEAD" INTEGER,
  "nome_lead" VARCHAR(255),
  "telefone" VARCHAR(20),
  "email" VARCHAR(255),
  "MODELO_VEICULO" VARCHAR(255),
  "DATA_AGENDAMENTO" DATE,
  "HORA_AGENDAMENTO" TIME,
  "ID_VENDEDOR" INTEGER,
  "ESTAGIO" VARCHAR(50) DEFAULT 'agendar',
  "OBSERVACOES" TEXT,
  "CREATED_AT" TIMESTAMP DEFAULT NOW(),
  "UPDATED_AT" TIMESTAMP DEFAULT NOW()
);

-- Constraint para ESTAGIO de agendamentos
ALTER TABLE "AGENDAMENTOS" 
DROP CONSTRAINT IF EXISTS "AGENDAMENTOS_estagio_check";
ALTER TABLE "AGENDAMENTOS" 
ADD CONSTRAINT "AGENDAMENTOS_estagio_check" 
CHECK ("ESTAGIO" IN ('agendar', 'agendado', 'realizou_visita', 'fechou', 'nao_fechou'));

-- Índices para AGENDAMENTOS
CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa 
ON "AGENDAMENTOS" ("id_empresa");
CREATE INDEX IF NOT EXISTS idx_agendamentos_lead 
ON "AGENDAMENTOS" ("ID_LEAD");
CREATE INDEX IF NOT EXISTS idx_agendamentos_vendedor 
ON "AGENDAMENTOS" ("ID_VENDEDOR");
CREATE INDEX IF NOT EXISTS idx_agendamentos_data 
ON "AGENDAMENTOS" ("DATA_AGENDAMENTO");
CREATE INDEX IF NOT EXISTS idx_agendamentos_estagio 
ON "AGENDAMENTOS" ("id_empresa", "ESTAGIO");

-- =====================================================
-- 5. TABELA estoque
-- =====================================================
CREATE TABLE IF NOT EXISTS "estoque" (
  id SERIAL PRIMARY KEY,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  ano INTEGER NOT NULL,
  cor VARCHAR(50),
  combustivel VARCHAR(50),
  quilometragem INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Disponível',
  preco DECIMAL(15,2),
  id_empresa INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para estoque
CREATE INDEX IF NOT EXISTS idx_estoque_status 
ON "estoque" (status);
CREATE INDEX IF NOT EXISTS idx_estoque_empresa 
ON "estoque" (id_empresa);
CREATE INDEX IF NOT EXISTS idx_estoque_marca_modelo 
ON "estoque" (marca, modelo);

-- =====================================================
-- 6. TABELA altuzadigital_chat_history
-- =====================================================
CREATE TABLE IF NOT EXISTS "altuzadigital_chat_history" (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER NOT NULL,
  id_lead INTEGER,
  id_usuario INTEGER,
  tipo_mensagem VARCHAR(50) DEFAULT 'texto',
  conteudo TEXT NOT NULL,
  remetente VARCHAR(50) NOT NULL,
  canal VARCHAR(50) DEFAULT 'whatsapp',
  lido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para altuzadigital_chat_history
CREATE INDEX IF NOT EXISTS idx_chat_history_empresa 
ON "altuzadigital_chat_history" (id_empresa);
CREATE INDEX IF NOT EXISTS idx_chat_history_lead 
ON "altuzadigital_chat_history" (id_lead);
CREATE INDEX IF NOT EXISTS idx_chat_history_usuario 
ON "altuzadigital_chat_history" (id_usuario);
CREATE INDEX IF NOT EXISTS idx_chat_history_created 
ON "altuzadigital_chat_history" (created_at DESC);

-- =====================================================
-- DADOS INICIAIS DE EXEMPLO
-- =====================================================

-- Inserir usuário admin padrão
INSERT INTO "AUTORIZAÇÃO" (id_empresa, nome_empresa, nome_usuario, email, senha, telefone, plano, status, cargo)
VALUES (1, 'Administração', 'Admin', 'admin@admin.com.br', 'admin123', '(11) 99999-9999', 'premium', 'ativo', 'administrador')
ON CONFLICT (email) DO NOTHING;

-- Inserir vendedor de exemplo
INSERT INTO "VENDEDORES" ("NOME", "TELEFONE", "EMAIL", "CARGO", "ID_EMPRESA")
VALUES 
  ('Carlos Vendedor', '(11) 98765-4321', 'carlos@empresa.com', 'Vendedor Senior', 1)
ON CONFLICT DO NOTHING;

-- Inserir alguns leads de exemplo
INSERT INTO "BASE_DE_LEADS" (id_empresa, nome_lead, telefone, email, origem, vendedor, veiculo_interesse, resumo_qualificacao, estagio_lead, resumo_comercial, valor, observacao_vendedor)
VALUES 
  (1, 'João Silva', '(11) 98765-4321', 'joao@email.com', 'Site', 'Carlos Vendedor', 'Honda Civic', 'Cliente interessado em financiamento', 'oportunidade', 'Primeiro contato realizado', 85000.00, 'Cliente muito interessado')
ON CONFLICT DO NOTHING;

-- Inserir veículos de exemplo no estoque
INSERT INTO "estoque" (marca, modelo, ano, cor, combustivel, quilometragem, status, preco, id_empresa)
VALUES 
  ('Honda', 'Civic', 2024, 'Preto', 'Flex', 0, 'Disponível', 145000.00, 1)
ON CONFLICT DO NOTHING;