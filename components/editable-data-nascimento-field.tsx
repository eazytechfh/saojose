"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateLeadDataNascimento, type LeadId } from "@/lib/leads"
import { Check, X, Edit3, Calendar } from "lucide-react"

interface EditableDataNascimentoFieldProps {
  leadId: LeadId
  currentValue: string
  onDataNascimentoUpdate: (newValue: string) => void
  className?: string
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

export function normalizeDateForInput(value?: string | null): string {
  if (!value || typeof value !== "string") return ""
  const trimmed = value.trim()
  if (!trimmed) return ""

  if (isValidYmdDate(trimmed)) {
    return trimmed
  }

  const isoCandidate = trimmed.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed) && isValidYmdDate(isoCandidate)) {
    return isoCandidate
  }

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    const [, day, month, year] = brMatch
    const normalized = `${year}-${month}-${day}`
    return isValidYmdDate(normalized) ? normalized : ""
  }

  return ""
}

function formatDateToPtBr(value: string): string {
  const normalized = normalizeDateForInput(value)
  if (!normalized) return ""
  const [year, month, day] = normalized.split("-")
  return `${day}/${month}/${year}`
}

export function EditableDataNascimentoField({
  leadId,
  currentValue,
  onDataNascimentoUpdate,
  className = "",
}: EditableDataNascimentoFieldProps) {
  const normalizedCurrent = useMemo(() => normalizeDateForInput(currentValue), [currentValue])
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(normalizedCurrent)
  const [loading, setLoading] = useState(false)

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(normalizeDateForInput(currentValue))
  }

  const handleSave = async () => {
    setLoading(true)
    const normalized = normalizeDateForInput(editValue)

    try {
      const success = await updateLeadDataNascimento(leadId, normalized)
      if (success) {
        onDataNascimentoUpdate(normalized)
        setIsEditing(false)
      } else {
        setEditValue(normalizeDateForInput(currentValue))
      }
    } catch (error) {
      console.error("Error updating data_nascimento:", error)
      setEditValue(normalizeDateForInput(currentValue))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(normalizeDateForInput(currentValue))
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
          <Calendar className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
          <Input
            type="date"
            value={normalizeDateForInput(editValue)}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="h-7 pl-6 pr-1 text-xs border-blue-300 focus:border-blue-500"
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="flex gap-1">
          <Button size="sm" onClick={handleSave} disabled={loading} className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700">
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="h-7 w-7 p-0 border-gray-300 bg-transparent hover:bg-gray-50"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group flex cursor-pointer items-center justify-between rounded border border-blue-200 p-2 transition-colors hover:bg-blue-50 ${className}`}
      onClick={handleStartEdit}
    >
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-blue-600" />
        <div>
          <span className="text-sm font-medium text-blue-800">Data de Nascimento</span>
          <div className="text-sm text-gray-700">
            {normalizedCurrent ? (
              formatDateToPtBr(normalizedCurrent)
            ) : (
              <span className="italic text-gray-400">Clique para adicionar data de nascimento</span>
            )}
          </div>
        </div>
      </div>
      <Edit3 className="h-4 w-4 text-blue-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}
