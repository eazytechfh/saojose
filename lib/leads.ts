import { createClient } from "@/utils/supabase/client"

export interface Lead {
  id: string | number
  id_empresa: number
  nome: string
  telefone?: string
  email?: string
  cpf?: string
  data_nascimento?: string
  origem?: string
  vendedor?: string
  veiculo_interesse?: string
  resumo_qualificacao?: string
  estagio_lead: string
  resumo_comercial?: string
  valor: number
  observacao_vendedor?: string
  created_at: string
  updated_at: string
}

export type LeadId = Lead["id"]

const PAGE_SIZE = 1000

function normalizeLeadIdForQuery(leadId: LeadId): string | number {
  if (typeof leadId === "number") return leadId

  const trimmed = String(leadId).trim()
  if (/^\d+$/.test(trimmed)) {
    const parsed = Number.parseInt(trimmed, 10)
    if (!Number.isNaN(parsed)) return parsed
  }

  return trimmed
}

function normalizeLeadRecord(rawLead: any): Lead {
  const estagio = rawLead?.estagio_lead === "pesquisa_atendimento" ? "follow_up" : rawLead?.estagio_lead
  return {
    ...rawLead,
    estagio_lead: estagio,
  } as Lead
}

export const ESTAGIO_LABELS = {
  oportunidade: "Oportunidade",
  em_qualificacao: "Em Qualificação",
  em_negociacao: "Em Negociação",
  resgate: "Resgate",
  fechado: "Fechado",
  nao_fechou: "Não Fechou",
  follow_up: "Follow Up",
}

export const ESTAGIO_COLORS = {
  oportunidade: "bg-blue-100 text-blue-800",
  em_qualificacao: "bg-yellow-100 text-yellow-800",
  em_negociacao: "bg-green-100 text-green-800",
  resgate: "bg-purple-100 text-purple-800",
  fechado: "bg-emerald-100 text-emerald-800",
  nao_fechou: "bg-red-100 text-red-800",
  follow_up: "bg-indigo-100 text-indigo-800",
}

// Lista dos estágios válidos para validação
export const VALID_ESTAGIOS = [
  "oportunidade",
  "em_qualificacao",
  "em_negociacao",
  "resgate",
  "fechado",
  "nao_fechou",
  "follow_up",
]

export async function getLeads(idEmpresa: number): Promise<Lead[]> {
  const supabase = createClient()

  // ✅ Alias para padronizar o front: nome <- nome_lead (do banco)
  const { data, error } = await supabase
    .from("BASE_DE_LEADS")
    .select("*, nome:nome_lead")
    .eq("id_empresa", idEmpresa)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1)

  if (error) {
    console.error("Error fetching leads:", error)
    return []
  }

  const firstPage = ((data as Lead[]) || []).map((lead) => normalizeLeadRecord(lead))
  if (firstPage.length < PAGE_SIZE) {
    return firstPage
  }

  const allLeads = [...firstPage]
  let from = PAGE_SIZE

  while (true) {
    const { data: nextData, error: nextError } = await supabase
      .from("BASE_DE_LEADS")
      .select("*, nome:nome_lead")
      .eq("id_empresa", idEmpresa)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (nextError) {
      console.error("Error fetching paginated leads:", nextError)
      break
    }

    const page = ((nextData as Lead[]) || []).map((lead) => normalizeLeadRecord(lead))
    allLeads.push(...page)

    if (page.length < PAGE_SIZE) {
      break
    }

    from += PAGE_SIZE
  }

  return allLeads
}

export async function getLeadsTotalCount(idEmpresa: number): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from("BASE_DE_LEADS")
    .select("id", { count: "exact", head: true })
    .eq("id_empresa", idEmpresa)

  if (error) {
    console.error("Error fetching leads total count:", error)
    return 0
  }

  return count || 0
}

