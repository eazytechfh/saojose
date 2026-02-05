"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser, signOut, CARGO_LABELS } from "@/lib/auth"
import { LayoutDashboard, Settings, LogOut, Menu, X, Shield, Car, Calendar, MessageCircle, Users, Handshake } from "lucide-react"
import Image from "next/image"

const allNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, vendorAccess: false },
  { name: "Negociações", href: "/negociacoes", icon: Users, vendorAccess: true },
  { name: "Agendamentos", href: "/agendamentos", icon: Calendar, vendorAccess: true },
  { name: "Estoque", href: "/estoque", icon: Car, vendorAccess: false },
  { name: "Configurações", href: "/configuracoes", icon: Settings, vendorAccess: false },
]

export function SidebarNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const user = getCurrentUser()

  // Filtrar navegação baseado no cargo do usuário
  const navigation = user?.cargo === "vendedor" 
    ? allNavigation.filter((item) => item.vendorAccess)
    : allNavigation

  const handleSignOut = () => {
    signOut()
    router.push("/")
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-[#020617] text-white border-[#111827] hover:bg-[#0A0A0A]"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 
          bg-black text-white shadow-2xl border-r border-[#111827]
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 bg-black border-b border-[#22C55E]">
            <div className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <Image src="/altuza-logo.png" alt="Altuza Digital Logo" fill className="object-contain" />
              </div>
              <span className="text-xl font-bold text-[#22C55E]">Altuza Digital</span>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-[#111827] bg-[#0A0A0A]">
            <div className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">Código do Cliente</div>
            <div className="text-lg font-mono font-bold text-[#22C55E]">322.598</div>
          </div>

          {user && (
            <div className="p-4 border-b border-[#111827]">
              <div className="text-sm font-medium text-white">{user.nome_usuario}</div>
              <div className="text-xs text-[#9CA3AF]">{user.nome_empresa}</div>
              <div className="mt-2">
                <Badge className="text-xs bg-[#22C55E] text-black hover:bg-[#16A34A]">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {CARGO_LABELS[user.cargo]}
                  </div>
                </Badge>
              </div>
            </div>
          )}

          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  style={isActive ? { backgroundColor: "#22C55E" } : undefined}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${
                      isActive
                        ? "font-semibold"
                        : "hover:bg-[#0A0A0A] hover:border hover:border-[#111827]"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon 
                    className="mr-3 h-5 w-5 flex-shrink-0"
                    stroke={isActive ? "#000" : "#FFF"}
                    style={{ color: isActive ? "#000000" : "#FFFFFF" }}
                    strokeWidth={2}
                  />
                  <span style={{ color: isActive ? "#000000" : "#FFFFFF" }}>
                    {item.name}
                  </span>
                </Link>
              )
            })}

            {user?.cargo !== "vendedor" && (
              <a
                href="https://conexao.eazy.tec.br/login"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-white hover:bg-[#0A0A0A] hover:border hover:border-[#111827]"
                onClick={() => setSidebarOpen(false)}
              >
                <MessageCircle className="mr-3 h-5 w-5 text-white" />
                Conexão Whatsapp
              </a>
            )}
          </nav>

          <div className="p-4 border-t border-[#111827]">
            <Button
              className="w-full justify-start bg-[#22C55E] text-black hover:bg-[#16A34A] font-semibold"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5 text-black" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay background quando abrir no mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </>
  )
}
