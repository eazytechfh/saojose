"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Tags, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { assignTagToLead, createLeadTag, getLeadTagDisplayStyle, getLeadTags, LEAD_TAG_COLOR_OPTIONS, removeTagFromLead, type LeadTag, type LeadTagColor, type LeadTagId } from "@/lib/lead-tags"

export function LeadTagsManager({ leadId, empresaId, selectedTags, onTagsChange }: { leadId: LeadTagId; empresaId: number; selectedTags: LeadTag[]; onTagsChange: (tags: LeadTag[]) => void }) {
  const [tags, setTags] = useState<LeadTag[]>([])
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [color, setColor] = useState<LeadTagColor>("verde")
  const [loading, setLoading] = useState(false)

  const load = async () => setTags(await getLeadTags(empresaId))
  useEffect(() => { void load() }, [empresaId])
  const filtered = useMemo(() => tags.filter((tag) => tag.nome.toLowerCase().includes(search.trim().toLowerCase())), [tags, search])

  async function toggle(tag: LeadTag) {
    setLoading(true)
    const selected = selectedTags.some((item) => item.id === tag.id)
    const success = selected ? await removeTagFromLead(leadId, tag) : await assignTagToLead(leadId, tag)
    if (success) onTagsChange((selected ? selectedTags.filter((item) => item.id !== tag.id) : [...selectedTags, tag]).sort((a, b) => a.nome.localeCompare(b.nome)))
    setLoading(false)
  }

  async function create() {
    setLoading(true)
    const tag = await createLeadTag(empresaId, name, color)
    if (tag) {
      await assignTagToLead(leadId, tag)
      onTagsChange([...selectedTags, tag].sort((a, b) => a.nome.localeCompare(b.nome)))
      setName("")
      setColor("verde")
      await load()
    }
    setLoading(false)
  }

  return <div className="space-y-3 rounded-lg border border-green-500 bg-black p-4">
    <div className="flex items-center gap-2 font-semibold text-green-500"><Tags className="h-4 w-4" /> Etiquetas</div>
    <div className="grid gap-2 md:grid-cols-[1fr_160px_auto]">
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nova etiqueta" />
      <Select value={color} onValueChange={(value) => setColor(value as LeadTagColor)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEAD_TAG_COLOR_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
      <Button onClick={() => void create()} disabled={loading || !name.trim()}><Plus className="mr-2 h-4 w-4" />Criar</Button>
    </div>
    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar etiquetas" />
    <div className="flex flex-wrap gap-2">
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {filtered.map((tag) => {
        const selected = selectedTags.some((item) => item.id === tag.id)
        return <button key={tag.id} type="button" onClick={() => void toggle(tag)} className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={selected ? getLeadTagDisplayStyle(tag.cor) : undefined}>{tag.nome}{selected && <X className="ml-1 inline h-3 w-3" />}</button>
      })}
    </div>
    <div className="flex flex-wrap gap-2">{selectedTags.map((tag) => <Badge key={tag.id} style={getLeadTagDisplayStyle(tag.cor)}>{tag.nome}</Badge>)}</div>
  </div>
}
