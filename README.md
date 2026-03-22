# EngLeap

Plataforma web para estudo de ingles com:
- biblioteca de materiais (HTML/MP4) por modulo
- flashcards EN/PT com traducao automatica
- autenticacao e dados no Supabase
- painel administrativo para gestao de usuarios

## Stack

- React 19 + Vite
- Tailwind (via CDN no `index.html`)
- Supabase (Auth, tabela de flashcards e roles)
- Vercel (deploy)

## Estrutura do projeto

```text
.
├─ srs-app/                  # app frontend (workspace principal)
│  ├─ src/
│  │  ├─ App.jsx             # portal do aluno (materiais + flashcards)
│  │  ├─ AdminDashboard.jsx  # painel admin
│  │  ├─ Login.jsx           # autenticacao
│  │  ├─ database.json       # indice de materiais
│  │  └─ supabaseClient.js   # cliente supabase
│  └─ public/
├─ materiais/                # arquivos reais de materiais didaticos
├─ supabase/
│  └─ functions/manage-users # edge function para CRUD de usuarios
└─ vercel.json
```

## Requisitos

- Node.js 20+
- npm 10+
- conta/projeto Supabase

## Configuracao local

1. Instalar dependencias:

```bash
npm install
```

2. Criar arquivo `srs-app/.env.local`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC
```

3. Garantir materiais no local esperado pelo Vite:

O `database.json` aponta para caminhos como `/materiais/...`, entao os arquivos precisam estar em `srs-app/public/materiais`.

PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path .\srs-app\public\materiais | Out-Null
Copy-Item -Path .\materiais\* -Destination .\srs-app\public\materiais -Recurse -Force
```

## Rodando o projeto

Na raiz:

```bash
npm run dev
```

Comandos uteis:

```bash
npm run build
npm run lint
```

## Supabase (resumo)

- Frontend usa `flashcards` para listar/criar/editar/excluir frases.
- Controle de admin usa `rpc('is_admin')`.
- Edge Function `manage-users` faz operacoes de usuarios com Service Role Key.

Para deploy da function, use Supabase CLI no diretorio do projeto:

```bash
supabase functions deploy manage-users
```

## Deploy (Vercel)

O arquivo `vercel.json` ja esta configurado para:
- `rootDirectory: srs-app`
- `framework: vite`
- `buildCommand: npm run build`

Deploy rapido:

```bash
vercel --prod
```

## Observacoes

- `srs-app/.env.local` esta no `.gitignore` e nao deve ser commitado.
- Se aparecer erro de pasta ausente em `srs-app/public/materiais`, rode o passo de copia da secao de configuracao local.
