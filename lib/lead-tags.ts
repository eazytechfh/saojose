import { createClient } from "@/utils/supabase/client"

export interface LeadTag {
  id: number
  id_empresa: number
  nome: string
  cor: LeadTagColor
  created_at: string
  updated_at: string
}

export type LeadTagColor = (typeof LEAD_TAG_COLOR_OPTIONS)[number]["value"]
export type LeadTagsMap = Record<string, LeadTag[]>
export type LeadTagId = string | number

export const LEAD_TAG_COLOR_OPTIONS = [
  { value: "azul_claro", label: "Azul claro", color: "#38bdf8", text: "#082f49" },
  { value: "azul_escuro", label: "Azul escuro", color: "#1d4ed8", text: "#ffffff" },
  { value: "verde", label: "Verde", color: "#16a34a", text: "#ffffff" },
  { value: "vermelho", label: "Vermelho", color: "#dc2626", text: "#ffffff" },
  { value: "amarelo", label: "Amarelo", color: "#facc15", text: "#422006" },
  { value: "roxo", label: "Roxo", color: "#9333ea", text: "#ffffff" },
  { value: "marrom", label: "Marrom", color: "#92400e", text: "#ffffff" },
  { value: "laranja", label: "Laranja", color: "#ea580c", text: "#ffffff" },
  { value: "cinza", label: "Cinza", color: "#6b7280", text: "#ffffff" },
  { value: "branco", label: "Branco", color: "#ffffff", text: "#111827" },
] as const

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ")
}

function normalizeColor(color?: string | null): LeadTagColor {
  return LEAD_TAG_COLOR_OPTIONS.some((option) => option.value === color) ? (color as LeadTagColor) : "verde"
}

export function getLeadTagDisplayStyle(color?: string | null) {
  const option = LEAD_TAG_COLOR_OPTIONS.find((item) => item.value === normalizeColor(color)) || LEAD_TAG_COLOR_OPTIONS[2]
  return { backgroundColor: option.color, color: option.text, borderColor: option.value === "branco" ? "#d1d5db" : option.color }
}

export async function getLeadTags(idEmpresa: number): Promise<LeadTag[]> {
  const { data, error } = await createClient().from("lead_tags").select("*").eq("id_empresa", idEmpresa).order("nome")
  if (error) throw error
  return ((data as LeadTag[]) || []).map((tag) => ({ ...tag, cor: normalizeColor(tag.cor) }))
}

export async function getLeadTagsMap(idEmpresa: number): Promise<LeadTagsMap> {
  const supabase = createClient()
  const [{ data: tags, error: tagsError }, { data: assignments, error: assignmentsError }] = await Promise.all([
    supabase.from("lead_tags").select("*").eq("id_empresa", idEmpresa),
    supabase.from("lead_tag_assignments").select("lead_id, tag_id").eq("id_empresa", idEmpresa),
  ])
  if (tagsError || assignmentsError) {
    console.error("Erro ao carregar etiquetas dos leads:", tagsError || assignmentsError)
    return {}
  }
  const tagsById = new Map((tags as LeadTag[]).map((tag) => [tag.id, { ...tag, cor: normalizeColor(tag.cor) }]))
  return (assignments || []).reduce<LeadTagsMap>((map, assignment) => {
    const tag = tagsById.get(assignment.tag_id)
    if (tag) map[String(assignment.lead_id)] = [...(map[String(assignment.lead_id)] || []), tag]
    return map
  }, {})
}

export async function createLeadTag(idEmpresa: number, name: string, color: LeadTagColor = "verde") {
  const nome = normalizeName(name)
  if (!nome) return null
  const { data, error } = await createClient().from("lead_tags").insert({ id_empresa: idEmpresa, nome, cor: normalizeColor(color) }).select("*").single()
  if (error?.code === "23505") return null
  if (error) throw error
  return data as LeadTag
}

export async function updateLeadTag(tagId: number, idEmpresa: number, name: string, color: LeadTagColor) {
  const nome = normalizeName(name)
  if (!nome) return false
  const { error } = await createClient().from("lead_tags").update({ nome, cor: normalizeColor(color), updated_at: new Date().toISOString() }).eq("id", tagId).eq("id_empresa", idEmpresa)
  return !error
}

export async function deleteLeadTag(tagId: number, idEmpresa: number) {
  const { error } = await createClient().from("lead_tags").delete().eq("id", tagId).eq("id_empresa", idEmpresa)
  return !error
}

export async function assignTagToLead(leadId: LeadTagId, tag: LeadTag) {
  const { error } = await createClient().from("lead_tag_assignments").upsert(
    { lead_id: Number(leadId), tag_id: tag.id, id_empresa: tag.id_empresa },
    { onConflict: "lead_id,tag_id" },
  )
  return !error
}

export async function removeTagFromLead(leadId: LeadTagId, tag: LeadTag) {
  const { error } = await createClient().from("lead_tag_assignments").delete().eq("lead_id", Number(leadId)).eq("tag_id", tag.id).eq("id_empresa", tag.id_empresa)
  return !error
}
