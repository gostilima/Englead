# EngLeap

Aplicacao web de estudos com React + Vite, materiais estaticos em `srs-app/public/materiais` e integracao com Supabase para autenticacao, flashcards e painel administrativo.

## Estrutura

```text
.
|- srs-app/          # app principal publicada na Vercel
|- supabase/         # edge functions e configuracoes Supabase
|- package.json      # comandos do workspace
|- package-lock.json # lockfile usado pela Vercel
|- vercel.json       # configuracao de build/deploy na Vercel
`- render.yaml       # blueprint pronta para deploy no Render
```

## Rodando localmente

1. Instale as dependencias na raiz:

```bash
npm install
```

2. Crie `srs-app/.env.local` com:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

3. Inicie a app:

```bash
npm run dev
```

## Build

```bash
npm run build
```

O build final fica em `srs-app/dist`.

## Vercel

O repositório ja esta organizado para deploy pela raiz:

- `installCommand`: `npm install`
- `buildCommand`: `npm run build`
- `outputDirectory`: `srs-app/dist`

Na Vercel, configure estas variaveis de ambiente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Render

O projeto ja esta preparado para Render com a blueprint em `render.yaml`.

Configuracao incluida:

- tipo: `Static Site`
- root directory: `srs-app`
- build command: `npm ci --include=optional && npm run build`
- publish directory: `dist`
- `SKIP_INSTALL_DEPS=true` para evitar instalacao duplicada no pipeline do Render

Variaveis de ambiente esperadas no primeiro deploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Passos no painel:

1. No Render, escolha `New +` -> `Blueprint`.
2. Conecte o repositório [https://github.com/gostilima/Englead](https://github.com/gostilima/Englead).
3. Confirme a criacao do servico `engleap`.
4. Preencha as duas variaveis do Supabase quando o Render pedir.

Observacao:

- Para este projeto, `Static Site` e o modo recomendado no Render.
- Nao foi adicionada regra global de rewrite no Render porque a aplicacao nao usa React Router e precisa servir arquivos reais em `/materiais/...`.

## GitHub

O remote esperado para este projeto e:

- [https://github.com/gostilima/Englead](https://github.com/gostilima/Englead)
