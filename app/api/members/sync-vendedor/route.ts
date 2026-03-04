import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type SyncVendedorPayload = {
  id_empresa?: number
  nome_usuario?: string
  email?: string
  telefone?: string | null
  link_grupo?: string | null
  cargo?: string
  status?: string
}

async function tryInsertAtender(
  supabase: ReturnType<typeof createClient>,
  payload: Required<Pick<SyncVendedorPayload, "id_empresa" | "nome_usuario" | "email">> &
    Pick<SyncVendedorPayload, "telefone" | "cargo" | "status">,
): Promise<{ ok: boolean; error?: string }> {
  const attempts = [
    {
      id_empresa: payload.id_empresa,
      nome_usuario: payload.nome_usuario,
      email: payload.email,
      telefone: payload.telefone || null,
      cargo: payload.cargo || "vendedor",
      status: payload.status || "espera",
    },
    {
      id_empresa: payload.id_empresa,
      nome: payload.nome_usuario,
      email: payload.email,
      telefone: payload.telefone || null,
      cargo: payload.cargo || "vendedor",
      status: payload.status || "espera",
    },
    {
      ID_EMPRESA: payload.id_empresa,
      NOME: payload.nome_usuario,
      EMAIL: payload.email,
      TELEFONE: payload.telefone || null,
      CARGO: payload.cargo || "vendedor",
      STATUS: payload.status || "espera",
    },
    {
      id_empresa: payload.id_empresa,
      email: payload.email,
      status: payload.status || "espera",
    },
    {
      ID_EMPRESA: payload.id_empresa,
      EMAIL: payload.email,
      STATUS: payload.status || "espera",
    },
  ]

  let lastError: any = null
  for (const attempt of attempts) {
    const { error } = await supabase.from("ATENDER").insert(attempt)
    if (!error) {
      return { ok: true }
    }
    lastError = error
  }

  // Se a tabela ATENDER não existir neste ambiente, não bloqueia o fluxo:
  // o status já é persistido em VENDEDORES.atender.
  if (lastError?.code === "PGRST205" || lastError?.code === "42P01") {
    return { ok: true }
  }

  return { ok: false, error: lastError?.message || "Falha ao inserir na tabela ATENDER." }
}

async function tryUpdateVendedoresById(
  supabase: ReturnType<typeof createClient>,
  id: number,
  payloads: Array<Record<string, any>>,
): Promise<{ ok: boolean; error?: string }> {
  let lastError: any = null
  for (const payload of payloads) {
    const { error } = await supabase.from("VENDEDORES").update(payload).eq("id", id)
    if (!error) return { ok: true }
    lastError = error
  }
  return { ok: false, error: lastError?.message || "Falha ao atualizar VENDEDORES." }
}

async function tryInsertVendedores(
  supabase: ReturnType<typeof createClient>,
  payloads: Array<Record<string, any>>,
): Promise<{ ok: boolean; error?: string }> {
  let lastError: any = null
  for (const payload of payloads) {
    const { error } = await supabase.from("VENDEDORES").insert(payload)
    if (!error) return { ok: true }
    lastError = error
  }
  return { ok: false, error: lastError?.message || "Falha ao inserir em VENDEDORES." }
}

async function tryUpdateVendedoresByUpperId(
  supabase: ReturnType<typeof createClient>,
  id: number,
  payloads: Array<Record<string, any>>,
): Promise<{ ok: boolean; error?: string }> {
  let lastError: any = null
  for (const payload of payloads) {
    const { error } = await supabase.from("VENDEDORES").update(payload).eq("ID_VENDEDOR", id)
    if (!error) return { ok: true }
    lastError = error
  }
  return { ok: false, error: lastError?.message || "Falha ao atualizar VENDEDORES." }
}

