# 🎭 Advinha - Quem é o Impostor?

Um jogo multiplayer online de dedução social baseado em palavras secretas. 

## 🎮 Como funciona

1. **Crie uma sala** e convide amigos com o link
2. Uma **categoria** e **palavra secreta** são sorteadas
3. Todos recebem a palavra, **exceto o impostor**
4. Durante a **discussão**, descubra quem é o impostor
5. **Vote** em quem você acha que está blefando
6. O impostor ganha se não for descoberto!

## 🚀 Como rodar

### Pré-requisitos

- Node.js 18+
- pnpm 8+

### Instalação

```bash
# Clone o repositório
cd advinha

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm dev
```

O jogo estará disponível em:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

### Comandos disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia cliente e servidor em desenvolvimento |
| `pnpm dev:client` | Inicia apenas o frontend |
| `pnpm dev:server` | Inicia apenas o backend |
| `pnpm build` | Build de produção |
| `pnpm start` | Inicia o servidor em produção |

## 🏗️ Estrutura do Projeto

```
advinha/
├── packages/
│   ├── client/          # Frontend React + Vite
│   │   ├── src/
│   │   │   ├── components/  # Componentes do jogo
│   │   │   ├── pages/       # Páginas (Home, Lobby, Game)
│   │   │   ├── store/       # Estado global (Zustand)
│   │   │   └── styles/      # CSS global
│   │   └── ...
│   ├── server/          # Backend Node.js + Socket.io
│   │   ├── src/
│   │   │   ├── game/        # Lógica do jogo
│   │   │   ├── rooms/       # Gerenciamento de salas
│   │   │   └── socket/      # Handlers WebSocket
│   │   └── ...
│   └── shared/          # Tipos compartilhados
└── data/
    └── categories.json  # Categorias e palavras
```

## 🎯 Funcionalidades

- ✅ Salas privadas com código de convite
- ✅ 16 categorias com 60+ palavras cada
- ✅ Sorteio animado de categoria e palavra
- ✅ Chat em tempo real
- ✅ Modo "Estamos Juntos" (votação presencial)
- ✅ Sistema de pontuação
- ✅ Timer configurável
- ✅ Design dark mode elegante
- ✅ Animações suaves com Framer Motion
- ✅ Mobile-friendly

## 🎨 Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | React, TypeScript, Vite |
| Estilo | CSS puro, Framer Motion |
| Estado | Zustand |
| Backend | Node.js, Express |
| Real-time | Socket.io |
| Monorepo | pnpm workspaces |

## 📊 Sistema de Pontuação

| Ação | Pontos |
|------|--------|
| Votar corretamente no impostor | +100 |
| Sobreviver sem votos (inocente) | +50 |
| Impostor não descoberto | +200 |
| Impostor descoberto (consolação) | +25 |
| Completar partida | +10 |

## 🔧 Configurações de Sala

O host pode configurar:
- **Chat habilitado** - Liga/desliga o chat (Modo "Estamos Juntos")
- **Timer habilitado** - Liga/desliga o timer de discussão
- **Duração do timer** - Tempo para discussão (padrão: 2 minutos)
- **Rodadas por jogo** - Número de rodadas (padrão: 3)

## 📱 Deploy

### Frontend (Vercel, Netlify)

```bash
cd packages/client
pnpm build
# Deploy da pasta dist/
```

### Backend (Render, Railway)

O servidor precisa de um host que suporte WebSockets:

```bash
cd packages/server
pnpm build
pnpm start
```

Configure a variável de ambiente:
- `CLIENT_URL` - URL do frontend (para CORS)

## 🎭 Créditos

Desenvolvido com ❤️ para noites de diversão com amigos.
