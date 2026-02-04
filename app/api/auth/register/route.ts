import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome_empresa, nome_usuario, email, telefone, senha, confirmar_senha } = body

    // Validações básicas
    if (!nome_empresa || !nome_usuario || !email || !senha) {
      return NextResponse.json({ error: "Todos os campos obrigatórios devem ser preenchidos." }, { status: 400 })
    }

    if (senha !== confirmar_senha) {
      return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 })
    }

    if (senha.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 })
    }

    const sql = neon(process.env.POSTGRES_URL!)

    // Verificar se o email já existe
    const existingUser = await sql`
      SELECT email FROM "AUTORIZAÇÃO" WHERE LOWER(email) = LOWER(${email})
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado no sistema." }, { status: 400 })
    }

    // Criar novo usuário
    const result = await sql`
      INSERT INTO "AUTORIZAÇÃO" (
        nome_empresa,
        nome_usuario,
        email,
        telefone,
        senha,
        plano,
        status,
        cargo,
        id_empresa,
        created_at
      ) VALUES (
        ${nome_empresa},
        ${nome_usuario},
        ${email},
        ${telefone || null},
        ${senha},
        'gratuito',
        'ativo',
        'gestor',
        1,
        NOW()
      )
      RETURNING id, nome_usuario, email, nome_empresa
    `

    const newUser = result[0]

    // Atualizar id_empresa para o próprio ID do usuário (cada empresa é independente)
    await sql`
      UPDATE "AUTORIZAÇÃO" SET id_empresa = ${newUser.id} WHERE id = ${newUser.id}
    `

    return NextResponse.json(
      {
        success: true,
        message: "Conta criada com sucesso! Você pode fazer login agora.",
        user: {
          id: newUser.id,
          nome_usuario: newUser.nome_usuario,
          email: newUser.email,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: "Erro ao processar solicitação. Tente novamente." }, { status: 500 })
  }
}
