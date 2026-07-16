import { createClient } from "@/utils/supabase/client"

export interface User {
  id: number
  id_empresa: number
  nome_empresa: string
  nome_usuario: string
  email: string
  telefone?: string
  senha?: string
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
  link_grupo?: string
  status?: "ativo" | "pendente" | "inativo"
  cargo?: "administrador" | "convidado" | "sdr" | "gestor" | "vendedor"
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Validar cargo antes de enviar para o banco
  const validCargos = ["administrador", "convidado", "sdr", "gestor", "vendedor"]
  if (memberData.cargo && !validCargos.includes(memberData.cargo)) {
    return { 
      success: false, 
      error: `Cargo inválido: ${memberData.cargo}. Valores válidos: ${validCargos.join(", ")}` 
    }
  }

  // Validar status antes de enviar para o banco
  const validStatus = ["ativo", "pendente", "inativo"]
  const statusToUse = memberData.status || "ativo"
  if (!validStatus.includes(statusToUse)) {
    return { 
      success: false, 
      error: `Status inválido: ${statusToUse}` 
    }
  }

  // Verificar se email já existe
  const { data: existingUser, error: checkError } = await supabase
    .from("AUTORIZAÇÃO")
    .select("email")
    .eq("email", memberData.email)
    .single()

  if (existingUser) {
    return { success: false, error: "Este e-mail já está cadastrado no sistema." }
  }

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = não encontrou nada (esperado)
    console.error("Error checking existing user:", checkError)
  }

  // Inserir novo membro
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
      status: statusToUse,
      cargo: memberData.cargo || "convidado",
    })
    .select()

  if (error) {
    console.error("Error adding company member:", error)
    
    // Retornar mensagens mais específicas baseadas no erro
    if (error.message && error.message.includes("constraint")) {
      if (error.message.includes("cargo")) {
        return { 
          success: false, 
          error: "Cargo selecionado não é válido. Por favor, contate o suporte." 
        }
      }
      if (error.message.includes("status")) {
        return { 
          success: false, 
          error: "Status selecionado não é válido." 
        }
      }
    }
    
    return { 
      success: false, 
      error: error.message || "Erro ao adicionar membro. Tente novamente." 
    }
  }

  const createdMember = Array.isArray(data) && data.length > 0 ? data[0] : null

  // Quando o membro é vendedor, também precisa existir em VENDEDORES e ATENDER.
  if ((memberData.cargo || "convidado") === "vendedor") {
    try {
      const syncResponse = await fetch("/api/members/sync-vendedor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_empresa: memberData.id_empresa,
          nome_usuario: createdMember?.nome_usuario || memberData.nome_usuario,
          email: createdMember?.email || memberData.email,
          telefone: createdMember?.telefone || memberData.telefone || null,
          link_grupo: memberData.link_grupo || "",
          cargo: memberData.cargo || "vendedor",
          status: "espera",
        }),
      })

      if (!syncResponse.ok) {
        const syncPayload = await syncResponse.json().catch(() => ({}))
        const syncError = syncPayload?.error || "Erro ao sincronizar vendedor nas tabelas auxiliares."
        const insertedMemberId = createdMember?.id || null
        if (insertedMemberId) {
          const { error: rollbackError } = await supabase
            .from("AUTORIZAÇÃO")
            .delete()
            .eq("id", insertedMemberId)
            .eq("id_empresa", memberData.id_empresa)
          if (rollbackError) {
            console.error("Error rolling back member after sync failure:", rollbackError)
          }
        }
        return { success: false, error: syncError }
      }
    } catch (syncError) {
      console.error("Error syncing vendedor tables:", syncError)
      const insertedMemberId = createdMember?.id || null
      if (insertedMemberId) {
        const { error: rollbackError } = await supabase
          .from("AUTORIZAÇÃO")
          .delete()
          .eq("id", insertedMemberId)
          .eq("id_empresa", memberData.id_empresa)
        if (rollbackError) {
          console.error("Error rolling back member after sync exception:", rollbackError)
        }
      }
      return { success: false, error: "Erro ao sincronizar vendedor nas tabelas auxiliares." }
    }
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

  const { data: memberData, error: memberError } = await supabase
    .from("AUTORIZAÇÃO")
    .select("id_empresa, email, cargo, nome_usuario, telefone")
    .eq("id", memberId)
    .eq("id_empresa", currentUser.id_empresa)
    .maybeSingle()

  if (memberError) {
    console.error("Error fetching member after status update:", memberError)
    return { success: false, error: "Status atualizado, mas falhou ao sincronizar vendedor." }
  }

  if (memberData?.cargo === "vendedor") {
    try {
      const syncResponse = await fetch("/api/members/sync-vendedor-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_empresa: memberData.id_empresa,
          email: memberData.email,
          nome_usuario: memberData.nome_usuario,
          telefone: memberData.telefone || null,
          status,
        }),
      })

      if (!syncResponse.ok) {
        const syncPayload = await syncResponse.json().catch(() => ({}))
        const syncError = syncPayload?.error || "Falha ao sincronizar status do vendedor."
        return { success: false, error: syncError }
      }
    } catch (syncError) {
      console.error("Error syncing vendedor status:", syncError)
      return { success: false, error: "Status atualizado, mas falhou ao sincronizar vendedor." }
    }
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

  if (cargo === "vendedor") {
    const { data: memberData, error: memberError } = await supabase
      .from("AUTORIZAÇÃO")
      .select("id_empresa, nome_usuario, email, telefone")
      .eq("id", memberId)
      .eq("id_empresa", currentUser.id_empresa)
      .maybeSingle()

    if (memberError || !memberData) {
      console.error("Error fetching member data for vendedor sync:", memberError)
      return { success: false, error: "Cargo atualizado, mas falhou ao sincronizar dados do vendedor." }
    }

    try {
      const syncResponse = await fetch("/api/members/sync-vendedor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_empresa: memberData.id_empresa,
          nome_usuario: memberData.nome_usuario,
          email: memberData.email,
          telefone: memberData.telefone || null,
          link_grupo: "",
          cargo: "vendedor",
          status: "espera",
        }),
      })

      if (!syncResponse.ok) {
        const syncPayload = await syncResponse.json().catch(() => ({}))
        const syncError = syncPayload?.error || "Falha ao sincronizar vendedor nas tabelas auxiliares."
        return { success: false, error: syncError }
      }
    } catch (syncError) {
      console.error("Error syncing vendedor after cargo update:", syncError)
      return { success: false, error: "Cargo atualizado, mas falhou ao sincronizar vendedor." }
    }
  }

  return { success: true }
}

export async function updateMemberInfo(
  memberId: number,
  memberData: { nome_usuario: string; email: string; telefone?: string; senha?: string },
  currentUser: User,
): Promise<{ success: boolean; error?: string }> {
  if (!canManageMembers(currentUser)) {
    return { success: false, error: "Você não tem permissão para editar membros." }
  }

  const supabase = createClient()

  const updatePayload: Record<string, unknown> = {
    nome_usuario: memberData.nome_usuario,
    email: memberData.email,
    telefone: memberData.telefone || null,
    updated_at: new Date().toISOString(),
  }

  if (memberData.senha && memberData.senha.trim().length > 0) {
    updatePayload.senha = memberData.senha
  }

  const { error } = await supabase
    .from("AUTORIZAÇÃO")
    .update(updatePayload)
    .eq("id", memberId)
    .eq("id_empresa", currentUser.id_empresa)

  if (error) {
    console.error("Error updating member info:", error)
    if (error.message && error.message.toLowerCase().includes("email")) {
      return { success: false, error: "Este e-mail já está em uso por outro membro." }
    }
    return { success: false, error: "Erro ao atualizar dados do membro." }
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
