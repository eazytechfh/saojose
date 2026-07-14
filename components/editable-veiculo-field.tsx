"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateLeadVeiculo, type LeadId } from "@/lib/leads"
import { Check, X, Edit3, Car } from "lucide-react"

interface EditableVeiculoFieldProps {
  leadId: LeadId
  currentVeiculo: string
  onVeiculoUpdate: (newVeiculo: string) => void
  className?: string
}

export function EditableVeiculoField({
  leadId,
  currentVeiculo,
  onVeiculoUpdate,
  className = "",
}: EditableVeiculoFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentVeiculo || "")
  const [loading, setLoading] = useState(false)

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(currentVeiculo || "")
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const success = await updateLeadVeiculo(leadId, editValue)

      if (success) {
        onVeiculoUpdate(editValue)
        setIsEditing(false)
      } else {
        // Reverter para o valor original em caso de erro
        setEditValue(currentVeiculo || "")
      }
    } catch (error) {
      console.error("Error updating veiculo:", error)
      setEditValue(currentVeiculo || "")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(currentVeiculo || "")
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="relative flex-1">
          <Car className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="h-7 border-blue-500/60 bg-slate-950 pl-6 pr-1 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
            placeholder="Ex: Honda Civic 2020"
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="h-7 w-7 p-0 bg-blue-500 hover:bg-blue-600"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="h-7 w-7 border-slate-600 bg-transparent p-0 text-slate-100 hover:bg-slate-800"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group flex cursor-pointer items-center justify-between rounded border border-blue-500/50 bg-blue-950/10 p-2 transition-colors hover:bg-blue-950/25 ${className}`}
      onClick={handleStartEdit}
    >
      <div className="flex items-center gap-2">
        <Car className="h-4 w-4 text-blue-400" />
        <div>
          <span className="text-sm font-medium text-blue-300">Veículo de Interesse</span>
          <div className="text-sm text-slate-200">
            {currentVeiculo || <span className="italic text-slate-400">Clique para adicionar veículo</span>}
          </div>
        </div>
      </div>
      <Edit3 className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
