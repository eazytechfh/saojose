import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type RequestBody = {
  leadId?: string | number
  value?: string | null
}

function isValidYmdDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [yearText, monthText, dayText] = value.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  const utcDate = new Date(Date.UTC(year, month - 1, day))
  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  )
}

function normalizeLeadIdForQuery(leadId: string | number): string | number {
  if (typeof leadId === "number") return leadId

  const trimmed = String(leadId).trim()
  if (/^\d+$/.test(trimmed)) {
    const parsed = Number.parseInt(trimmed, 10)
    if (!Number.isNaN(parsed)) return parsed
  }

  return trimmed
}

export async function POST(request: Request) {
  try {
    const { leadId, value }: RequestBody = await request.json()

    if (leadId === undefined || leadId === null || String(leadId).trim() === "") {
      return NextResponse.json({ error: "leadId é obrigatório." }, { status: 400 })
    }

    const normalizedValue = typeof value === "string" ? value.trim() : ""
    if (normalizedValue && !isValidYmdDate(normalizedValue)) {
      return NextResponse.json({ error: "Data inválida. Use YYYY-MM-DD." }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Configuração do Supabase incompleta no servidor." }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const leadIdForQuery = normalizeLeadIdForQuery(leadId)

    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        data_nascimento: normalizedValue || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdForQuery)

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error in update-data-nascimento API:", error)
    return NextResponse.json({ error: "Erro inesperado ao atualizar data de nascimento." }, { status: 500 })
  }
}
