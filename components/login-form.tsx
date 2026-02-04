"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signIn } from "@/lib/auth"
import { Loader2, AlertCircle } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [registerNomeEmpresa, setRegisterNomeEmpresa] = useState("")
  const [registerNomeUsuario, setRegisterNomeUsuario] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerTelefone, setRegisterTelefone] = useState("")
  const [registerSenha, setRegisterSenha] = useState("")
  const [registerConfirmSenha, setRegisterConfirmSenha] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState("")
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const user = await signIn(email, senha)

      if (user) {
        router.push("/dashboard")
      } else {
        setError("Credenciais inválidas ou usuário não está ativo.")
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterLoading(true)
    setRegisterError("")
    setRegisterSuccess(false)

    const senhaLimpa = registerSenha.trim()
    const confirmSenhaLimpa = registerConfirmSenha.trim()

    // Validações
    if (senhaLimpa !== confirmSenhaLimpa) {
      setRegisterError("As senhas não coincidem.")
      setRegisterLoading(false)
      return
    }

    if (senhaLimpa.length < 6) {
      setRegisterError("A senha deve ter pelo menos 6 caracteres.")
      setRegisterLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome_empresa: registerNomeEmpresa,
          nome_usuario: registerNomeUsuario,
          email: registerEmail,
          telefone: registerTelefone,
          senha: senhaLimpa,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setRegisterSuccess(true)
        // Limpar formulário
        setRegisterNomeEmpresa("")
        setRegisterNomeUsuario("")
        setRegisterEmail("")
        setRegisterTelefone("")
        setRegisterSenha("")
        setRegisterConfirmSenha("")

        // Após 2 segundos, redirecionar para o login
        setTimeout(() => {
          setEmail(registerEmail)
        }, 2000)
      } else {
        setRegisterError(result.error || "Erro ao criar conta. Tente novamente.")
      }
    } catch (err) {
      setRegisterError("Erro ao criar conta. Tente novamente.")
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center 
      bg-black p-4"
    >
      <Card className="w-full max-w-md shadow-2xl border-2 border-green-500/30 bg-[#0F172A]">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Image 
              src="/altuza-logo-horizontal.png" 
              alt="Altuza Digital Logo" 
              width={280} 
              height={80} 
              className="object-contain"
              priority
            />
          </div>

          <CardTitle className="text-xl text-green-500">Plataforma de Gestão de Leads</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#1E293B]">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-[#0F172A] text-gray-400"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-[#0F172A] text-gray-400"
              >
                Registro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <CardDescription className="text-gray-400 text-center mb-4">
                Faça login para acessar sua plataforma
              </CardDescription>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-green-500 focus:border-green-500 focus:ring-green-500 bg-[#0F172A] text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-gray-300">
                    Senha
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="border-green-500 focus:border-green-500 focus:ring-green-500 bg-[#0F172A] text-white placeholder:text-gray-500"
                  />
                </div>

                {error && (
                  <Alert className="border-red-500/50 bg-red-950/50">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-[#0F172A] font-semibold py-2.5"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <CardDescription className="text-gray-400 text-center mb-4">Crie sua conta para começar</CardDescription>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-empresa" className="text-gray-300">
                    Nome da Empresa
                  </Label>
                  <Input
                    id="register-empresa"
                    type="text"
                    placeholder="Sua Empresa Ltda"
                    value={registerNomeEmpresa}
                    onChange={(e) => setRegisterNomeEmpresa(e.target.value)}
                    required
                    className="border-green-500 focus:border-green-500 focus:ring-green-500 bg-[#0F172A] text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-nome" className="text-gray-300">
                    Seu Nome
                  </Label>
                  <Input
                    id="register-nome"
                    type="text"
                    placeholder="João Silva"
                    value={registerNomeUsuario}
                    onChange={(e) => setRegisterNomeUsuario(e.target.value)}
                    required
                    className="border-green-500 focus:border-green-500 focus:ring-green-500 bg-[#0F172A] text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-gray-300">
                    E-mail
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="border-green-500 focus:border-green-500 focus:ring-green-500 bg-[#0F172A] text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-telefone" className="text-gray-300">
                    Telefone (opcional)
                  </Label>
                  <Input
                    id="register-telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={registerTelefone}
                    onChange={(e) => setRegisterTelefone(e.target.value)}
                    className="border-green-500 focus:border-green-500 focus:ring-green-500 bg-[#0F172A] text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-senha" className="text-gray-300">
                    Senha
                  </Label>
                  <Input
                    id="register-senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerSenha}
                    onChange={(e) => {
                      setRegisterSenha(e.target.value)
                      if (registerError) setRegisterError("")
                    }}
                    required
                    className="border-green-500 focus:border-green-500 focus:ring-green-500 bg-[#0F172A] text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-senha" className="text-gray-300">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="register-confirm-senha"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={registerConfirmSenha}
                    onChange={(e) => {
                      setRegisterConfirmSenha(e.target.value)
                      if (registerError) setRegisterError("")
                    }}
                    required
                    className="border-green-500 focus:border-green-500 focus:ring-green-500 bg-[#0F172A] text-white placeholder:text-gray-500"
                  />
                </div>

                {registerError && (
                  <Alert className="border-red-500/50 bg-red-950/50">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">{registerError}</AlertDescription>
                  </Alert>
                )}

                {registerSuccess && (
                  <Alert className="border-green-500/50 bg-green-950/50">
                    <AlertDescription className="text-green-300">
                      Conta criada com sucesso! Use a aba Login para acessar.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-[#0F172A] font-semibold py-2.5"
                  disabled={registerLoading || registerSuccess}
                >
                  {registerLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
