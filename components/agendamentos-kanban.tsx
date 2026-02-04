"use client"

import { useEffect, useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getAgendamentos,
  updateAgendamentoStage,
  deleteAgendamento,
  getVendedores,
  type Agendamento,
  type Vendedor,
  ESTAGIO_AGENDAMENTO_LABELS,
  VALID_ESTAGIOS_AGENDAMENTO,
  updateAgendamento,
  sendAgendamentoWebhook,
} from "@/lib/agendamentos"
import { getCurrentUser } from "@/lib/auth"
import { Search, Filter, Phone, Calendar, Clock, User, Trash2, AlertTriangle, Move } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const COLUNAS_KANBAN_AGENDAMENTOS = ["Agendado", "Confirmado", "Realizado", "Cancelado", "Reagendado"]

export function AgendamentosKanban() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [filteredAgendamentos, setFilteredAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [movingAgendamento, setMovingAgendamento] = useState<string | null>(null)
  const [deletingAgendamento, setDeletingAgendamento] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    titulo: "",
    data_agendamento: "",
    descricao: "",
    vendedor_id: "",
    local: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterAgendamentos()
  }, [agendamentos, searchTerm])

  const loadData = async () => {
    const user = getCurrentUser()
    if (user) {
      const [agendamentosData, vendedoresData] = await Promise.all([
        getAgendamentos(user.id_empresa),
        getVendedores(user.id_empresa),
      ])
      setAgendamentos(agendamentosData)
      setVendedores(vendedoresData)
    }
    setLoading(false)
  }

  const filterAgendamentos = () => {
    let filtered = [...agendamentos]

    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.nome_lead?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.telefone?.includes(searchTerm) ||
          a.vendedor_nome?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredAgendamentos(filtered)
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId) return

    const agendamentoId = draggableId
    const newStage = destination.droppableId
    const oldStage = source.droppableId

    if (!VALID_ESTAGIOS_AGENDAMENTO.includes(newStage)) {
      setStatusMessage({
        type: "error",
        text: `Estágio inválido: ${newStage}`,
      })
      setTimeout(() => setStatusMessage(null), 5000)
      return
    }

    setMovingAgendamento(agendamentoId)

    setAgendamentos((prev) =>
      prev.map((a) =>
        a.id === agendamentoId ? { ...a, status: newStage, atualizado_em: new Date().toISOString() } : a,
      ),
    )

    try {
      const success = await updateAgendamentoStage(agendamentoId, newStage)

      if (!success) {
        setAgendamentos((prev) =>
          prev.map((a) => (a.id === agendamentoId ? { ...a, status: oldStage } : a)),
        )

        setStatusMessage({
          type: "error",
          text: "Erro ao mover o agendamento",
        })
      } else {
        setStatusMessage({
          type: "success",
          text: "Agendamento movido com sucesso!",
        })
      }
    } catch (error) {
      setAgendamentos((prev) => prev.map((a) => (a.id === agendamentoId ? { ...a, status: oldStage } : a)))
      setStatusMessage({
        type: "error",
        text: "Erro ao mover o agendamento",
      })
    } finally {
      setMovingAgendamento(null)
      setTimeout(() => setStatusMessage(null), 5000)
    }
  }

  const handleOpenAgendamento = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento)
    setFormData({
      titulo: agendamento.titulo || "",
      data_agendamento: agendamento.data_agendamento || "",
      descricao: agendamento.descricao || "",
      vendedor_id: agendamento.vendedor_id?.toString() || "",
      local: agendamento.local || "",
    })
  }

  const handleSaveAgendamento = async () => {
    if (!selectedAgendamento) return

    const success = await updateAgendamento(selectedAgendamento.id, {
      titulo: formData.titulo,
      data_agendamento: formData.data_agendamento,
      descricao: formData.descricao,
      vendedor_id: formData.vendedor_id || undefined,
      local: formData.local,
    })

    if (success) {
      // Buscar o vendedor selecionado para obter o nome
      const vendedorSelecionado = vendedores.find((v) => v.id.toString() === formData.vendedor_id)

      // Enviar webhook com os dados atualizados
      const agendamentoAtualizado: Agendamento = {
        ...selectedAgendamento,
        titulo: formData.titulo,
        data_agendamento: formData.data_agendamento,
        descricao: formData.descricao,
        vendedor_id: formData.vendedor_id || undefined,
        vendedor_nome: vendedorSelecionado?.nome || selectedAgendamento.vendedor_nome,
        local: formData.local,
        atualizado_em: new Date().toISOString(),
      }

      await sendAgendamentoWebhook(agendamentoAtualizado)

      await loadData()
      setSelectedAgendamento(null)
      setStatusMessage({
        type: "success",
        text: "Agendamento atualizado com sucesso!",
      })
    } else {
      setStatusMessage({
        type: "error",
        text: "Erro ao atualizar agendamento",
      })
    }

    setTimeout(() => setStatusMessage(null), 5000)
  }

  const handleDeleteAgendamento = async (agendamentoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return

    setDeletingAgendamento(agendamentoId)

    try {
      const success = await deleteAgendamento(agendamentoId)

      if (success) {
        setAgendamentos((prev) => prev.filter((a) => a.id !== agendamentoId))

        if (selectedAgendamento && selectedAgendamento.id === agendamentoId) {
          setSelectedAgendamento(null)
        }

        setStatusMessage({
          type: "success",
          text: "Agendamento excluído com sucesso!",
        })
      } else {
        setStatusMessage({
          type: "error",
          text: "Erro ao excluir agendamento",
        })
      }
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: "Erro inesperado ao excluir agendamento",
      })
    } finally {
      setDeletingAgendamento(null)
      setTimeout(() => setStatusMessage(null), 5000)
    }
  }

  const getAgendamentosByStage = (stage: string) => {
    return filteredAgendamentos.filter((a) => a.status === stage)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {COLUNAS_KANBAN_AGENDAMENTOS.map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, telefone ou vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Message */}
      {statusMessage && (
        <Alert
          className={`${statusMessage.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className={statusMessage.type === "success" ? "text-green-700" : "text-red-700"}>
            {statusMessage.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {COLUNAS_KANBAN_AGENDAMENTOS.map((stage) => (
              <Droppable key={stage} droppableId={stage}>
                {(provided, snapshot) => (
                  <Card
                    className={`w-80 min-h-[500px] flex-shrink-0 transition-all duration-200 ${
                      snapshot.isDraggingOver
                        ? "bg-gradient-to-b from-blue-50 to-blue-100 border-blue-300 shadow-lg"
                        : "hover:shadow-md"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {snapshot.isDraggingOver && <Move className="h-4 w-4 text-blue-500 animate-pulse" />}
                          {ESTAGIO_AGENDAMENTO_LABELS[stage as keyof typeof ESTAGIO_AGENDAMENTO_LABELS]}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getAgendamentosByStage(stage).length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {getAgendamentosByStage(stage).map((agendamento, index) => (
                        <Draggable key={agendamento.id} draggableId={agendamento.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                snapshot.isDragging
                                  ? "shadow-2xl rotate-3 scale-105 bg-white border-blue-300 z-50"
                                  : "hover:shadow-md hover:-translate-y-1"
                              } ${movingAgendamento === agendamento.id ? "opacity-50" : ""}`}
                              onClick={() => handleOpenAgendamento(agendamento)}
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {agendamento.titulo || agendamento.nome_lead || "Sem título"}
                                </div>
                                <div className="space-y-1 text-xs text-gray-600">
                                  {agendamento.telefone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {agendamento.telefone}
                                    </div>
                                  )}
                                  {agendamento.data_agendamento && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(agendamento.data_agendamento).toLocaleDateString("pt-BR")}
                                    </div>
                                  )}
                                  {agendamento.local && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {agendamento.local}
                                    </div>
                                  )}
                                  {agendamento.vendedor_nome && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {agendamento.vendedor_nome}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Modal de Detalhes */}
      <Dialog open={selectedAgendamento !== null} onOpenChange={() => setSelectedAgendamento(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAgendamento?.titulo || selectedAgendamento?.nome_lead || "Detalhes do Agendamento"}</DialogTitle>
          </DialogHeader>

          {selectedAgendamento && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Título</label>
                <Input
                  placeholder="Ex: Visita ao cliente"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Data e Hora</label>
                <Input
                  type="datetime-local"
                  value={formData.data_agendamento}
                  onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Local</label>
                <Input
                  placeholder="Ex: Loja Centro"
                  value={formData.local}
                  onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Vendedor</label>
                <Select
                  value={formData.vendedor_id}
                  onValueChange={(value) => setFormData({ ...formData, vendedor_id: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <Input
                  placeholder="Adicione uma descrição"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveAgendamento} className="flex-1">
                  Salvar
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteAgendamento(selectedAgendamento.id)}
                  disabled={deletingAgendamento === selectedAgendamento.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
