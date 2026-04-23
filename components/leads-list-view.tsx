"use client"

import React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  type Lead,
  type LeadId,
  ESTAGIO_LABELS,
  ESTAGIO_COLORS,
  updateLeadStage,
  generateResumoComercial,
  sendFollowUpWebhook,
  sendMensagemWebhook,
  deleteLead,
} from "@/lib/leads"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Filter,
  Phone,
  User,
  Calendar,
  MapPin,
  Car,
  Eye,
  DollarSign,
  FileText,
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronDown,
  Trash2,
  Send,
  MessageSquare,
} from "lucide-react"
import { EditableValueField } from "./editable-value-field"
import { EditableObservacaoField } from "./editable-observacao-field"
import { EditableVeiculoField } from "./editable-veiculo-field"
import { EditableCpfField } from "./editable-cpf-field"
import { EditableDataNascimentoField, normalizeDateForInput } from "./editable-data-nascimento-field"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

interface LeadsListViewProps {
  leads: Lead[]
  onLeadsUpdate: () => void
  totalLeadsCount: number
}

function formatDateSafe(value?: string): string {
  if (!value) return "-"
  const trimmed = value.trim()
  const isDateOnlyValue = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) || /^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)
  const normalized = isDateOnlyValue ? normalizeDateForInput(trimmed) : ""

  if (normalized) {
    const [year, month, day] = normalized.split("-")
    return `${day}/${month}/${year}`
  }

  const fallbackDate = new Date(trimmed)
  if (Number.isNaN(fallbackDate.getTime())) return "-"
  return fallbackDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
}

