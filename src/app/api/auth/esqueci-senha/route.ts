import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { sendPasswordResetEmail } from '@/lib/emailService'
import { prisma } from '@/lib/prisma'

const SALT_ROUNDS = 10 // Fator de custo para o hash bcrypt
const TOKEN_EXPIRATION_MINUTES = 30

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // 1. Verificar se o usuário existe
    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      // Resposta genérica por segurança
      console.log(`Tentativa de recuperação para email não existente: ${email}`)
      return NextResponse.json({ message: 'Se um usuário com este email existir, um link de recuperação será enviado.' })
    }

    // 2. Gerar token seguro e único
    const resetToken = crypto.randomBytes(32).toString('hex')
    // 3. Fazer o hash do token para armazenamento
    const hashedToken = await bcrypt.hash(resetToken, SALT_ROUNDS)
    // 4. Calcular data de expiração (30 minutos a partir de agora)
    const expires = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000)

    // 5. Armazenar o HASH do token na tabela PasswordResetToken
    //    Remover tokens antigos para o mesmo email antes de criar um novo
    try {
      // Verificar se a tabela existe
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id VARCHAR(25) PRIMARY KEY,
          email TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires TIMESTAMP NOT NULL
        )
      `);

      // Remover tokens antigos
      await prisma.$executeRawUnsafe(`
        DELETE FROM password_reset_tokens WHERE email = $1
      `, user.email);

      // Inserir novo token
      await prisma.$executeRawUnsafe(`
        INSERT INTO password_reset_tokens (id, email, token, expires)
        VALUES ($1, $2, $3, $4)
      `, crypto.randomUUID().substring(0, 24), user.email, hashedToken, expires);

      console.log(`Token de recuperação gerado para ${email}`);
    } catch (dbError) {
      console.error('Erro ao manipular token de recuperação:', dbError);
      throw dbError;
    }

    // 6. Enviar email com o TOKEN ORIGINAL (não o hash)
    try {
      await sendPasswordResetEmail(user.email, resetToken)
      console.log(`Email de recuperação enviado para ${email}`)
    } catch (emailError) {
      console.error(`Falha ao enviar email de recuperação para ${email}:`, emailError)
      // Mesmo se o email falhar, retornamos sucesso para não expor informações
    }

    // 7. Retornar resposta genérica
    return NextResponse.json({ message: 'Se um usuário com este email existir, um link de recuperação será enviado.' })
  } catch (error) {
    console.error('Erro no processo de esqueci-senha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor ao processar a solicitação.' }, { status: 500 })
  }
} 