"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard-charts"

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
    }
  }, [router])

  return (
    <div
      className="flex min-h-screen 
      bg-gradient-to-b from-black via-black to-green-900"
    >
      <SidebarNav />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        
        {/* HEADER PRETO */}
        <header className="bg-black border-b border-green-600/40">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-green-400 drop-shadow-[0_0_8px_#00ff7f]">
                  Dashboard Inteligente
                </h1>
                <p className="text-green-200 mt-2 text-lg">
                  Análise completa dos seus leads e performance em tempo real
                </p>
              </div>

              <div className="hidden md:flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-700 shadow-md shadow-green-500/40">
                  <div className="w-8 h-8 bg-green-500/40 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO – FUNDO PRETO (CORRIGIDO) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-black">
          <div className="container mx-auto px-6 py-8 bg-black">
            <div className="mb-12">
              <DashboardStats />
            </div>

            <DashboardCharts />
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-black border-t border-green-700/40 py-4">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between text-sm text-green-300">
              <p>© 2025 Altuza Digital - Plataforma de Leads</p>
              <p>Última atualização: {new Date().toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
