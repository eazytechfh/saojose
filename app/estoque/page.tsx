"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdicionarVeiculoForm } from "@/components/adicionar-veiculo-form"
import { ListaVeiculos } from "@/components/lista-veiculos"

export default function Estoque() {
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
            GLOBAL DARK + NEON
        ============================ */}
        <style>{`
          /* Fundo geral */
          body, main, div, section, .container, .flex-1 {
            background-color: #000 !important;
          }

          /* Textos brancos */
          h1, h2, h3, h4, h5, h6,
          p, span, label, strong,
          .text-gray-600, .text-gray-900 {
            color: #FFF !important;
          }

          /* Cards e áreas brancas → preto */
          .card,
          .bg-white,
          .bg-gray-50,
          .bg-gray-100,
          [class*="bg-muted"],
          [class*="bg-card"],
          [class*="surface"] {
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

          /* Sidebar item Estoqie ativo */
          .sidebar nav a[aria-current="page"],
          .sidebar a[data-active="true"] {
            background-color: #22C55E !important;
            color: #000 !important;
            border-radius: 6px;
          }
          .sidebar nav a[aria-current="page"] svg {
            color: #000 !important;
            stroke: #000 !important;
          }
        `}</style>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-black">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Estoque</h1>
              <p className="text-gray-600">Gerencie o estoque de veículos da sua concessionária</p>
            </div>

            {/* TABS */}
            <Tabs defaultValue="adicionar" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-transparent">
                {/* Botão 1 */}
                <TabsTrigger
                  value="adicionar"
                  className="
                    border 
                    data-[state=active]:bg-[#22C55E]
                    data-[state=active]:text-black
                    data-[state=active]:border-[#22C55E]

                    data-[state=inactive]:bg-transparent
                    data-[state=inactive]:text-[#22C55E]
                    data-[state=inactive]:border-[#22C55E]

                    hover:bg-[#22C55E]
                    hover:text-black
                  "
                >
                  Adicionar Veículo ao Estoque
                </TabsTrigger>

                {/* Botão 2 */}
                <TabsTrigger
                  value="gerenciar"
                  className="
                    border 
                    data-[state=active]:bg-[#22C55E]
                    data-[state=active]:text-black
                    data-[state=active]:border-[#22C55E]

                    data-[state=inactive]:bg-transparent
                    data-[state=inactive]:text-[#22C55E]
                    data-[state=inactive]:border-[#22C55E]

                    hover:bg-[#22C55E]
                    hover:text-black
                  "
                >
                  Veículo vendido ou removido
                </TabsTrigger>
              </TabsList>

              <TabsContent value="adicionar" className="mt-6">
                <AdicionarVeiculoForm />
              </TabsContent>

              <TabsContent value="gerenciar" className="mt-6">
                <ListaVeiculos />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
