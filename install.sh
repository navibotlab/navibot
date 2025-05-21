#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis de configuração
CURRENT_DATE=$(date +"%Y-%m-%d %H:%M:%S")
BACKUP_DIR="./backups"

# Função para verificar a versão do Node.js
check_node_version() {
  NODE_VERSION=$(node -v | cut -d 'v' -f2)
  REQUIRED_VERSION="18.0.0"
  
  if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}❌ Node.js $NODE_VERSION encontrado, mas a versão mínima requerida é $REQUIRED_VERSION${NC}"
    echo -e "${YELLOW}Recomendamos usar o NVM para instalar a versão correta do Node.js:${NC}"
    echo -e "${BLUE}curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash${NC}"
    echo -e "${BLUE}nvm install 18${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Node.js $NODE_VERSION instalado (versão compatível).${NC}"
}

# Função para verificar se o PM2 está instalado
check_pm2_installed() {
  if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 não está instalado.${NC}"
    echo -e "${YELLOW}Instalando PM2 globalmente...${NC}"
    npm install -g pm2
    if [ $? -ne 0 ]; then
      echo -e "${RED}❌ Falha ao instalar PM2. Por favor, instale manualmente com:${NC}"
      echo -e "${BLUE}npm install -g pm2${NC}"
      exit 1
    fi
    echo -e "${GREEN}✅ PM2 instalado com sucesso.${NC}"
  else
    echo -e "${GREEN}✅ PM2 já está instalado.${NC}"
  fi
}

# Função para fazer backup do banco de dados
backup_database() {
  echo -e "${BLUE}${CURRENT_DATE} - 💾 Realizando backup do banco de dados...${NC}"
  
  # Criar diretório de backup se não existir
  mkdir -p "$BACKUP_DIR"
  
  # Extrair informações de conexão do arquivo .env
  if [ -f .env ]; then
    # Usar grep para extrair a URL do banco de dados do arquivo .env
    DB_URL=$(grep -oP 'DATABASE_URL="\K[^"]+' .env)
    
    if [ -n "$DB_URL" ]; then
      # Extrair componentes da URL
      DB_USER=$(echo $DB_URL | sed -n 's/^postgresql:\/\/\([^:]*\):.*/\1/p')
      DB_PASSWORD=$(echo $DB_URL | sed -n 's/^postgresql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
      DB_HOST=$(echo $DB_URL | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@\([^:]*\):.*/\1/p')
      DB_PORT=$(echo $DB_URL | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@[^:]*:\([0-9]*\)\/.*/\1/p')
      DB_NAME=$(echo $DB_URL | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@[^:]*:[0-9]*\/\([^?]*\).*/\1/p')
      
      # Data formatada para o nome do arquivo de backup
      BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
      BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${BACKUP_DATE}.sql"
      
      # Verificar se pg_dump está disponível
      if command -v pg_dump &> /dev/null; then
        # Executar o backup
        PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
          echo -e "${GREEN}✅ Backup concluído com sucesso: $BACKUP_FILE${NC}"
        else
          echo -e "${YELLOW}⚠️ Não foi possível criar o backup. Continuando a instalação...${NC}"
        fi
      else
        echo -e "${YELLOW}⚠️ pg_dump não encontrado. Não foi possível criar backup.${NC}"
        echo -e "${YELLOW}⚠️ Continuando a instalação sem backup...${NC}"
      fi
    else
      echo -e "${YELLOW}⚠️ Não foi possível extrair informações do banco de dados do arquivo .env${NC}"
      echo -e "${YELLOW}⚠️ Continuando a instalação sem backup...${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️ Arquivo .env não encontrado. Não é possível fazer backup.${NC}"
    echo -e "${YELLOW}⚠️ Continuando a instalação sem backup...${NC}"
  fi
}

# Inicio da instalação
echo -e "${GREEN}${CURRENT_DATE} - 🚀 Iniciando instalação do Navibot Platform...${NC}"

# Verificar a versão do Node.js
check_node_version

# Verificar se o PM2 está instalado
check_pm2_installed

# Configurar variáveis de ambiente
echo -e "${BLUE}${CURRENT_DATE} - ⚙️ Configurando variáveis de ambiente...${NC}"

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️ Arquivo .env não encontrado. Certifique-se de criar um com as configurações corretas.${NC}"
  exit 1
fi

# Fazer backup do banco de dados antes de aplicar mudanças
backup_database

# Instalar dependências
echo -e "${BLUE}${CURRENT_DATE} - 📦 Instalando dependências...${NC}"
npm install --production

# Gerar o Prisma Client
echo -e "${BLUE}${CURRENT_DATE} - 🔄 Gerando Prisma Client...${NC}"
npx prisma generate

# Verificar e criar o banco de dados se necessário
echo -e "${BLUE}${CURRENT_DATE} - 🗃️ Preparando banco de dados...${NC}"
npx prisma db push

# Verificar se existe o diretório .next pré-compilado
if [ -d ".next" ]; then
  echo -e "${BLUE}${CURRENT_DATE} - 🛠️ Usando versão pré-compilada da aplicação...${NC}"
  echo -e "${GREEN}${CURRENT_DATE} - ✅ Diretório .next encontrado!${NC}"
else
  echo -e "${RED}${CURRENT_DATE} - ❌ Diretório .next não encontrado!${NC}"
  echo -e "${YELLOW}${CURRENT_DATE} - ⚠️ A aplicação não pode ser iniciada sem uma build.${NC}"
  exit 1
fi

# Verificar a versão do Node.js novamente antes de configurar o PM2
check_node_version

# Configurar PM2
echo -e "${BLUE}${CURRENT_DATE} - ⚙️ Configurando PM2...${NC}"

# Remover configuração anterior do PM2, se existir
echo -e "${BLUE}${CURRENT_DATE} - 🔄 Removendo configuração antiga do PM2...${NC}"
pm2 delete navibot 2>/dev/null || true

# Limpar caches
echo -e "${BLUE}${CURRENT_DATE} - 🧹 Iniciando limpeza de caches...${NC}"

# Limpar cache do Next.js
echo -e "${BLUE}${CURRENT_DATE} - 🧹 Limpando cache do Next.js...${NC}"
rm -rf .next/cache/* 2>/dev/null || true

# Limpar arquivos temporários
echo -e "${BLUE}${CURRENT_DATE} - 🧹 Limpando arquivos temporários...${NC}"
rm -rf /tmp/nextjs* 2>/dev/null || true
rm -rf /tmp/*.log 2>/dev/null || true

echo -e "${GREEN}${CURRENT_DATE} - ✅ Limpeza de caches concluída!${NC}"

# Iniciar a aplicação com PM2
echo -e "${BLUE}${CURRENT_DATE} - ▶️ Iniciando aplicação com PM2...${NC}"
pm2 start npm --name "navibot" -- start
pm2 save

# Finalização da instalação
echo -e "${GREEN}${CURRENT_DATE} - ✅ Instalação concluída com sucesso!${NC}"
echo -e "${GREEN}${CURRENT_DATE} - 🌐 Acesse sua aplicação em: https://app.navibot.com.br/${NC}"