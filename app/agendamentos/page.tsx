"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { AgendamentosKanban } from "@/components/agendamentos-kanban"
import { AgendamentosListView } from "@/components/agendamentos-list-view"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function Agendamentos() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
    }
  }, [router])

  return (
    <div className="flex h-screen bg-black">
      <SidebarNav />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* ========================
            ESTILO GLOBAL NEON DARK
        ========================= */}
        <style>{`
          /* Fundo preto geral */
          body, main, div, section, .container, .flex-1 {
            background-color: #000 !important;
          }

          /* Textos brancos */
          h1, h2, h3, h4, h5, h6,
          p, span, label, strong,
          .text-gray-600, .text-gray-900,
          .text-muted {
            color: #FFF !important;
          }

          /* Cards totalmente pretos */
          .card,
          .bg-white,
          .bg-gray-50,
          .bg-gray-100,
          [class*="bg-muted"],
          [class*="bg-card"] {
            background-color: #000 !important;
            border: 1px solid #222 !important;
          }

          /* Inputs */
          input, select, textarea {
            background-color: #000 !important;
            color: #FFF !important;
            border: 1px solid #22C55E !important;
          }
          input::placeholder {
            color: #AAA !important;
          }

          /* Botões neon */
          .btn-green-active {
            background-color: #22C55E !important;
            color: #000 !important;
            border: 1px solid #22C55E !important;
          }

          .btn-green-outline {
            background-color: transparent !important;
            color: #22C55E !important;
            border: 1px solid #22C55E !important;
          }

          .btn-green-outline:hover {
            background-color: #22C55E !important;
            color: #000 !important;
          }

          /* Sidebar item ativo → verde neon */
          .sidebar-active,
          .sidebar nav a[aria-current="page"],
          .sidebar a[data-active="true"] {
            background-color: #22C55E !important;
            color: #000 !important;
          }
          .sidebar nav a[aria-current="page"] svg {
            color: #000 !important;
            stroke: #000 !important;
          }
        `}</style>

        {/* ========================
            CONTEÚDO
        ========================= */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-black">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Agendamentos</h1>
              <p className="text-gray-600">Gerencie os agendamentos de visitas com clientes</p>
            </div>

            <Card className="mb-6 bg-black border border-gray-800">
              <div className="p-4">
                <div className="flex gap-2">
                  {/* BOTÃO KANBAN */}
                  <Button
                    variant={viewMode === "kanban" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("kanban")}
                    className={`flex items-center gap-2 ${
                      viewMode === "kanban" ? "btn-green-active" : "btn-green-outline"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Kanban
                  </Button>

                  {/* BOTÃO LISTA */}
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-2 ${
                      viewMode === "list" ? "btn-green-active" : "btn-green-outline"
                    }`}
                  >
                    <List className="h-4 w-4" />
                    Lista
                  </Button>
                </div>
              </div>
            </Card>

            {/* Conteúdo das views */}
            {viewMode === "kanban" ? <AgendamentosKanban /> : <AgendamentosListView />}
          </div>
        </main>
      </div>
    </div>
  )
}