export async function updateLeadStage(leadId: LeadId, newStage: string): Promise<boolean> {
  // Validar se o estágio é válido
  if (!VALID_ESTAGIOS.includes(newStage)) {
    console.error("Invalid stage:", newStage)
    return false
  }

  const supabase = createClient()
  const leadIdForQuery = normalizeLeadIdForQuery(leadId)

  try {
    if (newStage === "oportunidade") {
      const { data: currentLead, error: currentLeadError } = await supabase
        .from("BASE_DE_LEADS")
        .select("estagio_lead")
        .eq("id", leadIdForQuery)
        .maybeSingle()

      if (currentLeadError) {
        console.error("Error checking current lead stage:", currentLeadError)
        return false
      }

      if (currentLead && currentLead.estagio_lead && currentLead.estagio_lead !== "oportunidade") {
        console.error("Lead cannot be moved back to oportunidade:", leadId)
        return false
      }
    }

    const { data, error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        estagio_lead: newStage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdForQuery)
      // ✅ Alias também no retorno do update (senão lead.nome vem undefined)
      .select("*, nome:nome_lead")

    if (error) {
      console.error("Error updating lead stage:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return false
    }

    if (!data || data.length === 0) {
      console.error("No lead found with ID:", leadId)
      return false
    }

    console.log("Lead stage updated successfully:", {
      leadId,
      newStage,
      updatedLead: data[0],
    })

    if (newStage === "em_negociacao") {
      try {
        const lead = data[0] as Lead
        console.log("[v0] Lead moved to em_negociacao, creating agendamento for lead:", leadId)

        // Check if agendamento already exists for this lead
        const { data: existingAgendamentos, error: checkError } = await supabase
          .from("AGENDAMENTOS")
          .select("id")
          .eq("lead_id", String(leadId))

        if (!checkError && !existingAgendamentos?.length) {
          const agendamentoData = {
            id_empresa: lead.id_empresa,
            lead_id: String(leadId),
            titulo: `Agendamento - ${lead.nome}`,
            descricao: lead.veiculo_interesse ? `Interesse: ${lead.veiculo_interesse}` : null,
            data_agendamento: new Date().toISOString(),
            status: "Agendado",
            tipo: "visita",
            local: null,
          }

          const { data: newAgendamento, error: agendamentoError } = await supabase
            .from("AGENDAMENTOS")
            .insert([agendamentoData])
            .select()

          if (agendamentoError) {
            console.error("[v0] Error creating agendamento:", agendamentoError)
          } else {
            console.log("[v0] Agendamento created successfully:", newAgendamento?.[0])
          }
        } else {
          console.log("[v0] Agendamento already exists for lead:", leadId)
        }
      } catch (agendamentoError) {
        console.error("[v0] Unexpected error in auto-sync agendamento creation:", agendamentoError)
      }
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead stage:", error)
    return false
  }
}

export async function updateLeadValue(leadId: LeadId, newValue: number): Promise<boolean> {
  const supabase = createClient()
  const leadIdForQuery = normalizeLeadIdForQuery(leadId)

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        valor: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdForQuery)

    if (error) {
      console.error("Error updating lead value:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead value:", error)
    return false
  }
}

export async function updateLeadObservacao(leadId: LeadId, newObservacao: string): Promise<boolean> {
  const supabase = createClient()
  const leadIdForQuery = normalizeLeadIdForQuery(leadId)

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        observacao_vendedor: newObservacao,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdForQuery)

    if (error) {
      console.error("Error updating lead observacao:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead observacao:", error)
    return false
  }
}

export async function updateLeadVeiculo(leadId: LeadId, newVeiculo: string): Promise<boolean> {
  const supabase = createClient()
  const leadIdForQuery = normalizeLeadIdForQuery(leadId)

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        veiculo_interesse: newVeiculo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdForQuery)

    if (error) {
      console.error("Error updating lead veiculo:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead veiculo:", error)
    return false
  }
}

export async function updateLeadEmail(leadId: LeadId, newEmail: string): Promise<boolean> {
  const supabase = createClient()
  const leadIdForQuery = normalizeLeadIdForQuery(leadId)

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        email: newEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdForQuery)

    if (error) {
      console.error("Error updating lead email:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead email:", error)
    return false
  }
}

export async function updateLeadName(leadId: LeadId, newName: string): Promise<boolean> {
  const supabase = createClient()
  const leadIdForQuery = normalizeLeadIdForQuery(leadId)
  const sanitizedName = newName.trim()

  if (!sanitizedName) {
    console.error("Lead name cannot be empty")
    return false
  }

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        nome_lead: sanitizedName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdForQuery)

    if (error) {
      console.error("Error updating lead name:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead name:", error)
    return false
  }
}

export async function updateLeadCpf(leadId: LeadId, newCpf: string): Promise<boolean> {
  const supabase = createClient()
  const leadIdForQuery = normalizeLeadIdForQuery(leadId)

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        cpf: newCpf,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdForQuery)

    if (!error) {
      return true
    }

    const shouldFallback = error.code === "42703" || error.code === "PGRST204"
    if (!shouldFallback) {
      console.error("Error updating lead cpf:", error)
      return false
    }

    const { error: fallbackError } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        email: newCpf,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdForQuery)

    if (fallbackError) {
      console.error("Error updating lead cpf fallback (email):", fallbackError)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead cpf:", error)
    return false
  }
}

