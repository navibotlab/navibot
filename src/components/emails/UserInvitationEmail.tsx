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

interface UserInvitationEmailProps {
  inviteUrl: string;
  token: string;
  email: string;
  name?: string;
  adminName?: string;
  workspaceName?: string;
}

export default function UserInvitationEmail({ 
  inviteUrl, 
  token,
  email,
  name = '',
  adminName = '',
  workspaceName = 'NaviBot'
}: UserInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Convite para o Workspace {workspaceName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Você foi convidado para o {workspaceName}</Heading>
          
          <Text style={text}>
            Olá {name || email.split('@')[0]},
          </Text>
          
          <Text style={text}>
            {adminName ? `${adminName} convidou você` : 'Você foi convidado'} para participar do workspace {workspaceName} na plataforma NaviBot.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={inviteUrl}>
              Aceitar Convite
            </Button>
          </Section>

          <Text style={text}>
            Ou copie e cole este link em seu navegador:
          </Text>
          
          <Text style={link}>
            {inviteUrl}
          </Text>

          <Text style={text}>
            Se você não esperava este convite, pode ignorá-lo com segurança.
          </Text>

          <Text style={footer}>
            Atenciosamente,<br />
            Equipe NaviBot
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos para o email
const main = {
  backgroundColor: '#f6f9fc',
  padding: '10px 0',
  fontFamily: 
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '5px',
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  margin: '30px auto',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '5px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 20px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const link = {
  color: '#0070f3',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '30px',
  textAlign: 'center' as const,
}; 