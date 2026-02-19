"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { KanbanBoard } from "@/components/kanban-board"

export default function Negociacoes() {
  const router = useRouter()

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
        {/* ============================
             TEMA GLOBAL PRETO + VERDE
           ============================ */}
        <style>{`
          /* ===============================
             1. Fundo preto em TUDO
          =============================== */

          .bg-white,
          .bg-background,
          .bg-card,
          .bg-popover,
          .bg-muted,
          .bg-gray-50,
          .bg-gray-100,
          .bg-gray-200,
          .bg-accent,
          .card,
          main,
          section,
          .container,
          .kanban-column,
          .kanban-card,
          .shadow-sm,
          .rounded-lg,
          [class*="bg-white"],
          [class*="bg-gray-"],
          [class*="card"],
          [class*="popover"],
          [class*="surface"],
          [class*="muted"],
          .border,
          .flex-1 {
            background-color: #000 !important;
          }

          /* ===============================
             2. Texto branco
          =============================== */

          h1, h2, h3, h4, h5, h6,
          p, span, label, div,
          .text-gray-600,
          .text-gray-900,
          .text-muted-foreground {
            color: #FFFFFF !important;
          }

          /* ===============================
             3. Inputs e selects
          =============================== */

          input,
          select,
          textarea {
            background-color: #000 !important;
            color: #FFF !important;
            border: 1px solid #22C55E !important;
          }

          input::placeholder {
            color: #999 !important;
          }

          /* ===============================
             4. Botões verde neon
          =============================== */

          button,
          .btn,
          .shadcn-button,
          .kanban-button {
            background-color: #22C55E !important;
            color: #000 !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            transition: 0.2s ease-in-out !important;
          }

          button:hover,
          .btn:hover,
          .shadcn-button:hover,
          .kanban-button:hover {
            background-color: #22C55E !important;
            color: #000 !important;
          }

          /* ===============================
             5. Badges e tags
          =============================== */

          .badge,
          .tag,
          .status-badge {
            background: #22C55E !important;
            color: #000 !important;
            border: 1px solid #000 !important;
          }

          /* ===============================
             6. Sidebar — item ativo (Negociações)
          =============================== */

          .sidebar nav a[aria-current="page"],
          .sidebar nav a.active,
          .sidebar a[data-active="true"],
          .sidebar a[data-state="active"],
          .sidebar .active,
          .sidebar-active {
            background-color: #22C55E !important;
            color: #000 !important;
            border: 1px solid #000 !important;
          }

          .sidebar nav a[aria-current="page"] svg,
          .sidebar nav a.active svg,
          .sidebar a[data-active="true"] svg,
          .sidebar a[data-state="active"] svg,
          .sidebar .active svg,
          .sidebar-active svg {
            color: #000 !important;
            stroke: #000 !important;
          }

          /* ===============================
             7. Mensagem de info (era azul)
          =============================== */

          .kanban-info,
          .bg-blue-50 {
            background-color: #000000 !important;
            border: 1px solid #22C55E !important;
            color: #FFFFFF !important;
          }

          .kanban-info p,
          .kanban-info span,
          .kanban-info strong,
          .kanban-info div {
            background-color: transparent !important;
            color: #FFFFFF !important;
          }

          /* Forçar visibilidade dos botões Kanban/Lista */
          /* ===============================
             8. Botões de Visualização (Kanban/Lista)
          =============================== */
          
          button[variant="outline"],
          .btn-green-outline {
            background-color: transparent !important;
            color: #22C55E !important;
            border: 1px solid #22C55E !important;
          }

          button[variant="outline"]:hover,
          .btn-green-outline:hover {
            background-color: #22C55E !important;
            color: #000 !important;
          }

          button[variant="default"],
          .btn-green-active {
            background-color: #22C55E !important;
            color: #000 !important;
            border: 1px solid #22C55E !important;
          }

          /* Garantir que os botões dentro do card de visualização sejam visíveis */
          [class*="CardHeader"] button,
          [class*="card-header"] button {
            display: inline-flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        `}</style>

        {/* ============================
             HEADER COM TÍTULO
           ============================ */}
        <div className="flex-shrink-0 border-b border-[#22C55E] bg-black px-6 py-4">
          <h1 className="text-3xl font-bold mb-1">Negociações</h1>
          <p className="text-gray-400 text-sm">Gerencie seus leads através do funil de vendas</p>
        </div>

        {/* ============================
             CONTEÚDO DA PÁGINA - OPTIMIZADO PARA KANBAN
           ============================ */}
        <main className="flex-1 overflow-hidden bg-black flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-6 h-full">
              <KanbanBoard />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
