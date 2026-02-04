"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Building, CreditCard, Users, Shield, Lock } from "lucide-react"
import { EditProfileForm } from "@/components/edit-profile-form"
import { AddMemberForm } from "@/components/add-member-form"
import { MembersManagement } from "@/components/members-management"
import { getCompanyMembers, STATUS_LABELS, CARGO_LABELS, canManageMembers } from "@/lib/auth"

export default function Configuracoes() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [companyMembers, setCompanyMembers] = useState<any[]>([])
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
    } else {
      setUser(currentUser)
      loadCompanyMembers(currentUser.id_empresa)
    }
  }, [router])

  const loadCompanyMembers = async (idEmpresa: number) => {
    setLoadingMembers(true)
    const members = await getCompanyMembers(idEmpresa)
    setCompanyMembers(members)
    setLoadingMembers(false)
  }

  const handleProfileUpdate = () => {
    const updatedUser = getCurrentUser()
    if (updatedUser) {
      setUser(updatedUser)
    }
    setIsEditingProfile(false)
  }

  const handleMembersUpdate = () => {
    if (user) {
      loadCompanyMembers(user.id_empresa)
    }
  }

  if (!user) return null

  const activeMembers = companyMembers.filter((m) => m.status === "ativo")
  const adminMembers = companyMembers.filter((m) => m.cargo === "administrador")
  const isUserAdmin = canManageMembers(user)

  return (
    <div className="flex h-screen bg-black">
      <SidebarNav />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/*=====================  TEMA NEON VERDE  =====================*/}
        <style>{`
          /* Fundo geral preto */
          body, main, div, section, .container, .flex-1 {
            background-color: #000 !important;
          }

          /* Textos brancos */
          h1, h2, h3, h4, h5, h6,
          p, span, label, strong,
          .text-gray-600, .text-gray-900,
          .text-muted-foreground {
            color: #FFF !important;
          }

          /* Cards pretos */
          .card,
          .bg-white,
          .bg-gray-50,
          .bg-gray-100 {
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

          /* Botões verde neon */
          button {
            background-color: #22C55E !important;
            color: #FFF !important;
            border: 1px solid #22C55E !important;
          }
          button:hover {
            background-color: #22C55E !important;
            color: #FFF !important;
          }

          /* Badges (Ativo, Premium, Cargo) */
          .badge, .status-badge {
            background-color: #22C55E !important;
            color: #FFF !important;
            border: 1px solid #22C55E !important;
          }

          /* Caixinhas de números no Gerenciar Membros */
          .members-box {
            background-color: #000 !important;
            border: 1px solid #22C55E !important;
          }
          .members-box .value-green {
            color: #22C55E !important;
          }

          /* Alertas */
          .alert-dark-green {
            background-color: #000 !important;
            border: 1px solid #22C55E !important;
            color: #FFF !important;
          }

          /* Texto da lista de membros */
          .members-management * {
            color: #FFF !important;
          }

          /* Sidebar — item ativo (Configurações) EXACT igual ao de Estoque */
          .sidebar nav a[aria-current="page"],
          .sidebar nav a.active,
          .sidebar a[data-active="true"],
          .sidebar a.active {
            background-color: #22C55E !important;
            color: #000 !important;
            border-radius: 6px !important;
          }

          .sidebar nav a[aria-current="page"] svg,
          .sidebar a.active svg {
            color: #000 !important;
            stroke: #000 !important;
          }
        `}</style>

        {/*=====================  CONTEÚDO  =====================*/}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-black">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Configurações</h1>
              <p className="text-gray-600">Gerencie sua conta e preferências</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/*----------------------  CARD: PESSOAIS  ----------------------*/}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {isEditingProfile ? (
                    <EditProfileForm
                      user={user}
                      onCancel={() => setIsEditingProfile(false)}
                      onSuccess={handleProfileUpdate}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Nome</Label>
                        <Input value={user.nome_usuario} readOnly />
                      </div>

                      <div>
                        <Label>E-mail</Label>
                        <Input value={user.email} readOnly />
                      </div>

                      <div>
                        <Label>Telefone</Label>
                        <Input value={user.telefone || ""} readOnly />
                      </div>

                      <div>
                        <Label>Cargo</Label>
                        <div className="mt-1">
                          <Badge className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {CARGO_LABELS[user.cargo]}
                          </Badge>
                        </div>
                      </div>

                      <Button className="w-full" onClick={() => setIsEditingProfile(true)}>
                        Editar Perfil
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/*----------------------  CARD: EMPRESA  ----------------------*/}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Informações da Empresa
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <Label>Nome da Empresa</Label>
                    <Input value={user.nome_empresa} readOnly />
                  </div>

                  <div>
                    <Label>ID da Empresa</Label>
                    <Input value={user.id_empresa.toString()} readOnly />
                  </div>

                  <div>
                    <Label>Status da Conta</Label>
                    <Badge className="mt-1">{STATUS_LABELS[user.status]}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/*----------------------  CARD: PLANO  ----------------------*/}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Plano Atual
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <Label>Plano</Label>
                    <Badge className="text-sm mt-1">{user.plano.charAt(0).toUpperCase() + user.plano.slice(1)}</Badge>
                  </div>

                  <div className="text-sm">
                    <p>• Membros ilimitados</p>
                    <p>• Dashboard completo</p>
                    <p>• Kanban de leads</p>
                    <p>• Relatórios básicos</p>
                  </div>

                  <Button className="w-full" disabled>
                    Upgrade de Plano (Em breve)
                  </Button>
                </CardContent>
              </Card>

              {/*----------------------  CARD: GERENCIAR MEMBROS  ----------------------*/}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Gerenciar Membros
                      {!isUserAdmin && <Lock className="h-4 w-4 text-gray-400" />}
                    </CardTitle>

                    {isUserAdmin && (
                      <Button size="sm" onClick={() => setIsAddingMember(true)}>
                        Adicionar Membro
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Caixas de métrica */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="members-box p-3 rounded-lg">
                      <p className="text-sm font-medium">Total de Membros</p>
                      <p className="text-2xl font-bold value-green">{companyMembers.length}</p>
                    </div>

                    <div className="members-box p-3 rounded-lg">
                      <p className="text-sm font-medium">Membros Ativos</p>
                      <p className="text-2xl font-bold value-green">{activeMembers.length}</p>
                    </div>

                    <div className="members-box p-3 rounded-lg">
                      <p className="text-sm font-medium">Administradores</p>
                      <p className="text-2xl font-bold value-green">{adminMembers.length}</p>
                    </div>
                  </div>

                  {/* Alerta */}
                  {!isUserAdmin && (
                    <Alert className="alert-dark-green">
                      <Lock className="h-4 w-4 text-[#22C55E]" />
                      <AlertDescription>Apenas administradores podem gerenciar membros.</AlertDescription>
                    </Alert>
                  )}

                  {/* Lista de membros */}
                  {loadingMembers ? (
                    <>
                      <div className="h-20 bg-black border border-[#22C55E] rounded animate-pulse opacity-40" />
                      <div className="h-20 bg-black border border-[#22C55E] rounded animate-pulse opacity-40" />
                    </>
                  ) : (
                    <div className="members-management">
                      <MembersManagement
                        members={companyMembers}
                        currentUser={user}
                        onMembersUpdate={handleMembersUpdate}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {isAddingMember && (
        <AddMemberForm
          isOpen={isAddingMember}
          onClose={() => setIsAddingMember(false)}
          onSuccess={handleMembersUpdate}
          currentUser={user}
        />
      )}
    </div>
  )
}
