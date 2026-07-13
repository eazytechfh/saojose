"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  updateLeadVehicleSale,
  type LeadId,
  type OtherVehicleDetails,
  type VehicleSaleStatus,
} from "@/lib/leads"

interface VehicleSaleStatusFieldProps {
  leadId: LeadId
  currentStatus?: VehicleSaleStatus | null
  currentDetails?: string | null
  currentBrand?: string | null
  currentModel?: string | null
  currentYear?: string | null
  currentColor?: string | null
  currentValue?: number | null
  onUpdate: (status: VehicleSaleStatus, details: OtherVehicleDetails) => void
}

const OPTIONS: Array<{ value: VehicleSaleStatus; label: string }> = [
  { value: "vendido", label: "Sim, foi vendido" },
  { value: "nao_vendido", label: "Não, não foi vendido" },
  { value: "procura_outro", label: "Não foi vendido, procura outro carro" },
]

export function VehicleSaleStatusField({
  leadId,
  currentStatus,
  currentDetails,
  currentBrand,
  currentModel,
  currentYear,
  currentColor,
  currentValue,
  onUpdate,
}: VehicleSaleStatusFieldProps) {
  const [status, setStatus] = useState<VehicleSaleStatus | "">(currentStatus || "")
  const [details, setDetails] = useState<OtherVehicleDetails>({
    reason: currentDetails || "", brand: currentBrand || "", model: currentModel || "",
    year: currentYear || "", color: currentColor || "", value: currentValue == null ? "" : String(currentValue),
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    setStatus(currentStatus || "")
    setDetails({ reason: currentDetails || "", brand: currentBrand || "", model: currentModel || "",
      year: currentYear || "", color: currentColor || "", value: currentValue == null ? "" : String(currentValue).replace(".", ",") })
  }, [currentStatus, currentDetails, currentBrand, currentModel, currentYear, currentColor, currentValue, leadId])

  const updateDetail = (field: keyof OtherVehicleDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }))
    setMessage("")
  }

  const handleStatusChange = (newStatus: VehicleSaleStatus) => {
    setStatus(newStatus)
    setMessage("")
    if (newStatus !== "procura_outro") setDetails({ reason: "", brand: "", model: "", year: "", color: "", value: "" })
  }

  const handleSave = async () => {
    if (!status) {
      setMessage("Selecione uma opção.")
      return
    }
    if (status === "procura_outro" && !details.reason.trim()) {
      setMessage("Explique o motivo da procura por outro carro.")
      return
    }

    setLoading(true)
    setMessage("")
    const saved = await updateLeadVehicleSale(leadId, status, details)
    setLoading(false)

    if (!saved) {
      setMessage("Não foi possível salvar. Verifique se a migração foi aplicada.")
      return
    }

    onUpdate(status, status === "procura_outro" ? details : { reason: "", brand: "", model: "", year: "", color: "", value: "" })
    setMessage("Informação salva.")
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
      <p className="mb-3 text-sm font-semibold text-amber-900">O carro foi vendido?</p>
      <div className="space-y-2">
        {OPTIONS.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-start gap-2 text-sm text-gray-800">
            <input
              type="radio"
              name={`status-venda-${leadId}`}
              value={option.value}
              checked={status === option.value}
              onChange={() => handleStatusChange(option.value)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 accent-amber-600"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      {status === "procura_outro" && (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-800">Motivo</label>
            <Textarea value={details.reason} onChange={(e) => updateDetail("reason", e.target.value)}
              placeholder="Explique por que o cliente deseja outro carro." disabled={loading} className="min-h-40 flex-1" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-800">Veículo procurado</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input value={details.brand} onChange={(e) => updateDetail("brand", e.target.value)} placeholder="Marca" disabled={loading} />
              <Input value={details.model} onChange={(e) => updateDetail("model", e.target.value)} placeholder="Modelo" disabled={loading} />
              <Input value={details.year} onChange={(e) => updateDetail("year", e.target.value.replace(/[^0-9/]/g, ""))} placeholder="Ano" inputMode="numeric" disabled={loading} />
              <Input value={details.color} onChange={(e) => updateDetail("color", e.target.value)} placeholder="Cor" disabled={loading} />
              <Input value={details.value} onChange={(e) => updateDetail("value", e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="Valor (R$)" inputMode="decimal" disabled={loading} className="sm:col-span-2" />
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" size="sm" onClick={handleSave} disabled={loading || !status}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
        {message && <span className={`text-xs ${message === "Informação salva." ? "text-green-700" : "text-red-600"}`}>{message}</span>}
      </div>
    </div>
  )
}
