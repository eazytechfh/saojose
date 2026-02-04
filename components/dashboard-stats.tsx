"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getLeadStats, ESTAGIO_LABELS } from "@/lib/leads"
import { getCurrentUser } from "@/lib/auth"
import { Users, TrendingUp, Award, Zap, Activity, DollarSign } from "lucide-react"

// Função para formatar moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function DashboardStats() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    leadsPorEstagio: {} as Record<string, number>,
    leadsPorOrigem: {} as Record<string, number>,
    conversao: "0",
    valorTotal: 0,
    valorMedio: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const user = getCurrentUser()
      if (user) {
        const data = await getLeadStats(user.id_empresa)
        setStats(data)
      }
      setLoading(false)
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="animate-pulse border border-gray-800 bg-black shadow-xl"
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gray-800 rounded-2xl" />
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-8 bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: "Total de Leads",
      value: stats.totalLeads,
      subtitle: "Leads cadastrados",
      icon: Users,
      gradient: "from-green-500 to-emerald-500",
      borderColor: "border-green-600",
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Taxa de Conversão",
      value: `${stats.conversao}%`,
      subtitle: "Leads fechados",
      icon: TrendingUp,
      gradient: "from-blue-500 to-cyan-500",
      borderColor: "border-blue-600",
      change: "+2.3%",
      changeType: "positive" as const,
    },
    {
      title: "Valor Total",
      value: formatCurrency(stats.valorTotal || 0),
      subtitle: "Pipeline de vendas",
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      borderColor: "border-green-600",
      change: "+15%",
      changeType: "positive" as const,
    },
    {
      title: "Fechados",
      value: stats.leadsPorEstagio.fechado || 0,
      subtitle: "Vendas realizadas",
      icon: Award,
      gradient: "from-orange-500 to-red-500",
      borderColor: "border-orange-600",
      change: "+5",
      changeType: "positive" as const,
    },
  ]

  return (
    <div className="space-y-8">
      {/* CARDS PRINCIPAIS – FUNDO PRETO */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className={`shadow-xl bg-black ${card.borderColor} border hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-3 bg-gradient-to-r ${card.gradient} rounded-xl shadow-lg`}
                    >
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-200">
                        {card.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={`text-xs ${
                            card.changeType === "positive"
                              ? "bg-green-900/60 text-green-300"
                              : "bg-red-900/60 text-red-300"
                          }`}
                        >
                          {card.change}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-white">
                      {card.value}
                    </div>
                    <p className="text-sm text-gray-300">{card.subtitle}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CARDS DE RESUMO – TAMBÉM PRETOS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribuição por estágio */}
        <Card className="border border-green-700 shadow-xl bg-black">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-green-300 font-bold">
                Distribuição por Estágio
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.leadsPorEstagio)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([estagio, count], index) => (
                  <div
                    key={estagio}
                    className="flex items-center justify-between p-3 bg-black/80 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : index === 1
                              ? "bg-gradient-to-r from-blue-400 to-cyan-500"
                              : index === 2
                                ? "bg-gradient-to-r from-teal-400 to-green-500"
                                : index === 3
                                  ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                                  : "bg-gradient-to-r from-gray-400 to-gray-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-white">
                        {
                          ESTAGIO_LABELS[
                            estagio as keyof typeof ESTAGIO_LABELS
                          ]
                        }
                      </span>
                    </div>
                    <Badge className="bg-gray-800 text-gray-200 font-semibold">
                      {count as number}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Canais de origem */}
        <Card className="border border-emerald-700 shadow-xl bg-black">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-emerald-300 font-bold">
                Canais de Origem
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.leadsPorOrigem)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([origem, count], index) => (
                  <div
                    key={origem}
                    className="flex items-center justify-between p-3 bg-black/80 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                            : index === 1
                              ? "bg-gradient-to-r from-blue-400 to-cyan-500"
                              : index === 2
                                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                : index === 3
                                  ? "bg-gradient-to-r from-orange-400 to-red-500"
                                  : "bg-gradient-to-r from-gray-400 to-gray-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-white">
                        {origem}
                      </span>
                    </div>
                    <Badge className="bg-gray-800 text-gray-200 font-semibold">
                      {count as number}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
