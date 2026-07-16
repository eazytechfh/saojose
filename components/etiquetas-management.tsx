"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createLeadTag, deleteLeadTag, getLeadTagDisplayStyle, getLeadTags, LEAD_TAG_COLOR_OPTIONS, updateLeadTag, type LeadTag, type LeadTagColor } from "@/lib/lead-tags"

export function EtiquetasManagement({ idEmpresa, canManage }: { idEmpresa: number; canManage: boolean }) {
  const [tags, setTags] = useState<LeadTag[]>([])
  const [name, setName] = useState("")
  const [color, setColor] = useState<LeadTagColor>("verde")
  const [editing, setEditing] = useState<LeadTag | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    try { setTags(await getLeadTags(idEmpresa)); setError("") } catch { setError("Não foi possível carregar as etiquetas. Aplique a migration no Supabase.") }
    setLoading(false)
  }
  useEffect(() => { void load() }, [idEmpresa])

  async function save() {
    setLoading(true)
    const success = editing
      ? await updateLeadTag(editing.id, idEmpresa, name, color)
      : !!(await createLeadTag(idEmpresa, name, color))
    if (success) { setName(""); setColor("verde"); setEditing(null); await load() }
    else { setError("Não foi possível salvar. Verifique se o nome já existe.") }
    setLoading(false)
  }

  async function remove(tag: LeadTag) {
    if (!window.confirm(`Excluir a etiqueta “${tag.nome}” de todos os leads?`)) return
    setLoading(true)
    if (await deleteLeadTag(tag.id, idEmpresa)) await load()
    else setError("Não foi possível excluir a etiqueta.")
    setLoading(false)
  }

  return <div className="space-y-4">
    {canManage ? <>
      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da etiqueta" maxLength={120} />
        <Select value={color} onValueChange={(value) => setColor(value as LeadTagColor)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEAD_TAG_COLOR_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
        <Button onClick={() => void save()} disabled={loading || !name.trim()}>{editing ? "Salvar" : "Criar etiqueta"}</Button>
      </div>
      {editing && <Button variant="outline" size="sm" onClick={() => { setEditing(null); setName(""); setColor("verde") }}>Cancelar edição</Button>}
    </> : <p className="text-sm text-muted-foreground">Apenas administradores podem alterar etiquetas.</p>}
    {error && <p className="text-sm text-red-500">{error}</p>}
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    <div className="h-72 space-y-2 overflow-y-auto pr-1">{tags.map((tag) => <div key={tag.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><Badge style={getLeadTagDisplayStyle(tag.cor)}>{tag.nome}</Badge>{canManage && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(tag); setName(tag.nome); setColor(tag.cor) }}><Pencil className="mr-2 h-4 w-4" />Editar</Button><Button size="sm" variant="destructive" onClick={() => void remove(tag)}><Trash2 className="mr-2 h-4 w-4" />Excluir</Button></div>}</div>)}</div>
  </div>
}
