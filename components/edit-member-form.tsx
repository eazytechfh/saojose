"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateMemberInfo, type User } from "@/lib/auth"
import { Loader2, Pencil, Eye, EyeOff } from "lucide-react"

interface EditMemberFormProps {
  member: User | null
  currentUser: User
  onClose: () => void
  onSuccess: () => void
}

export function EditMemberForm({ member, currentUser, onClose, onSuccess }: EditMemberFormProps) {
  const [formData, setFormData] = useState({
    nome_usuario: "",
    email: "",
    telefone: "",
    senha: "",
  })
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (member) {
      setFormData({
        nome_usuario: member.nome_usuario || "",
        email: member.email || "",
        telefone: member.telefone || "",
        senha: member.senha || "",
      })
      setShowSenha(false)
      setError("")
    }
  }, [member])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member) return

    setError("")

    if (!formData.nome_usuario.trim()) {
      setError("Nome do usuário é obrigatório")
      return
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("E-mail válido é obrigatório")
      return
    }

    if (!formData.senha.trim() || formData.senha.length < 6) {
      setError("Senha com mínimo de 6 caracteres é obrigatória")
      return
    }

    setLoading(true)

    try {
      const result = await updateMemberInfo(
        member.id,
        {
          nome_usuario: formData.nome_usuario,
          email: formData.email,
          telefone: formData.telefone,
          senha: formData.senha,
        },
        currentUser,
      )

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || "Erro ao atualizar membro.")
      }
    } catch (err) {
      setError("Erro ao atualizar membro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Membro
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit_nome_usuario">Nome do Usuário *</Label>
            <Input
              id="edit_nome_usuario"
              value={formData.nome_usuario}
              onChange={(e) => handleChange("nome_usuario", e.target.value)}
              required
              placeholder="Nome completo"
            />
          </div>

          <div>
            <Label htmlFor="edit_email">E-mail *</Label>
            <Input
              id="edit_email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="edit_telefone">Telefone</Label>
            <Input
              id="edit_telefone"
              value={formData.telefone}
              onChange={(e) => handleChange("telefone", e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="edit_senha">Senha *</Label>
            <div className="relative">
              <Input
                id="edit_senha"
                type={showSenha ? "text" : "password"}
                value={formData.senha}
                onChange={(e) => handleChange("senha", e.target.value)}
                required
                placeholder="Senha de acesso"
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSenha((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
