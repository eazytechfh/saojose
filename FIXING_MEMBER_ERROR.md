# Correção: Erro ao Adicionar Membro - Cargo Inválido

## Problema
Quando você tenta adicionar um novo membro na aba "Configurações" com cargo "SDR", "Gestor" ou "Vendedor", recebe o erro: "Erro ao adicionar membro. Tente novamente."

## Causa
A tabela `AUTORIZAÇÃO` no banco de dados atual tem uma constraint (restrição) que só permite os cargos "administrador" e "convidado". Os outros cargos ("sdr", "gestor", "vendedor") não estão na lista de valores permitidos.

## Solução

### Passo 1: Executar SQL no Supabase

1. Vá para [Supabase Dashboard](https://app.supabase.com)
2. Acesse seu projeto
3. Vá à aba **SQL Editor** (lado esquerdo)
4. Clique em **New query**
5. Copie e cole o conteúdo do arquivo `fix-cargo-constraint.sql`:

```sql
ALTER TABLE "AUTORIZAÇÃO" 
DROP CONSTRAINT IF EXISTS "AUTORIZAÇÃO_cargo_check";

ALTER TABLE "AUTORIZAÇÃO" 
ADD CONSTRAINT "AUTORIZAÇÃO_cargo_check" 
CHECK (cargo IN ('administrador', 'convidado', 'sdr', 'gestor', 'vendedor'));
```

6. Clique em **RUN** (ou Ctrl+Enter)

### Passo 2: Verificar se funcionou

Depois de executar o SQL, você deve ser capaz de adicionar membros com qualquer um dos 5 cargos:
- ✅ Administrador
- ✅ Convidado
- ✅ SDR
- ✅ Gestor
- ✅ Vendedor

## Mudanças no Código

Também foram melhoradas:

1. **Validação no formulário** - Agora valida os campos antes de enviar
2. **Mensagens de erro melhores** - Feedback mais específico sobre o problema
3. **Validação na função `addCompanyMember`** - Verifica o cargo e status antes de enviar para o banco
4. **Logs de erro melhorados** - Facilita o debug se o problema persistir

## Se o erro persistir

Se mesmo após executar o SQL o erro continuar:

1. Verifique se a constraint foi realmente criada:
   ```sql
   SELECT constraint_name, check_clause
   FROM information_schema.table_constraints
   WHERE table_name = 'AUTORIZAÇÃO' AND constraint_type = 'CHECK';
   ```

2. Em caso de dúvida, contate o suporte técnico