export async function updateLeadDataNascimento(leadId: LeadId, value: string): Promise<boolean> {
  const supabase = createClient()
  const leadIdForQuery = normalizeLeadIdForQuery(leadId)

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        data_nascimento: value || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdForQuery)

    if (error) {
      if (error.code === "42703" || error.code === "PGRST204") {
        console.error('Column "data_nascimento" not found. Run migration scripts/10-add-cpf-data-nascimento.sql')
      }
      console.error("Error updating lead data_nascimento:", error)

      // Fallback server-side usando service role para cenários de permissão no client (anon key/RLS).
      try {
        const response = await fetch("/api/leads/update-data-nascimento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: leadIdForQuery, value: value || null }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          console.error("Fallback API failed updating lead data_nascimento:", payload)
          return false
        }

        return true
      } catch (fallbackError) {
        console.error("Unexpected fallback error updating lead data_nascimento:", fallbackError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead data_nascimento:", error)
    return false
  }
}

function toBrasiliaTime(date: Date): string {
  // Criar nova data com offset de -3 horas (Brasília)
  const brasiliaOffset = -3 * 60 // -3 horas em minutos
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  const brasiliaTime = new Date(utc + brasiliaOffset * 60000)

  return brasiliaTime.toISOString()
}

export async function generateResumoComercial(lead: Lead): Promise<boolean> {
  try {
    console.log("[v0] Starting webhook call for lead:", lead.id)

    const webhookUrl = "https://n8n.eazy.tec.br/webhook/8c751d48-7396-4439-8883-6b247b3b6b12"

    const now = new Date()
    const brasiliaTimestamp = toBrasiliaTime(now)

    // Converter created_at e updated_at para horário de Brasília
    const createdAtBrasilia = toBrasiliaTime(new Date(lead.created_at))
    const updatedAtBrasilia = toBrasiliaTime(new Date(lead.updated_at))

    const payload = {
      id: lead.id,
      id_empresa: lead.id_empresa,
      nome_lead: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      cpf: lead.cpf,
      data_nascimento: lead.data_nascimento,
      origem: lead.origem,
      vendedor: lead.vendedor,
      veiculo_interesse: lead.veiculo_interesse,
      resumo_qualificacao: lead.resumo_qualificacao,
      estagio_lead: lead.estagio_lead,
      resumo_comercial: lead.resumo_comercial,
      valor: lead.valor,
      observacao_vendedor: lead.observacao_vendedor,
      created_at: createdAtBrasilia,
      updated_at: updatedAtBrasilia,
      timestamp: brasiliaTimestamp,
    }

    console.log("[v0] Webhook payload:", payload)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CRM-Atual-Veiculos/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      mode: "cors", // Explicitly set CORS mode
    })

    clearTimeout(timeoutId)

    console.log("[v0] Webhook response status:", response.status)
    console.log("[v0] Webhook response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error response")
      console.error("[v0] Webhook error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const responseData = await response.text().catch(() => "No response body")
    console.log("[v0] Webhook success response:", responseData)

    return true
  } catch (error) {
    console.error("[v0] Error sending webhook:", error)

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("[v0] Webhook request timed out after 30 seconds")
      } else if (error.message.includes("Failed to fetch")) {
        console.error("[v0] Network error - check if webhook URL is accessible and CORS is configured")
      }
      console.error("[v0] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
    }

    return false
  }
}

export async function sendFollowUpWebhook(lead: Lead): Promise<boolean> {
  try {
    console.log("[v0] Starting follow up webhook call for lead:", lead.id)

    const webhookUrl = "https://n8n.eazy.tec.br/webhook/2d6b0a48-4b0e-4848-91c1-6cd3a09c2ad8"

    const now = new Date()
    const brasiliaTimestamp = toBrasiliaTime(now)
    const createdAtBrasilia = toBrasiliaTime(new Date(lead.created_at))
    const updatedAtBrasilia = toBrasiliaTime(new Date(lead.updated_at))

    const payload = {
      id: lead.id,
      id_empresa: lead.id_empresa,
      nome_lead: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      cpf: lead.cpf,
      data_nascimento: lead.data_nascimento,
      origem: lead.origem,
      vendedor: lead.vendedor,
      veiculo_interesse: lead.veiculo_interesse,
      estagio_lead: lead.estagio_lead,
      valor: lead.valor,
      observacao_vendedor: lead.observacao_vendedor,
      created_at: createdAtBrasilia,
      updated_at: updatedAtBrasilia,
      timestamp: brasiliaTimestamp,
      action: "follow_up",
    }

    console.log("[v0] Follow up webhook payload:", payload)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CRM-Atual-Veiculos/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      mode: "cors",
    })

    clearTimeout(timeoutId)

    console.log("[v0] Follow up webhook response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error response")
      console.error("[v0] Follow up webhook error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    return true
  } catch (error) {
    console.error("[v0] Error sending follow up webhook:", error)
    return false
  }
}

