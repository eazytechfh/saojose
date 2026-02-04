import { createClient } from "@/utils/supabase/client"

export interface User {
  id: number
  id_empresa: number
  nome_empresa: string
  nome_usuario: string
  email: string
  telefone?: string
  plano: string
  status: "ativo" | "pendente" | "inativo"
  cargo: "administrador" | "convidado" | "sdr" | "gestor" | "vendedor"
  created_at: string
  updated_at: string
}

export const STATUS_LABELS = {
  ativo: "Ativo",
  pendente: "Pendente",
  inativo: "Inativo",
}

export const STATUS_COLORS = {
  ativo: "bg-green-100 text-green-800",
  pendente: "bg-yellow-100 text-yellow-800",
  inativo: "bg-red-100 text-red-800",
}

export const CARGO_LABELS = {
  administrador: "Administrador",
  convidado: "Convidado",
  sdr: "SDR",
  gestor: "Gestor",
  vendedor: "Vendedor",
}

export const CARGO_COLORS = {
  administrador: "bg-green-100 text-green-800",
  convidado: "bg-blue-100 text-blue-800",
  sdr: "bg-purple-100 text-purple-800",
  gestor: "bg-orange-100 text-orange-800",
  vendedor: "bg-cyan-100 text-cyan-800",
}

export async function signIn(email: string, senha: string): Promise<User | null> {
  const supabase = createClient()

  console.log("[v0] Attempting login with email:", email)

  const { data, error } = await supabase.from("AUTORIZAÇÃO").select("*").ilike("email", email).eq("senha", senha)

  console.log("[v0] Query result:", { data, error, dataLength: data?.length })

  if (error) {
    console.error("[v0] Login query error:", error)
    return null
  }

  if (!data || data.length === 0) {
    console.error("[v0] No user found with provided credentials")
    return null
  }

  if (data.length > 1) {
    console.error("[v0] Multiple users found - this should not happen")
    return null
  }

  const user = data[0] as User

  console.log("[v0] User status:", user.status, "Expected: ativo")
  if (user.status.toLowerCase() !== "ativo") {
    console.error("[v0] User is not active. Status:", user.status)
    return null
  }

  console.log("[v0] Login successful for user:", user.nome_usuario)

  localStorage.setItem("altuza_digital_user", JSON.stringify(user))

  return user
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userData = localStorage.getItem("altuza_digital_user")
  return userData ? JSON.parse(userData) : null
}

export function signOut() {
  localStorage.removeItem("altuza_digital_user")
}

export function isAdmin(user: User | null): boolean {
  return user?.cargo === "administrador"
}

export function canManageMembers(user: User | null): boolean {
  return isAdmin(user)
}

export async function updateUser(userId: number, userData: Partial<User>): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("AUTORIZAÇÃO")
    .update({
      nome_usuario: userData.nome_usuario,
      email: userData.email,
      telefone: userData.telefone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("Error updating user:", error)
    return false
  }

  const currentUser = getCurrentUser()
  if (currentUser) {
    const updatedUser = { ...currentUser, ...userData }
    localStorage.setItem("altuza_digital_user", JSON.stringify(updatedUser))
  }

  return true
}

export async function getCompanyMembers(idEmpresa: number): Promise<User[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("AUTORIZAÇÃO")
    .select("*")
    .eq("id_empresa", idEmpresa)
    .order("cargo", { ascending: false })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching company members:", error)
    return []
  }

  return data || []
}

export async function addCompanyMember(memberData: {
  id_empresa: number
  nome_empresa: string
  nome_usuario: string
  email: string
  senha: string
  telefone?: string
  status?: "ativo" | "pendente" | "inativo"
  cargo?: "administrador" | "convidado" | "sdr" | "gestor" | "vendedor"
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: existingUser } = await supabase
    .from("AUTORIZAÇÃO")
    .select("email")
    .eq("email", memberData.email)
    .single()

  if (existingUser) {
    return { success: false, error: "Este e-mail já está cadastrado no sistema." }
  }

  const { data, error } = await supabase
    .from("AUTORIZAÇÃO")
    .insert({
      id_empresa: memberData.id_empresa,
      nome_empresa: memberData.nome_empresa,
      nome: memberData.nome_usuario,
      nome_usuario: memberData.nome_usuario,
      email: memberData.email,
      senha: memberData.senha,
      telefone: memberData.telefone || null,
      plano: "gratuito",
      status: memberData.status || "ativo",
      cargo: memberData.cargo || "convidado",
    })
    .select()

  if (error) {
    console.error("Error adding company member:", error)
    return { success: false, error: "Erro ao adicionar membro. Tente novamente." }
  }

  return { success: true }
}

export async function updateMemberStatus(
  memberId: number,
  status: "ativo" | "pendente" | "inativo",
  currentUser: User,
): Promise<{ success: boolean; error?: string }> {
  if (!canManageMembers(currentUser)) {
    return { success: false, error: "Você não tem permissão para alterar status de membros." }
  }

  const supabase = createClient()

  const { error } = await supabase
    .from("AUTORIZAÇÃO")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("id_empresa", currentUser.id_empresa)

  if (error) {
    console.error("Error updating member status:", error)
    return { success: false, error: "Erro ao atualizar status do membro." }
  }

  return { success: true }
}

export async function updateMemberCargo(
  memberId: number,
  cargo: "administrador" | "convidado" | "sdr" | "gestor" | "vendedor",
  currentUser: User,
): Promise<{ success: boolean; error?: string }> {
  if (!canManageMembers(currentUser)) {
    return { success: false, error: "Você não tem permissão para alterar cargos." }
  }

  const supabase = createClient()

  const { error } = await supabase
    .from("AUTORIZAÇÃO")
    .update({
      cargo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("id_empresa", currentUser.id_empresa)

  if (error) {
    console.error("Error updating member cargo:", error)
    return { success: false, error: "Erro ao atualizar cargo do membro." }
  }

  return { success: true }
}

export async function deleteMember(memberId: number, currentUser: User): Promise<{ success: boolean; error?: string }> {
  if (!canManageMembers(currentUser)) {
    return { success: false, error: "Você não tem permissão para excluir membros." }
  }

  if (memberId === currentUser.id) {
    return { success: false, error: "Você não pode excluir sua própria conta." }
  }

  const supabase = createClient()

  const { error } = await supabase
    .from("AUTORIZAÇÃO")
    .delete()
    .eq("id", memberId)
    .eq("id_empresa", currentUser.id_empresa)

  if (error) {
    console.error("Error deleting member:", error)
    return { success: false, error: "Erro ao excluir membro." }
  }

  return { success: true }
}