function formatLeadTimestamp(value?: string): string {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function LeadsListView({ leads, onLeadsUpdate, totalLeadsCount }: LeadsListViewProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOrigem, setFilterOrigem] = useState("")
  const [filterEstagio, setFilterEstagio] = useState("")
  const [updatingStage, setUpdatingStage] = useState<LeadId | null>(null)
  const [generatingResumo, setGeneratingResumo] = useState(false)
  const [resumoMessage, setResumoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [selectedLeadIds, setSelectedLeadIds] = useState<LeadId[]>([])
  const [processingAction, setProcessingAction] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const LEADS_PER_PAGE = 100

  React.useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(leads.length / LEADS_PER_PAGE))
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, leads])

  React.useEffect(() => {
    setSelectedLeadIds((prev) => prev.filter((id) => leads.some((lead) => String(lead.id) === String(id))))
  }, [leads])

  const totalPages = Math.max(1, Math.ceil(leads.length / LEADS_PER_PAGE))
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE
  const endIndex = startIndex + LEADS_PER_PAGE
  const paginatedLeads = leads.slice(startIndex, endIndex)

  const handleStageChange = async (leadId: LeadId, newStage: string, currentStage: string) => {
    if (newStage === currentStage) return
    if (newStage === "oportunidade" && currentStage !== "oportunidade") {
      setResumoMessage({
        type: "error",
        text: "NÃ£o Ã© permitido mover leads de volta para Oportunidade.",
      })
      setTimeout(() => setResumoMessage(null), 3000)
      return
    }

    setUpdatingStage(leadId)

    try {
      const success = await updateLeadStage(leadId, newStage)

      if (success) {
        // Atualizar o lead selecionado se for o mesmo
        if (selectedLead && String(selectedLead.id) === String(leadId)) {
          setSelectedLead({ ...selectedLead, estagio_lead: newStage })
        }

        // Chamar callback para atualizar dados principais
        onLeadsUpdate()
      } else {
        setResumoMessage({
          type: "error",
          text: "Erro ao atualizar estágio do lead. Tente novamente.",
        })
        setTimeout(() => setResumoMessage(null), 3000)
      }
    } catch (error) {
      setResumoMessage({
        type: "error",
        text: "Erro de conexão. Verifique sua internet e tente novamente.",
      })
      setTimeout(() => setResumoMessage(null), 3000)
    } finally {
      setUpdatingStage(null)
    }
  }

  const handleValueUpdate = (leadId: LeadId, newValue: number) => {
    // Atualizar o lead selecionado se for o mesmo
    if (selectedLead && String(selectedLead.id) === String(leadId)) {
      setSelectedLead({ ...selectedLead, valor: newValue })
    }

    // Chamar callback para atualizar dados principais
    onLeadsUpdate()
  }

  const handleObservacaoUpdate = (leadId: LeadId, newObservacao: string) => {
    // Atualizar o lead selecionado se for o mesmo
    if (selectedLead && String(selectedLead.id) === String(leadId)) {
      setSelectedLead({ ...selectedLead, observacao_vendedor: newObservacao })
    }

    // Chamar callback para atualizar dados principais
    onLeadsUpdate()
  }

  const handleVeiculoUpdate = (leadId: LeadId, newVeiculo: string) => {
    // Atualizar o lead selecionado se for o mesmo
    if (selectedLead && String(selectedLead.id) === String(leadId)) {
      setSelectedLead({ ...selectedLead, veiculo_interesse: newVeiculo })
    }

    // Chamar callback para atualizar dados principais
    onLeadsUpdate()
  }

  const handleCpfUpdate = (leadId: LeadId, newCpf: string) => {
    // Atualizar o lead selecionado se for o mesmo
    if (selectedLead && String(selectedLead.id) === String(leadId)) {
      setSelectedLead({ ...selectedLead, cpf: newCpf })
    }

    // Chamar callback para atualizar dados principais
    onLeadsUpdate()
  }

  const handleDataNascimentoUpdate = (leadId: LeadId, newValue: string) => {
    if (selectedLead && String(selectedLead.id) === String(leadId)) {
      setSelectedLead({ ...selectedLead, data_nascimento: newValue })
    }

    onLeadsUpdate()
  }

  const handleGenerateResumo = async () => {
    if (!selectedLead) return

    setGeneratingResumo(true)
    setResumoMessage(null)
    setShowProgressDialog(true)
    setProgressValue(0)

    // Animar progresso de 0 a 100 em 30 segundos
    const duration = 30000 // 30 segundos
    const intervalTime = 100 // Atualiza a cada 100ms
    const increment = (100 / duration) * intervalTime

    const progressInterval = setInterval(() => {
      setProgressValue((prev) => {
        const next = prev + increment
        if (next >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return next
      })
    }, intervalTime)

    try {
      const success = await generateResumoComercial(selectedLead)

      // Aguardar os 30 segundos completos
      await new Promise((resolve) => setTimeout(resolve, duration))

      if (success) {
        setResumoMessage({
          type: "success",
          text: "Resumo comercial gerado com sucesso!",
        })
      } else {
        setResumoMessage({
          type: "error",
          text: "Erro ao gerar resumo comercial. Tente novamente.",
        })
      }
    } catch (error) {
      setResumoMessage({
        type: "error",
        text: "Erro ao processar solicitação. Verifique sua conexão.",
      })
    } finally {
      setGeneratingResumo(false)
      setShowProgressDialog(false)
      setProgressValue(0)

      // Limpar mensagem após 5 segundos
      setTimeout(() => {
        setResumoMessage(null)
      }, 5000)
    }
  }

  // Funções de seleção
  const toggleSelectLead = (leadId: LeadId) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    )
  }

  const toggleSelectAll = () => {
    const pageLeadIds = paginatedLeads.map((lead) => lead.id)
    const allPageSelected = pageLeadIds.every((leadId) =>
      selectedLeadIds.some((selectedId) => String(selectedId) === String(leadId)),
    )

    if (allPageSelected) {
      setSelectedLeadIds((prev) => prev.filter((id) => !pageLeadIds.some((leadId) => String(leadId) === String(id))))
    } else {
      setSelectedLeadIds((prev) => {
        const next = [...prev]
        pageLeadIds.forEach((leadId) => {
          if (!next.some((id) => String(id) === String(leadId))) {
            next.push(leadId)
          }
        })
        return next
      })
    }
  }

  const getSelectedLeads = () => {
    return leads.filter((lead) => selectedLeadIds.some((id) => String(id) === String(lead.id)))
  }

  // Ações em massa
  const handleDeleteSelected = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedLeadIds.length} lead(s)?`)) return

    setProcessingAction(true)
    try {
      for (const leadId of selectedLeadIds) {
        await deleteLead(leadId)
      }
      setSelectedLeadIds([])
      onLeadsUpdate()
      setResumoMessage({
        type: "success",
        text: `${selectedLeadIds.length} lead(s) excluído(s) com sucesso!`,
      })
    } catch (error) {
      setResumoMessage({
        type: "error",
        text: "Erro ao excluir leads. Tente novamente.",
      })
    } finally {
      setProcessingAction(false)
      setTimeout(() => setResumoMessage(null), 5000)
    }
  }

  const handleSendFollowUp = async () => {
    const selectedLeads = getSelectedLeads()
    if (selectedLeads.length === 0) return

    setProcessingAction(true)
    try {
      let successCount = 0
      for (const lead of selectedLeads) {
        const success = await sendFollowUpWebhook(lead)
        if (success) successCount++
      }
      setResumoMessage({
        type: "success",
        text: `Follow up enviado para ${successCount} de ${selectedLeads.length} lead(s)!`,
      })
      setSelectedLeadIds([])
    } catch (error) {
      setResumoMessage({
        type: "error",
        text: "Erro ao enviar follow up. Tente novamente.",
      })
    } finally {
      setProcessingAction(false)
      setTimeout(() => setResumoMessage(null), 5000)
    }
  }

  const handleOpenMessageModal = () => {
    setMessageText("")
    setShowMessageModal(true)
  }

  const handleSendMensagem = async () => {
    const selectedLeads = getSelectedLeads()
    if (selectedLeads.length === 0 || !messageText.trim()) return

    setShowMessageModal(false)
    setProcessingAction(true)
    try {
      let successCount = 0
      for (const lead of selectedLeads) {
        const success = await sendMensagemWebhook(lead, messageText)
        if (success) successCount++
      }
      setResumoMessage({
        type: "success",
        text: `Mensagem enviada para ${successCount} de ${selectedLeads.length} lead(s)!`,
      })
      setSelectedLeadIds([])
      setMessageText("")
    } catch (error) {
      setResumoMessage({
        type: "error",
        text: "Erro ao enviar mensagem. Tente novamente.",
      })
    } finally {
      setProcessingAction(false)
      setTimeout(() => setResumoMessage(null), 5000)
    }
  }

  const pageStart = leads.length === 0 ? 0 : startIndex + 1
  const pageEnd = Math.min(endIndex, leads.length)
  const allPageSelected =
    paginatedLeads.length > 0 &&
    paginatedLeads.every((lead) => selectedLeadIds.some((id) => String(id) === String(lead.id)))
  const origens = [...new Set(leads.map((lead) => lead.origem).filter(Boolean))]

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, telefone ou vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterOrigem} onValueChange={setFilterOrigem}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                {origens.map((origem) => (
                  <SelectItem key={origem} value={origem!}>
                    {origem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstagio} onValueChange={setFilterEstagio}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estágio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estágios</SelectItem>
                {Object.entries(ESTAGIO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Barra de Seleção */}
      {selectedLeadIds.length > 0 && (
        <Card className="bg-slate-100 border-slate-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {selectedLeadIds.length} lead(s) selecionado(s)
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Ações
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={handleDeleteSelected}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleSendFollowUp}
                    className="cursor-pointer"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Follow Up
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleOpenMessageModal}
                    className="cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Enviar Mensagem
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem de Status */}
      {resumoMessage && (
        <Alert
          className={`${resumoMessage.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          <AlertDescription className={resumoMessage.type === "success" ? "text-green-700" : "text-red-700"}>
            {resumoMessage.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Instruções */}
      <Card className="bg-white border-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-black">
                💡 <strong>Como usar:</strong> Clique no dropdown de estágio para alterar o status do lead
              </p>
              <p className="text-xs text-gray-700 mt-1">As alterações são salvas automaticamente no banco de dados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Leads ({leads.length}
            {totalLeadsCount > 0 ? ` de ${totalLeadsCount}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-400">
              Exibindo {pageStart}-{pageEnd} de {leads.length} leads filtrados
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">Origem</TableHead>
                  <TableHead className="hidden lg:table-cell">Vendedor</TableHead>
                  <TableHead className="hidden xl:table-cell">Veículo</TableHead>
                  <TableHead>Estágio</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className={`hover:bg-gray-50 ${selectedLeadIds.some((id) => String(id) === String(lead.id)) ? "bg-purple-50" : ""}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedLeadIds.some((id) => String(id) === String(lead.id))}
                        onCheckedChange={() => toggleSelectLead(lead.id)}
                        aria-label={`Selecionar ${lead.nome}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{lead.nome}</div>
                        <div className="text-sm text-gray-500 md:hidden">
                          {lead.telefone && (
                            <span className="flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {lead.telefone}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div onClick={(e) => e.stopPropagation()}>
                        <EditableValueField
                          leadId={lead.id}
                          currentValue={lead.valor || 0}
                          onValueUpdate={(newValue) => handleValueUpdate(lead.id, newValue)}
                          className="min-w-[120px]"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{lead.telefone}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {lead.origem && (
                        <Badge variant="outline" className="text-xs">
                          {lead.origem}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.vendedor}</TableCell>
                    <TableCell className="hidden xl:table-cell">{lead.veiculo_interesse}</TableCell>
                    <TableCell>
                      <Select
                        value={lead.estagio_lead}
                        onValueChange={(value) => handleStageChange(lead.id, value, lead.estagio_lead)}
                        disabled={String(updatingStage) === String(lead.id)}
                      >
                        <SelectTrigger className="w-auto min-w-[140px]">
                          <div className="flex items-center gap-2">
                            {String(updatingStage) === String(lead.id) && <Loader2 className="h-3 w-3 animate-spin" />}
                            <Badge className={ESTAGIO_COLORS[lead.estagio_lead as keyof typeof ESTAGIO_COLORS]}>
                              {ESTAGIO_LABELS[lead.estagio_lead as keyof typeof ESTAGIO_LABELS]}
                            </Badge>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ESTAGIO_LABELS).map(([key, label]) => (
                            <SelectItem
                              key={key}
                              value={key}
                              disabled={key === "oportunidade" && lead.estagio_lead !== "oportunidade"}
                            >
                              <div className="flex items-center gap-2">
                                <Badge className={`${ESTAGIO_COLORS[key as keyof typeof ESTAGIO_COLORS]} text-xs`}>
                                  {label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatLeadTimestamp(lead.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLead(lead)} className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {leads.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum lead encontrado com os filtros aplicados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Lead - Com Campos Editáveis */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] w-[95vw] overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="h-6 w-6" />
              Detalhes do Lead
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="flex flex-col h-full max-h-[80vh]">
              {/* Header Info - Fixed */}
              <div className="flex-shrink-0 space-y-4 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-2xl">{selectedLead.nome}</h3>
                    <Badge
                      className={`mt-2 ${ESTAGIO_COLORS[selectedLead.estagio_lead as keyof typeof ESTAGIO_COLORS]}`}
                    >
                      {ESTAGIO_LABELS[selectedLead.estagio_lead as keyof typeof ESTAGIO_LABELS]}
                    </Badge>
                  </div>
                </div>

                {/* Informações Básicas em Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedLead.telefone && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{selectedLead.telefone}</span>
                    </div>
                  )}

                  {selectedLead.cpf && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium truncate">{selectedLead.cpf}</span>
                    </div>
                  )}

                  {normalizeDateForInput(selectedLead.data_nascimento) && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{formatDateSafe(selectedLead.data_nascimento)}</span>
                    </div>
                  )}

                  {selectedLead.origem && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{selectedLead.origem}</span>
                    </div>
                  )}

                  {selectedLead.vendedor && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{selectedLead.vendedor}</span>
                    </div>
                  )}

                  {selectedLead.veiculo_interesse && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{selectedLead.veiculo_interesse}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{formatLeadTimestamp(selectedLead.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="flex-1 mt-4">
                <div className="space-y-6 pr-4">
                  {/* Campos Editáveis */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Valor do Lead - Editável */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-lg font-semibold text-green-800">Valor do Negócio</span>
                      </div>
                      <EditableValueField
                        leadId={selectedLead.id}
                        currentValue={selectedLead.valor || 0}
                        onValueUpdate={(newValue) => handleValueUpdate(selectedLead.id, newValue)}
                        className="text-xl"
                      />
                    </div>

                    {/* Observação do Vendedor - Editável */}
                    <div>
                      <EditableObservacaoField
                        leadId={selectedLead.id}
                        currentObservacao={selectedLead.observacao_vendedor || ""}
                        onObservacaoUpdate={(newObservacao) => handleObservacaoUpdate(selectedLead.id, newObservacao)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Veículo - Editável */}
                    <div>
                      <EditableVeiculoField
                        leadId={selectedLead.id}
                        currentVeiculo={selectedLead.veiculo_interesse || ""}
                        onVeiculoUpdate={(newVeiculo) => handleVeiculoUpdate(selectedLead.id, newVeiculo)}
                      />
                    </div>

                    {/* CPF - Editável */}
                    <div>
                      <EditableCpfField
                        leadId={selectedLead.id}
                        currentCpf={selectedLead.cpf || ""}
                        onCpfUpdate={(newCpf) => handleCpfUpdate(selectedLead.id, newCpf)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <EditableDataNascimentoField
                        leadId={selectedLead.id}
                        currentValue={selectedLead.data_nascimento || ""}
                        onDataNascimentoUpdate={(newValue) => handleDataNascimentoUpdate(selectedLead.id, newValue)}
                      />
                    </div>
                  </div>

                  {/* Resumos - Somente Leitura */}
                  {selectedLead.resumo_qualificacao && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Resumo de Qualificação
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                          {selectedLead.resumo_qualificacao}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resumo Comercial com Botão Gerar */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-500" />
                        Resumo Comercial
                      </h4>
                      <Button
                        onClick={handleGenerateResumo}
                        disabled={generatingResumo}
                        className="bg-gradient-to-r from-green-600 to-gray-900 hover:from-green-700 hover:to-black text-white"
                        size="sm"
                      >
                        {generatingResumo ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Gerar Resumo Comercial
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                        {selectedLead.resumo_comercial || (
                          <span className="text-gray-500 italic">
                            Nenhum resumo comercial disponível. Clique em "Gerar Resumo Comercial" para criar um.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Espaço extra no final para scroll confortável */}
                  <div className="h-4"></div>
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog com barra de progresso */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="bg-slate-900 border-[#22C55E]">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-[#22C55E] animate-spin" />
              Gerando Resumo Comercial
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Aguarde enquanto analisamos as informações do lead...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={progressValue} className="h-3" />
            <p className="text-center text-sm text-gray-400">{Math.round(progressValue)}% completo</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Enviar Mensagem */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Enviar Mensagem
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                Você está enviando uma mensagem para {selectedLeadIds.length} lead(s) selecionado(s).
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Digite a mensagem para o Lead
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                className="w-full min-h-[120px] p-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none text-gray-900"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowMessageModal(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendMensagem}
                disabled={!messageText.trim() || processingAction}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                {processingAction ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