export async function POST(request: Request) {
  try {
    const body: SyncVendedorPayload = await request.json()

    const idEmpresa = Number(body.id_empresa)
    const nomeUsuario = String(body.nome_usuario || "").trim()
    const email = String(body.email || "").trim()
    const telefone = body.telefone || null
    const linkGrupo = String(body.link_grupo || "").trim()
    const cargo = String(body.cargo || "vendedor").trim() || "vendedor"
    const status = String(body.status || "espera").trim() || "espera"

    if (!Number.isFinite(idEmpresa) || idEmpresa <= 0) {
      return NextResponse.json({ error: "id_empresa inválido." }, { status: 400 })
    }
    if (!nomeUsuario) {
      return NextResponse.json({ error: "nome_usuario é obrigatório." }, { status: 400 })
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

    // VENDEDORES: tentativa padrão (colunas minúsculas)
    const { data: existingLower, error: existingLowerError } = await supabase
      .from("VENDEDORES")
      .select("id")
      .eq("id_empresa", idEmpresa)
      .eq("email", email)
      .maybeSingle()

    if (!existingLowerError) {
      if (existingLower?.id) {
        const updateLower = await tryUpdateVendedoresById(supabase, existingLower.id, [
          {
            nome: nomeUsuario,
            telefone: telefone,
            cargo: cargo,
            atender: status,
            link_grupo: linkGrupo || null,
            quanto_lead: 0,
            ativo: true,
            updated_at: new Date().toISOString(),
          },
          {
            nome: nomeUsuario,
            telefone: telefone,
            cargo: cargo,
            atender: status,
            "link grupo": linkGrupo || null,
            "quanto lead": 0,
            ativo: true,
            updated_at: new Date().toISOString(),
          },
        ])

        if (!updateLower.ok) {
          return NextResponse.json({ error: updateLower.error }, { status: 500 })
        }
      } else {
        const insertLower = await tryInsertVendedores(supabase, [
          {
            nome: nomeUsuario,
            telefone: telefone,
            email: email,
            cargo: cargo,
            atender: status,
            link_grupo: linkGrupo || null,
            quanto_lead: 0,
            id_empresa: idEmpresa,
            ativo: true,
          },
          {
            nome: nomeUsuario,
            telefone: telefone,
            email: email,
            cargo: cargo,
            atender: status,
            "link grupo": linkGrupo || null,
            "quanto lead": 0,
            id_empresa: idEmpresa,
            ativo: true,
          },
        ])

        if (!insertLower.ok) {
          return NextResponse.json({ error: insertLower.error }, { status: 500 })
        }
      }
    } else {
      // Fallback para schema com colunas em maiúsculo
      const { data: existingUpper, error: existingUpperError } = await supabase
        .from("VENDEDORES")
        .select("ID_VENDEDOR")
        .eq("ID_EMPRESA", idEmpresa)
        .eq("EMAIL", email)
        .maybeSingle()

      if (existingUpperError) {
        return NextResponse.json({ error: existingUpperError.message }, { status: 500 })
      }

      if (existingUpper?.ID_VENDEDOR) {
        const updateUpper = await tryUpdateVendedoresByUpperId(supabase, existingUpper.ID_VENDEDOR, [
          {
            NOME: nomeUsuario,
            TELEFONE: telefone,
            CARGO: cargo,
            atender: status,
            link_grupo: linkGrupo || null,
            quanto_lead: 0,
            ATIVO: true,
            UPDATED_AT: new Date().toISOString(),
          },
          {
            NOME: nomeUsuario,
            TELEFONE: telefone,
            CARGO: cargo,
            atender: status,
            "link grupo": linkGrupo || null,
            "quanto lead": 0,
            ATIVO: true,
            UPDATED_AT: new Date().toISOString(),
          },
        ])

        if (!updateUpper.ok) {
          return NextResponse.json({ error: updateUpper.error }, { status: 500 })
        }
      } else {
        const insertUpper = await tryInsertVendedores(supabase, [
          {
            NOME: nomeUsuario,
            TELEFONE: telefone,
            EMAIL: email,
            CARGO: cargo,
            atender: status,
            link_grupo: linkGrupo || null,
            quanto_lead: 0,
            ID_EMPRESA: idEmpresa,
            ATIVO: true,
          },
          {
            NOME: nomeUsuario,
            TELEFONE: telefone,
            EMAIL: email,
            CARGO: cargo,
            atender: status,
            "link grupo": linkGrupo || null,
            "quanto lead": 0,
            ID_EMPRESA: idEmpresa,
            ATIVO: true,
          },
        ])

        if (!insertUpper.ok) {
          return NextResponse.json({ error: insertUpper.error }, { status: 500 })
        }
      }
    }

    const atenderResult = await tryInsertAtender(supabase, {
      id_empresa: idEmpresa,
      nome_usuario: nomeUsuario,
      email,
      telefone,
      cargo,
      status,
    })

    if (!atenderResult.ok) {
      return NextResponse.json({ error: atenderResult.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error in sync-vendedor API:", error)
    return NextResponse.json({ error: "Erro inesperado ao sincronizar vendedor." }, { status: 500 })
  }
}
