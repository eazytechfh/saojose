"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateLeadCpf, type LeadId } from "@/lib/leads"
import { Check, X, Edit3, FileText } from "lucide-react"

interface EditableCpfFieldProps {
  leadId: LeadId
  currentCpf: string
  onCpfUpdate: (newCpf: string) => void
  className?: string
}

export function EditableCpfField({ leadId, currentCpf, onCpfUpdate, className = "" }: EditableCpfFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentCpf || "")
  const [loading, setLoading] = useState(false)

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(currentCpf || "")
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const success = await updateLeadCpf(leadId, editValue)

      if (success) {
        onCpfUpdate(editValue)
        setIsEditing(false)
      } else {
        setEditValue(currentCpf || "")
      }
    } catch (error) {
      console.error("Error updating cpf:", error)
      setEditValue(currentCpf || "")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(currentCpf || "")
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
          <FileText className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="h-7 border-green-500/60 bg-slate-950 pl-6 pr-1 text-xs text-slate-100 placeholder:text-slate-500 focus:border-green-500"
            placeholder="000.000.000-00"
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="flex gap-1">
          <Button size="sm" onClick={handleSave} disabled={loading} className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700">
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
      className={`group flex cursor-pointer items-center justify-between rounded border border-green-500/50 bg-green-950/10 p-2 transition-colors hover:bg-green-950/25 ${className}`}
      onClick={handleStartEdit}
    >
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-green-400" />
        <div>
          <span className="text-sm font-medium text-green-300">CPF</span>
          <div className="text-sm text-slate-200">
            {currentCpf || <span className="italic text-slate-400">Clique para adicionar CPF</span>}
          </div>
        </div>
      </div>
      <Edit3 className="h-4 w-4 text-green-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}
