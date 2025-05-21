import { transporter, mailOptions } from './nodemailer';
import ForgotPasswordEmail from '@/emails/ForgotPasswordEmail';
import { render } from '@react-email/render';
import VerificationEmail from '@/components/emails/VerificationEmail';
import UserInvitationEmail from '@/components/emails/UserInvitationEmail';
import * as React from 'react';
import { SentMessageInfo } from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

// Função para mascarar dados sensíveis em logs
const secureLog = (message: string, data?: any) => {
  // Dados originais que não devem ser expostos
  if (!data) {
    console.log(message)
    return
  }

  // Clone para não modificar os dados originais
  const sanitizedData = { ...data }
  
  // Mascarar emails
  if (sanitizedData.email) {
    const parts = sanitizedData.email.split('@')
    if (parts.length > 1) {
      const username = parts[0]
      const domain = parts[1]
      sanitizedData.email = `${username.slice(0, 3)}***@${domain}`
    }
  }
  
  // Mascarar destinatário 'to'
  if (sanitizedData.to) {
    const parts = sanitizedData.to.split('@')
    if (parts.length > 1) {
      const username = parts[0]
      const domain = parts[1]
      sanitizedData.to = `${username.slice(0, 3)}***@${domain}`
    }
  }
  
  // Mascarar tokens
  if (sanitizedData.token) {
    sanitizedData.token = sanitizedData.token.slice(0, 5) + '***'
  }
  
  console.log(message, sanitizedData)
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    await transporter.sendMail({
      ...mailOptions, // Inclui o remetente padrão configurado
      to,
      subject,
      html,
    });
    secureLog(`Email enviado com sucesso`, { to });
  } catch (error) {
    console.error(`Erro ao enviar email:`, error);
    // Considere lançar o erro ou retornar um status de falha
    // dependendo de como você quer tratar falhas no envio
    throw new Error('Falha ao enviar email de recuperação de senha.');
  }
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_URL}/recuperar-senha?token=${token}`;
  const emailHtml = await render(ForgotPasswordEmail({ resetLink }));

  await sendEmail({
    to,
    subject: 'Redefina sua senha',
    html: emailHtml,
  });
}

/**
 * Envia um email de verificação para o usuário registrado.
 * 
 * @param {string} email - O endereço de email do destinatário
 * @param {string} token - O token de verificação
 * @param {object} options - Opções adicionais (isInvitation, adminName, etc.)
 * @returns {Promise<{success: boolean, message: string, messageId?: string}>} - Resultado da operação
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  options?: {
    isInvitation?: boolean;
    adminName?: string;
    userName?: string;
    workspaceName?: string;
  }
): Promise<{success: boolean, message: string, messageId?: string}> {
  try {
    // Construindo a URL de verificação
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    
    // Verificar se é um convite ou verificação normal
    const isInvite = options?.isInvitation === true;
    const pathSegment = isInvite ? 'aceitar-convite' : 'verificar-email';
    const verificationUrl = `${baseUrl}/${pathSegment}?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Escolher o template de email apropriado
    let emailTemplate: any;
    
    if (isInvite) {
      // Usar o template de convite
      emailTemplate = React.createElement(UserInvitationEmail, {
        inviteUrl: verificationUrl,
        token,
        email,
        name: options?.userName,
        adminName: options?.adminName,
        workspaceName: options?.workspaceName || 'NaviBot'
      });
    } else {
      // Usar o template de verificação padrão
      emailTemplate = React.createElement(VerificationEmail, {
        verificationUrl,
        token,
        email
      });
    }
    
    // Renderizar o template para HTML
    const emailHtml = await render(emailTemplate);
    
    // Configurar título do email baseado no tipo
    const subject = isInvite 
      ? 'Convite para o Workspace NaviBot' 
      : 'Verifique seu email - NaviBot';
    
    // Configurando os detalhes do email
    const message = {
      from: process.env.EMAIL_FROM || 'noreply@navibot.com',
      to: email,
      subject,
      html: emailHtml
    };
    
    // Enviando o email
    const info: SentMessageInfo = await transporter.sendMail(message);
    
    secureLog(isInvite ? 'Email de convite enviado' : 'Email de verificação enviado', { email, token });
    
    return {
      success: true,
      message: isInvite ? 'Email de convite enviado com sucesso' : 'Email de verificação enviado com sucesso',
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    return {
      success: false,
      message: 'Falha ao enviar email'
    };
  }
}

// Você pode adicionar outras funções de envio de email aqui no futuro
// Ex: sendWelcomeEmail, sendVerificationEmail, etc. 