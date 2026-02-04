"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateLeadEmail } from "@/lib/leads"
import { Check, X, Edit3, Mail } from "lucide-react"

interface EditableEmailFieldProps {
  leadId: number
  currentEmail: string
  onEmailUpdate: (newEmail: string) => void
  className?: string
}

export function EditableEmailField({ leadId, currentEmail, onEmailUpdate, className = "" }: EditableEmailFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentEmail || "")
  const [loading, setLoading] = useState(false)

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(currentEmail || "")
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const success = await updateLeadEmail(leadId, editValue)

      if (success) {
        onEmailUpdate(editValue)
        setIsEditing(false)
      } else {
        // Reverter para o valor original em caso de erro
        setEditValue(currentEmail || "")
      }
    } catch (error) {
      console.error("Error updating email:", error)
      setEditValue(currentEmail || "")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(currentEmail || "")
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="relative flex-1">
          <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            type="email"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className={`text-xs h-7 pl-6 pr-1 ${
              editValue && !isValidEmail(editValue)
                ? "border-red-300 focus:border-red-500"
                : "border-green-300 focus:border-green-500"
            }`}
            placeholder="exemplo@email.com"
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || (editValue && !isValidEmail(editValue))}
            className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="h-7 w-7 p-0 border-gray-300 hover:bg-gray-50 bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-between group cursor-pointer hover:bg-green-50 rounded p-2 transition-colors border border-green-200 ${className}`}
      onClick={handleStartEdit}
    >
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-green-600" />
        <div>
          <span className="text-sm font-medium text-green-800">E-mail</span>
          <div className="text-sm text-gray-700">
            {currentEmail || <span className="text-gray-400 italic">Clique para adicionar e-mail</span>}
          </div>
        </div>
      </div>
      <Edit3 className="h-4 w-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
