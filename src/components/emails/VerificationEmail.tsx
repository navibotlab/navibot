import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface VerificationEmailProps {
  verificationUrl: string;
  token: string;
  email: string;
}

export default function VerificationEmail({ 
  verificationUrl, 
  token,
  email 
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verifique seu email para ativar sua conta</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verifique seu endereço de email</Heading>
          
          <Text style={text}>
            Olá,
          </Text>
          
          <Text style={text}>
            Obrigado por criar uma conta. Para completar seu cadastro, por favor verifique seu email clicando no botão abaixo.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verificar Email
            </Button>
          </Section>

          <Text style={text}>
            Ou copie e cole este link em seu navegador:
          </Text>
          
          <Text style={link}>
            {verificationUrl}
          </Text>

          <Text style={text}>
            Caso prefira, também pode inserir o código de verificação manualmente:
          </Text>
          
          <Text style={tokenStyle}>
            {token}
          </Text>

          <Text style={text}>
            Se você não solicitou este email, pode ignorá-lo com segurança.
          </Text>

          <Text style={footer}>
            Atenciosamente,<br />
            Equipe Navibot
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '32px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const tokenStyle = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '16px 0',
  textAlign: 'center' as const,
  letterSpacing: '0.5em',
  padding: '16px',
  backgroundColor: '#f3f4f6',
  borderRadius: '4px',
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 16px',
};

const link = {
  color: '#3b82f6',
  fontSize: '14px',
  textDecoration: 'underline',
  margin: '16px 0 32px',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: '32px 0 0',
}; 