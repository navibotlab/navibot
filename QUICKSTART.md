# Guia de Implantação Rápida - AI Agents Platform

Este guia fornece instruções para implantar a plataforma AI Agents no seu ambiente existente que já possui PostgreSQL e Nginx configurados.

## Pré-requisitos

- Sistema operacional Linux (Ubuntu/Debian recomendado)
- Node.js v18 ou superior
- PostgreSQL 14 ou superior já instalado
- Nginx já configurado (via aapanel)
- Acesso root ou sudo ao servidor

## Passo 1: Preparação do ambiente

Certifique-se de que o Node.js está instalado na versão correta:

```bash
node -v  # Deve mostrar v18.x.x ou superior
```

Se não estiver instalado ou estiver em uma versão antiga, utilize:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Passo 2: Configuração do banco de dados

Assegure-se de que você tenha as seguintes informações do seu banco de dados PostgreSQL:
- Hostname (geralmente localhost)
- Porta (padrão: 5432)
- Nome do usuário 
- Senha
- Nome do banco de dados

## Passo 3: Implantação da aplicação

1. Clone o repositório ou extraia o arquivo zip no diretório desejado:

```bash
cd /caminho/para/diretorio
git clone <repositorio> ai-agents-platform
cd ai-agents-platform
```

2. Configure o arquivo `.env` com suas variáveis de ambiente:

```bash
cp .env.example .env
nano .env
```

Atualize pelo menos as seguintes variáveis:
- `DATABASE_URL` (formato: `postgresql://usuario:senha@host:porta/nome_banco`)
- `NEXTAUTH_URL` (sua URL base, ex: https://seu-dominio.com)
- `NEXTAUTH_SECRET` (gere com `openssl rand -base64 32`)
- Outras variáveis conforme necessário para integração com serviços externos

3. Execute o script de instalação:

```bash
chmod +x install.sh
./install.sh
```

O script irá:
- Instalar as dependências do projeto
- Gerar o cliente Prisma para o seu banco de dados
- Construir a aplicação para produção
- Configurar o PM2 para gerenciar o aplicativo
- Garantir que o aplicativo inicie automaticamente na reinicialização

## Passo 4: Configuração do Nginx (se necessário ajustar)

Se você já tem o Nginx configurado via aapanel, apenas verifique se está apontando para a porta correta:

1. Crie ou edite o arquivo de configuração virtual host:

```
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. Teste e recarregue o Nginx:

```bash
sudo nginx -t
sudo nginx -s reload
```

## Passo 5: Migração de dados (opcional)

Se você deseja migrar dados de outro sistema para este:

1. No sistema original, execute o script de backup:

```bash
chmod +x backup_database.sh
./backup_database.sh
```

Selecione a opção 1 para criar um backup.

2. Transfira o arquivo de backup para o novo servidor.

3. No novo servidor, execute:

```bash
./backup_database.sh
```

Selecione a opção 2 para restaurar o banco de dados usando o arquivo transferido.

## Verificação da instalação

Para verificar se a aplicação está rodando corretamente:

```bash
pm2 status
```

Você deve ver a aplicação "ai-agents" na lista com status "online".

## Solução de problemas

- **Logs do aplicativo**: `pm2 logs ai-agents`
- **Reiniciar aplicativo**: `pm2 restart ai-agents`
- **Verificar status**: `./status.sh`

## Atualização

Para atualizar a plataforma para uma nova versão:

1. Faça backup do banco de dados usando o script `backup_database.sh`
2. Atualize os arquivos do código fonte (via git pull ou nova extração)
3. Execute novamente o script de instalação: `./install.sh`

## Suporte

Para obter suporte adicional, consulte a documentação completa ou entre em contato com nossa equipe de suporte. 