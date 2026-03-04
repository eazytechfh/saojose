import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type SyncVendedorStatusPayload = {
  id_empresa?: number
  email?: string
  nome_usuario?: string
  telefone?: string | null
  status?: "ativo" | "pendente" | "inativo"
}

type Filter = {
  column: string
  op: "eq" | "ilike"
  value: string | number | boolean
}

function buildStatusPayloads(status: "ativo" | "pendente" | "inativo") {
  const ativo = status !== "inativo"
  const atender = status === "inativo" ? null : "espera"
  const now = new Date().toISOString()

  return [
    { ativo, atender, updated_at: now },
    { ATIVO: ativo, atender, UPDATED_AT: now },
  ]
}

async function tryUpdateWithFilters(
  supabase: ReturnType<typeof createClient>,
  payloads: Array<Record<string, any>>,
  filtersList: Filter[][],
): Promise<{ ok: boolean; error?: string }> {
  let lastError: any = null

  for (const filters of filtersList) {
    for (const payload of payloads) {
      let query: any = supabase.from("VENDEDORES").update(payload)
      for (const filter of filters) {
        query = filter.op === "ilike" ? query.ilike(filter.column, String(filter.value)) : query.eq(filter.column, filter.value)
      }

      const { data, error } = await query.select("*").limit(1)
      if (!error && Array.isArray(data) && data.length > 0) {
        return { ok: true }
      }
      if (error) {
        lastError = error
      }
    }
  }

  return { ok: false, error: lastError?.message || "Não foi possível localizar vendedor para atualizar status." }
}

export async function POST(request: Request) {
  try {
    const body: SyncVendedorStatusPayload = await request.json()
    const idEmpresa = Number(body.id_empresa)
    const email = String(body.email || "").trim()
    const nomeUsuario = String(body.nome_usuario || "").trim()
    const telefone = String(body.telefone || "").trim()
    const status = body.status || "ativo"

    if (!Number.isFinite(idEmpresa) || idEmpresa <= 0) {
      return NextResponse.json({ error: "id_empresa inválido." }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseKey = serviceRoleKey || anonKey

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do Supabase incompleta no servidor." }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const payloads = buildStatusPayloads(status)

    const filtersList: Filter[][] = []

    if (email) {
      filtersList.push(
        [
          { column: "id_empresa", op: "eq", value: idEmpresa },
          { column: "email", op: "ilike", value: email },
        ],
        [
          { column: "ID_EMPRESA", op: "eq", value: idEmpresa },
          { column: "EMAIL", op: "ilike", value: email },
        ],
      )
    }

    if (nomeUsuario) {
      filtersList.push(
        [
          { column: "id_empresa", op: "eq", value: idEmpresa },
          { column: "nome", op: "ilike", value: nomeUsuario },
        ],
        [
          { column: "ID_EMPRESA", op: "eq", value: idEmpresa },
          { column: "NOME", op: "ilike", value: nomeUsuario },
        ],
      )
    }

    if (telefone) {
      filtersList.push(
        [
          { column: "id_empresa", op: "eq", value: idEmpresa },
          { column: "telefone", op: "eq", value: telefone },
        ],
        [
          { column: "ID_EMPRESA", op: "eq", value: idEmpresa },
          { column: "TELEFONE", op: "eq", value: telefone },
        ],
      )
    }

    if (filtersList.length === 0) {
      return NextResponse.json({ error: "Dados insuficientes para localizar vendedor." }, { status: 400 })
    }

    const result = await tryUpdateWithFilters(supabase, payloads, filtersList)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error in sync-vendedor-status API:", error)
    return NextResponse.json({ error: "Erro inesperado ao sincronizar status do vendedor." }, { status: 500 })
  }
}
