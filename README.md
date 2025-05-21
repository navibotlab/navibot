# Navibot Platform

![Navibot Platform](docs/images/logo.png)

## Sobre

O Navibot Platform é uma solução completa para gerenciar agentes de IA, permitindo a integração com diversos canais de comunicação, como WhatsApp. A plataforma oferece uma interface amigável para configurar e gerenciar seus agentes de IA.

## Sobre o Projeto

O Navibot Platform é uma solução completa para gerenciar agentes de IA, permitindo a integração com diversos canais de comunicação, como WhatsApp. A plataforma oferece uma interface amigável para configurar e monitorar seus agentes de IA.

### Principais Funcionalidades

- Criação e gerenciamento de agentes de IA personalizados
- Integração com canais de comunicação (WhatsApp Cloud API, Z-API)
- Gerenciamento de arquivos e armazenamento de vetores
- Configuração de campos de contato personalizados
- Visualização de métricas e conversas

## Requisitos

- Node.js v16 ou superior
- npm v7 ou superior
- PostgreSQL 12 ou superior
- Conta na OpenAI e chave de API
- Conta no Supabase (opcional, para armazenamento de arquivos)

## Instalação Rápida

### Linux/macOS

```bash
chmod +x install.sh
./install.sh
```

### Windows

```bash
install.bat
```

O script de instalação irá guiá-lo através do processo de configuração, incluindo a criação do arquivo `.env` com as variáveis de ambiente necessárias.

## Execução

### Modo de Desenvolvimento

```bash
npm run dev
```

### Modo de Produção

```bash
npm run build
npm start
```

## Documentação

Para acessar a documentação completa, abra o arquivo `docs/index.html` no seu navegador após a instalação.

## Licença

Este projeto é licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.

## Suporte

Para obter suporte, entre em contato conosco através do Discord ou abra uma issue no GitHub.
