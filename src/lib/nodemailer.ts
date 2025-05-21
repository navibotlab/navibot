import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

// Função para mascarar dados sensíveis em logs
const secureLog = (message: string, data?: any) => {
  // Dados originais que não devem ser expostos
  if (!data) {
    console.log(message)
    return
  }

  // Clone para não modificar os dados originais
  const sanitizedData = { ...data }
  
  // Mascarar informações sensíveis
  if (sanitizedData.user) {
    const parts = sanitizedData.user.split('@')
    if (parts.length > 1) {
      const username = parts[0]
      const domain = parts[1]
      sanitizedData.user = `${username.slice(0, 3)}***@${domain}`
    } else {
      sanitizedData.user = sanitizedData.user.slice(0, 3) + '***'
    }
  }
  
  // Remover senha completamente
  delete sanitizedData.pass
  delete sanitizedData.password
  
  console.log(message, sanitizedData)
}

// Definindo as configurações com tipo 'any' para evitar problemas de tipagem
const emailConfig: any = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // false para 587, true apenas para 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Configuração TLS adicional
  tls: {
    // Não falhar em certificados não autorizados
    rejectUnauthorized: false,
    // Forçar o uso do TLSv1.2
    minVersion: 'TLSv1.2'
  }
};

if (!emailConfig.auth.user || !emailConfig.auth.pass || !emailConfig.host) {
  console.warn('Configurações de email incompletas no .env. O envio de email pode falhar.');
}

// Loggar configurações de email para depuração (sem informações sensíveis)
secureLog('Configuração de email:', {
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  user: emailConfig.auth.user
});

export const transporter = nodemailer.createTransport(emailConfig);

// Verificar a conexão com o servidor SMTP
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erro na conexão com servidor de email:', error);
  } else {
    console.log('Servidor de email está pronto para enviar mensagens');
  }
});

export const mailOptions = {
  from: `"${process.env.EMAIL_FROM_NAME || 'Seu Aplicativo'}" <${process.env.EMAIL_FROM || emailConfig.auth.user}>`,
}; 