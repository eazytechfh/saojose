import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type SyncVendedorStatusPayload = {
  id_empresa?: number
  email?: string
  status?: "ativo" | "pendente" | "inativo"
}

async function updateByLowerId(
  supabase: ReturnType<typeof createClient>,
  id: number,
  status: "ativo" | "pendente" | "inativo",
) {
  const ativo = status !== "inativo"
  const atenderValue = status === "inativo" ? null : "espera"

  const attempts = [
    { ativo, atender: atenderValue, updated_at: new Date().toISOString() },
    { ATIVO: ativo, atender: atenderValue, UPDATED_AT: new Date().toISOString() },
  ]

  let lastError: any = null
  for (const payload of attempts) {
    const { error } = await supabase.from("VENDEDORES").update(payload).eq("id", id)
    if (!error) return { ok: true }
    lastError = error
  }

  return { ok: false, error: lastError?.message || "Falha ao atualizar vendedor por id." }
}

async function updateByUpperId(
  supabase: ReturnType<typeof createClient>,
  id: number,
  status: "ativo" | "pendente" | "inativo",
) {
  const ativo = status !== "inativo"
  const atenderValue = status === "inativo" ? null : "espera"

  const attempts = [
    { ATIVO: ativo, atender: atenderValue, UPDATED_AT: new Date().toISOString() },
    { ativo, atender: atenderValue, updated_at: new Date().toISOString() },
  ]

  let lastError: any = null
  for (const payload of attempts) {
    const { error } = await supabase.from("VENDEDORES").update(payload).eq("ID_VENDEDOR", id)
    if (!error) return { ok: true }
    lastError = error
  }

  return { ok: false, error: lastError?.message || "Falha ao atualizar vendedor por ID_VENDEDOR." }
}

export async function POST(request: Request) {
  try {
    const body: SyncVendedorStatusPayload = await request.json()
    const idEmpresa = Number(body.id_empresa)
    const email = String(body.email || "").trim()
    const status = body.status || "ativo"

    if (!Number.isFinite(idEmpresa) || idEmpresa <= 0) {
      return NextResponse.json({ error: "id_empresa inválido." }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: "email é obrigatório." }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseKey = serviceRoleKey || anonKey

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do Supabase incompleta no servidor." }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: lowerSeller, error: lowerSellerError } = await supabase
      .from("VENDEDORES")
      .select("id")
      .eq("id_empresa", idEmpresa)
      .eq("email", email)
      .maybeSingle()

    if (!lowerSellerError && lowerSeller?.id) {
      const result = await updateByLowerId(supabase, lowerSeller.id, status)
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    const { data: upperSeller, error: upperSellerError } = await supabase
      .from("VENDEDORES")
      .select("ID_VENDEDOR")
      .eq("ID_EMPRESA", idEmpresa)
      .eq("EMAIL", email)
      .maybeSingle()

    if (upperSellerError) {
      return NextResponse.json({ error: upperSellerError.message }, { status: 500 })
    }

    if (!upperSeller?.ID_VENDEDOR) {
      return NextResponse.json({ success: true })
    }

    const result = await updateByUpperId(supabase, upperSeller.ID_VENDEDOR, status)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error in sync-vendedor-status API:", error)
    return NextResponse.json({ error: "Erro inesperado ao sincronizar status do vendedor." }, { status: 500 })
  }
}
