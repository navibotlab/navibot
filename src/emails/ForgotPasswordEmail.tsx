import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ForgotPasswordEmailProps {
  resetLink?: string;
}

export const ForgotPasswordEmail = ({ resetLink = 'https://exemplo.com' }: ForgotPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Redefina sua senha</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Redefina Sua Senha</Heading>
        <Section style={section}>
          <Text style={text}>
            Olá,
          </Text>
          <Text style={text}>
            Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. Este link expirará em 30 minutos.
          </Text>
          <Button style={button} href={resetLink}>
            Redefinir Senha
          </Button>
          <Text style={text}>
            Se você não solicitou uma redefinição de senha, pode ignorar este email com segurança.
          </Text>
          <Text style={text}>
            Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:
          </Text>
          <Link href={resetLink} style={link}>
            {resetLink}
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ForgotPasswordEmail;

// Estilos
const main = {
  backgroundColor: '#f6f9fc',
  padding: '10px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  padding: '45px',
  margin: '40px auto',
  width: '465px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
};

const section = {
  padding: '24px',
  border: 'solid 1px #dedede',
  borderRadius: '5px',
  textAlign: 'center' as const,
};

const text = {
  margin: '0 0 15px 0',
  textAlign: 'left' as const,
  color: '#5F5F5F',
  fontSize: '14px',
  lineHeight: '1.6',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
  margin: '20px 0',
};

const link = {
  color: '#007bff',
  fontSize: '12px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  display: 'block',
  marginTop: '10px',
  backgroundColor: '#e9ecef', // Fundo destacado para o link
  padding: '5px 10px',
  borderRadius: '3px',
}; 