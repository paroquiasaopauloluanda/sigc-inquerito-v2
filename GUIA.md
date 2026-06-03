# SIGC — Inquérito Digital de Avaliação da Catequese
## Guia completo de instalação e utilização

---

## O que é este sistema?

Uma aplicação web completa com:
- **Inquérito para catequizandos** — acessível por QR Code, anónimo, responsivo para telemóvel
- **Painel de administração** — estatísticas, gráficos, respostas abertas, exportação CSV
- **Base de dados gratuita** — Google Sheets (sem servidor próprio)
- **Hospedagem gratuita** — Netlify

---

## Passo 1 — Configurar a base de dados (Google Sheets)

### 1.1 Criar o ficheiro Google Sheets

1. Vai a [sheets.google.com](https://sheets.google.com) e cria uma nova folha de cálculo
2. Dá-lhe o nome: **"SIGC — Respostas Inquérito"**

### 1.2 Criar o Apps Script

1. No Google Sheets, vai ao menu **Extensões → Apps Script**
2. Apaga todo o código que aparecer no editor
3. Copia o conteúdo do ficheiro `google-apps-script.js` e cola no editor
4. Clica em **Guardar** (ícone de disquete)
5. Clica em **Implementar → Nova implementação**
6. Em "Seleccionar tipo", escolhe **Aplicação Web**
7. Preenche:
   - Descrição: `SIGC Inquérito`
   - Executar como: **Eu (o meu e-mail)**
   - Quem tem acesso: **Qualquer pessoa** ⚠️ (obrigatório para receber respostas)
8. Clica em **Implementar**
9. **Copia o URL** que aparece — começa com `https://script.google.com/macros/s/...`
   Este é o teu `VITE_APPS_SCRIPT_URL`

---

## Passo 2 — Configurar o projeto

### 2.1 Instalar o Node.js

Descarrega e instala o [Node.js](https://nodejs.org) (versão 18 ou superior)

### 2.2 Configurar as variáveis de ambiente

1. Na pasta do projecto, copia o ficheiro `.env.example` e renomeia para `.env`
2. Preenche os valores:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID_AQUI/exec
VITE_ADMIN_PASSWORD=umasenhasegura123
VITE_NOME_CENTRO=Centro de Catequese — Luanda
VITE_ANO_CATEQUETICO=2024/2025
```

### 2.3 Instalar dependências e fazer build

Abre um terminal na pasta do projecto e corre:

```bash
npm install
npm run build
```

---

## Passo 3 — Publicar no Netlify (gratuito)

### Opção A — Arrastar e largar (mais simples, 2 minutos)

1. Vai a [netlify.com](https://netlify.com) e cria uma conta gratuita
2. No painel, clica em **"Add new site → Deploy manually"**
3. Arrasta a pasta `dist` (criada pelo `npm run build`) para a área indicada
4. O Netlify publica e dá-te um URL como `https://nome-aleatorio.netlify.app`

### Opção B — Via GitHub (recomendado para actualizações fáceis)

1. Cria uma conta no [GitHub](https://github.com) se não tiveres
2. Cria um repositório novo e faz push da pasta do projecto:
```bash
git init
git add .
git commit -m "Inquérito SIGC inicial"
git remote add origin https://github.com/SEU_UTILIZADOR/sigc-inquerito.git
git push -u origin main
```
3. No Netlify, clica em **"Add new site → Import an existing project"**
4. Conecta ao GitHub e selecciona o repositório
5. Configurações de build:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Em **Environment variables**, adiciona as 4 variáveis do `.env`
7. Clica em **Deploy**

### Personalizar o URL (opcional, gratuito)

No Netlify, vai a **Domain settings → Options → Edit site name** e escolhe um nome como `inquerito-catequese-luanda`
O URL fica: `https://inquerito-catequese-luanda.netlify.app`

---

## Passo 4 — Gerar e imprimir o QR Code

1. Acede ao teu site em `/qr` — ex: `https://inquerito-catequese-luanda.netlify.app/qr`
2. Escolhe o tamanho do QR Code (Pequeno / Médio / Grande)
3. Clica em **Imprimir QR Code**
4. Imprime e coloca no centro, ou partilha digitalmente via WhatsApp/Telegram

---

## Passo 5 — Aceder ao painel de administração

1. Acede a `https://o-teu-site.netlify.app/admin`
2. Introduz a senha que definiste em `VITE_ADMIN_PASSWORD`
3. Tens acesso a:
   - **Visão geral** — radar das médias, barras dos catequistas, distribuições
   - **Por etapa** — gráfico de barras por etapa, pizza de faixas etárias
   - **Respostas abertas** — todas as respostas de texto livre, por tema
   - **Exportar CSV** — ficheiro Excel-compatível com todas as respostas

---

## Como funciona a privacidade e anti-duplicação?

- **Nenhum dado pessoal é recolhido** — não há nome, telemóvel, e-mail, sala ou qualquer identificador visível
- Quando um catequizando abre o inquérito pela primeira vez, o browser gera automaticamente um código aleatório único (`device_id`) e guarda-o silenciosamente no browser
- Este código é enviado com a resposta e registado no Google Sheets (folha "Dispositivos")
- Se a mesma pessoa tentar preencher novamente, o sistema detecta o código e mostra uma mensagem de agradecimento — sem revelar o mecanismo
- O catequizando não tem qualquer suspeita de estar a ser identificado

---

## Estrutura do inquérito (18 perguntas)

| Secção | Perguntas | Tipo |
|--------|-----------|------|
| Identificação | Etapa + faixa etária | Selecção |
| 1 — A catequese | Satisfação geral, duração, frequência, conteúdos, materiais, pontualidade + comentário | Estrelas + opções + texto |
| 2 — Os catequistas | Clareza, disponibilidade, relação, preparação + comentário | Estrelas + texto |
| 3 — Actividades | Orações, actividades práticas, partilha, retiros + sugestão | Opções + estrelas + texto |
| 4 — Expectativas | Expectativas vs realidade | Texto livre (obrigatório) |
| 5 — Sugestões | Acrescentar, remover, melhorar | Texto livre (opcional) |

---

## Suporte e actualizações

Para gerar um relatório com análise IA das respostas:
1. Exporta o CSV do painel admin
2. Partilha o CSV no Claude (claude.ai) com o prompt:
   *"Analisa este inquérito de avaliação da catequese e gera um relatório estruturado com pontos fortes, pontos a melhorar e recomendações concretas para os catequistas."*

---

## Ficheiros do projecto

```
sigc-inquerito/
├── src/
│   ├── components/         # Componentes reutilizáveis (estrelas, opções, botões)
│   │   └── secoes/         # As 5 secções do inquérito
│   ├── pages/              # Páginas principais
│   │   ├── PaginaInquerito.tsx   # O inquérito (rota /)
│   │   ├── PaginaAdmin.tsx       # Painel admin (rota /admin)
│   │   └── PaginaQR.tsx          # Gerador QR Code (rota /qr)
│   ├── lib/
│   │   ├── api.ts          # Comunicação com Google Sheets
│   │   ├── config.ts       # Configurações centrais
│   │   └── stats.ts        # Cálculo de estatísticas + exportação CSV
│   └── types/index.ts      # Tipos TypeScript
├── google-apps-script.js   # Código para colar no Google Apps Script
├── .env.example            # Template das variáveis de ambiente
├── netlify.toml            # Configuração Netlify
└── GUIA.md                 # Este ficheiro
```
