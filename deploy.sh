#!/bin/bash

# Script de Deploy para Produção - AI Agents Platform
# Este script deve ser executado em ambiente Linux

set -e

echo "🚀 Iniciando deploy da AI Agents Platform..."

# Verificar se está em ambiente Linux
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "❌ ERRO: Este script deve ser executado em ambiente Linux/Unix"
    echo "   O build no Windows falha devido a problemas de permissão"
    echo "   Use WSL, Docker ou um servidor Linux"
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "   Crie um arquivo .env baseado no exemplo:"
    echo "   cp .env.example .env"
    echo "   E configure as variáveis necessárias"
    exit 1
fi

# Verificar variáveis críticas
echo "🔍 Verificando variáveis de ambiente críticas..."
source .env

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não configurada no .env"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET não configurada no .env"
    echo "   Gere uma com: openssl rand -base64 32"
    exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ NEXTAUTH_URL não configurada no .env"
    exit 1
fi

echo "✅ Variáveis de ambiente verificadas"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Gerar cliente Prisma
echo "🗄️ Gerando cliente Prisma..."
npx prisma generate

# Executar migrations (opcional - descomente se necessário)
# echo "🔄 Executando migrations do banco..."
# npx prisma migrate deploy

# Build da aplicação
echo "🏗️ Fazendo build da aplicação..."
export SKIP_DB_CHECK=true
npm run build

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Parar aplicação se estiver rodando
echo "🛑 Parando aplicação anterior..."
pm2 stop nexusai 2>/dev/null || true
pm2 delete nexusai 2>/dev/null || true

# Iniciar aplicação
echo "🚀 Iniciando aplicação..."
pm2 start ecosystem.config.js

# Salvar configuração PM2
echo "💾 Salvando configuração PM2..."
pm2 save

# Configurar PM2 para iniciar no boot
echo "🔄 Configurando PM2 para iniciar no boot..."
pm2 startup

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📊 Status da aplicação:"
pm2 status

echo ""
echo "🔗 Comandos úteis:"
echo "   pm2 logs nexusai    # Ver logs"
echo "   pm2 restart nexusai # Reiniciar"
echo "   pm2 monit          # Monitor em tempo real"
echo ""
echo "🌐 Aplicação rodando em: http://localhost:3000"
echo "   Configure seu proxy/nginx para apontar para esta porta" 