export async function sendMensagemWebhook(lead: Lead, mensagem?: string): Promise<boolean> {
  try {
    console.log("[v0] Starting mensagem webhook call for lead:", lead.id)

    const webhookUrl = "https://n8n.eazy.tec.br/webhook/c2833163-8275-4e8f-ac50-764ae634be09"

    const now = new Date()
    const brasiliaTimestamp = toBrasiliaTime(now)
    const createdAtBrasilia = toBrasiliaTime(new Date(lead.created_at))
    const updatedAtBrasilia = toBrasiliaTime(new Date(lead.updated_at))

    const payload = {
      id: lead.id,
      id_empresa: lead.id_empresa,
      nome_lead: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      cpf: lead.cpf,
      data_nascimento: lead.data_nascimento,
      origem: lead.origem,
      vendedor: lead.vendedor,
      veiculo_interesse: lead.veiculo_interesse,
      estagio_lead: lead.estagio_lead,
      valor: lead.valor,
      observacao_vendedor: lead.observacao_vendedor,
      created_at: createdAtBrasilia,
      updated_at: updatedAtBrasilia,
      timestamp: brasiliaTimestamp,
      action: "send_message",
      mensagem: mensagem || "",
    }

    console.log("[v0] Mensagem webhook payload:", payload)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CRM-Atual-Veiculos/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      mode: "cors",
    })

    clearTimeout(timeoutId)

    console.log("[v0] Mensagem webhook response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error response")
      console.error("[v0] Mensagem webhook error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    return true
  } catch (error) {
    console.error("[v0] Error sending mensagem webhook:", error)
    return false
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function parseCurrency(value: string): number {
  if (!value || typeof value !== "string") return 0

  // Remove espaços e caracteres especiais, mantendo apenas números, vírgulas e pontos
  let cleanValue = value.replace(/[^\d,.-]/g, "")

  // Se estiver vazio após limpeza, retorna 0
  if (!cleanValue) return 0

  // Se tem vírgula, assumimos que é separador decimal brasileiro
  if (cleanValue.includes(",")) {
    if (cleanValue.includes(".") && cleanValue.includes(",")) {
      cleanValue = cleanValue.replace(/\./g, "").replace(",", ".")
    } else {
      cleanValue = cleanValue.replace(",", ".")
    }
  } else if (cleanValue.includes(".")) {
    const dotCount = (cleanValue.match(/\./g) || []).length
    if (dotCount > 1) {
      cleanValue = cleanValue.replace(/\./g, "")
    } else {
      const parts = cleanValue.split(".")
      if (parts[1] && parts[1].length > 2) {
        cleanValue = cleanValue.replace(".", "")
      }
    }
  }

  const numericValue = Number.parseFloat(cleanValue)
  return isNaN(numericValue) ? 0 : numericValue
}

export async function getLeadStats(idEmpresa: number) {
  const supabase = createClient()

  const leads: Array<{ estagio_lead: string; origem?: string; valor?: number }> = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("BASE_DE_LEADS")
      .select("estagio_lead, origem, valor")
      .eq("id_empresa", idEmpresa)
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error("Error fetching lead stats:", error)
      break
    }

    const page = data || []
    leads.push(...page)

    if (page.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  if (!leads.length) {
    return {
      totalLeads: 0,
      leadsPorEstagio: {},
      leadsPorOrigem: {},
      conversao: "0",
      valorTotal: 0,
      valorMedio: 0,
    }
  }

  const totalLeads = leads.length
  const leadsPorEstagio = leads.reduce((acc: any, lead) => {
    const estagio = lead.estagio_lead === "pesquisa_atendimento" ? "follow_up" : lead.estagio_lead
    acc[estagio] = (acc[estagio] || 0) + 1
    return acc
  }, {})

  const leadsPorOrigem = leads.reduce((acc: any, lead) => {
    if (lead.origem) {
      acc[lead.origem] = (acc[lead.origem] || 0) + 1
    }
    return acc
  }, {})

  const fechados = leadsPorEstagio.fechado || 0
  const conversao = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) : "0"

  const valorTotal = leads.reduce((sum, lead) => sum + (lead.valor || 0), 0)
  const valorMedio = totalLeads > 0 ? valorTotal / totalLeads : 0

  return {
    totalLeads,
    leadsPorEstagio,
    leadsPorOrigem,
    conversao,
    valorTotal,
    valorMedio,
  }
}

export async function deleteLead(leadId: LeadId): Promise<boolean> {
  const supabase = createClient()
  const leadIdForQuery = normalizeLeadIdForQuery(leadId)

  try {
    const { error } = await supabase.from("BASE_DE_LEADS").delete().eq("id", leadIdForQuery)

    if (error) {
      console.error("Error deleting lead:", error)
      return false
    }

    console.log("Lead deleted successfully:", leadId)
    return true
  } catch (error) {
    console.error("Unexpected error deleting lead:", error)
    return false
  }
}
