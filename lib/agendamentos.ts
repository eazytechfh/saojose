import { createClient } from "@/utils/supabase/client"

export interface Agendamento {
  id: string
  id_empresa?: number
  lead_id?: string
  nome_lead?: string
  telefone?: string
  email?: string
  titulo: string
  descricao?: string
  data_agendamento: string
  vendedor_nome?: string
  vendedor_id?: string
  status: string
  tipo?: string
  local?: string
  criado_em: string
  atualizado_em: string
}

export interface Vendedor {
  id: string
  nome: string
  telefone?: string
  cargo?: string
  id_empresa?: number
}

export const ESTAGIO_AGENDAMENTO_LABELS: Record<string, string> = {
  Agendado: "Agendado",
  Confirmado: "Confirmado",
  Realizado: "Realizado",
  Cancelado: "Cancelado",
  Reagendado: "Reagendado",
}

export const ESTAGIO_AGENDAMENTO_COLORS: Record<string, string> = {
  Agendado: "bg-blue-100 text-blue-800",
  Confirmado: "bg-cyan-100 text-cyan-800",
  Realizado: "bg-green-100 text-green-800",
  Cancelado: "bg-red-100 text-red-800",
  Reagendado: "bg-yellow-100 text-yellow-800",
}

export const VALID_ESTAGIOS_AGENDAMENTO = ["Agendado", "Confirmado", "Realizado", "Cancelado", "Reagendado"]

export async function getAgendamentos(idEmpresa: number): Promise<Agendamento[]> {
  const supabase = createClient()

  // Primeiro, buscar os agendamentos
  const { data: agendamentos, error: agendamentosError } = await supabase
    .from("AGENDAMENTOS")
    .select("*")
    .eq("id_empresa", idEmpresa)
    .order("criado_em", { ascending: false })

  if (agendamentosError) {
    console.error("[v0] Error fetching agendamentos:", agendamentosError.message)
    return []
  }

  if (!agendamentos || agendamentos.length === 0) {
    return []
  }

  // Buscar vendedores separadamente
  const { data: vendedores, error: vendedoresError } = await supabase
    .from("VENDEDORES")
    .select("id, nome")
    .eq("id_empresa", idEmpresa)

  if (vendedoresError) {
    console.error("[v0] Error fetching vendedores for agendamentos:", vendedoresError.message)
  }

  // Criar um mapa de vendedores por ID
  const vendedoresMap = new Map<string, string>()
  if (vendedores) {
    vendedores.forEach((v: any) => {
      vendedoresMap.set(v.id, v.nome)
    })
  }

  // Buscar dados dos leads associados
  const leadIds = agendamentos
    .map((a: any) => a.lead_id)
    .filter(Boolean)
  
  let leadsMap = new Map<string, any>()
  if (leadIds.length > 0) {
    const { data: leads, error: leadsError } = await supabase
      .from("BASE_DE_LEADS")
      .select("id, nome, telefone, email, veiculo_interesse")
      .in("id", leadIds)

    if (!leadsError && leads) {
      leads.forEach((lead: any) => {
        leadsMap.set(lead.id.toString(), lead)
      })
    }
  }

  // Mapear os dados com o nome do vendedor e informações do lead
  return agendamentos.map((item: any) => {
    const lead = item.lead_id ? leadsMap.get(item.lead_id.toString()) : null
    return {
      ...item,
      vendedor_nome: item.vendedor_id ? vendedoresMap.get(item.vendedor_id) || null : null,
      nome_lead: lead?.nome || null,
      telefone: lead?.telefone || null,
      email: lead?.email || null,
    }
  })
}

export async function getAgendamentosByLead(idLead: string): Promise<Agendamento[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("AGENDAMENTOS")
    .select("*")
    .eq("lead_id", idLead)
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("Error fetching agendamentos by lead:", error.message)
    return []
  }

  return data || []
}

export async function createAgendamento(agendamento: Partial<Agendamento>): Promise<Agendamento | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("AGENDAMENTOS").insert([agendamento]).select()

    if (error) {
      console.error("Error creating agendamento:", error.message)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error("Unexpected error creating agendamento:", error)
    return null
  }
}

export async function updateAgendamento(id: string, updates: Partial<Agendamento>): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("AGENDAMENTOS")
      .update({
        ...updates,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating agendamento:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating agendamento:", error)
    return false
  }
}

export async function updateAgendamentoStage(id: string, novoEstagio: string): Promise<boolean> {
  if (!VALID_ESTAGIOS_AGENDAMENTO.includes(novoEstagio)) {
    console.error("Invalid agendamento stage:", novoEstagio)
    return false
  }

  return updateAgendamento(id, { status: novoEstagio })
}

export async function deleteAgendamento(id: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("AGENDAMENTOS").delete().eq("id", id)

    if (error) {
      console.error("Error deleting agendamento:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error deleting agendamento:", error)
    return false
  }
}

export async function sendAgendamentoWebhook(agendamento: Agendamento): Promise<boolean> {
  try {
    const webhookUrl = "https://n8n.eazy.tec.br/webhook/5693f8c5-f54c-4940-9ec6-87a160be27be"

    const payload = {
      id: agendamento.id,
      id_empresa: agendamento.id_empresa,
      lead_id: agendamento.lead_id,
      nome_lead: agendamento.nome_lead,
      telefone: agendamento.telefone,
      email: agendamento.email,
      titulo: agendamento.titulo,
      descricao: agendamento.descricao,
      data_agendamento: agendamento.data_agendamento,
      vendedor_nome: agendamento.vendedor_nome,
      vendedor_id: agendamento.vendedor_id,
      status: agendamento.status,
      tipo: agendamento.tipo,
      local: agendamento.local,
      criado_em: agendamento.criado_em,
      atualizado_em: agendamento.atualizado_em,
      timestamp: new Date().toISOString(),
      action: "agendamento_salvo",
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error("[v0] Agendamento webhook error:", response.status)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Error sending agendamento webhook:", error)
    return false
  }
}

export async function getVendedores(idEmpresa: string | number): Promise<Vendedor[]> {
  const supabase = createClient()
  const empresaId = typeof idEmpresa === "string" ? Number.parseInt(idEmpresa, 10) : idEmpresa

  const { data, error } = await supabase
    .from("VENDEDORES")
    .select("id, nome, telefone, cargo, id_empresa")
    .eq("id_empresa", empresaId)
    .order("nome", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching vendedores:", error.message)
    return []
  }

  return data || []
}
