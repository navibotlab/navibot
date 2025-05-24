# 🚀 Deploy na Vercel - AI Agents Platform

## ✅ Configurações Já Feitas:

### Arquivos Criados/Ajustados:
- ✅ `vercel.json` - Configuração específica da Vercel
- ✅ `next.config.js` - Ajustado para compatibilidade com Vercel
- ✅ Configurações de região Brasil (gru1)

## 📋 Checklist Pre-Deploy:

### 1. ✅ Repositório Git
- [x] Código commitado e pushed
- [x] Repositório conectado à Vercel

### 2. 🔧 Variáveis de Ambiente na Vercel

**OBRIGATÓRIAS - Configure no painel da Vercel:**

```env
# Banco de Dados
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Autenticação (MUDE a URL para sua URL da Vercel)
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=f7c9f8c2e3d4b5a6987654321fedcba0123456789abcdef0123456789abcdef0

# URLs da Aplicação (MUDE para sua URL da Vercel)
NEXT_PUBLIC_URL=https://seu-app.vercel.app
NEXT_PUBLIC_BASE_URL=https://seu-app.vercel.app
NEXT_PUBLIC_API_URL=https://seu-app.vercel.app

# WhatsApp
WHATSAPP_CLOUD_VERIFY_TOKEN=navibot

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nfygqpsgfhuvcgicjhbd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email
EMAIL_HOST=mail06.l4email.com
EMAIL_PORT=587
EMAIL_USER=sac@ivannogueira.com.br
EMAIL_PASS=Rafaelamota@2022
EMAIL_FROM=sac@ivannogueira.com.br
EMAIL_FROM_NAME=Navibot
EMAIL_SECURE=false
```

## 🔧 Passos para Deploy:

### 1. **Configure as Variáveis de Ambiente**
1. Acesse o painel da Vercel
2. Vá em Settings > Environment Variables
3. Adicione TODAS as variáveis acima
4. **IMPORTANTE**: Troque as URLs ngrok pela URL da Vercel

### 2. **URL da Vercel**
Após o primeiro deploy, a Vercel gerará uma URL como:
`https://seu-projeto-usuario.vercel.app`

**Atualize essas variáveis com a URL real:**
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_API_URL`

### 3. **Redeploy**
Após atualizar as URLs, faça um redeploy para aplicar as mudanças.

## ⚠️ Problemas Comuns e Soluções:

### **Problema: Build Timeout**
**Solução**: Configurado timeout de 30s nas funções

### **Problema: Banco de Dados**
**Solução**: Você já está usando Prisma Accelerate ✅

### **Problema: NextAuth**
**Solução**: Configure corretamente a `NEXTAUTH_URL` com sua URL da Vercel

### **Problema: APIs Lentas**
**Solução**: Vercel tem limite de 10s para funções no plano gratuito

## 🌟 Otimizações Aplicadas:

- ✅ Região Brasil configurada (gru1)
- ✅ CORS configurado para APIs
- ✅ Timeouts otimizados
- ✅ Build configurado para Vercel
- ✅ Headers de cache configurados

## 🔍 Como Verificar se Funcionou:

1. **Deploy Status**: Verde na Vercel
2. **Página Principal**: Deve carregar sem erros
3. **Login**: Deve funcionar
4. **APIs**: Teste `/api/version`

## 📞 Webhooks do WhatsApp:

Após deploy, configure os webhooks com sua nova URL:
```
Webhook URL: https://seu-app.vercel.app/api/whatsapp-cloud/webhook/[phoneNumberId]
Verify Token: navibot
```

## 🚨 Importante:

1. **Mantenha as chaves do Supabase e banco seguras**
2. **Use HTTPS sempre** (Vercel fornece automaticamente)
3. **Monitore os logs** na Vercel para problemas
4. **Teste todas as funcionalidades** após deploy

## ✅ Status: PRONTO PARA DEPLOY! 🚀 