# EngLeap

Aplicacao web de estudos com React + Vite, materiais estaticos em `srs-app/public/materiais` e integracao com Supabase para autenticacao, flashcards e painel administrativo.

## Estrutura

```text
.
|- srs-app/          # app principal publicada na Vercel
|- supabase/         # edge functions e configuracoes Supabase
|- package.json      # comandos do workspace
|- package-lock.json # lockfile usado pela Vercel
`- vercel.json       # configuracao de build/deploy
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

## GitHub

O remote esperado para este projeto e:

- [https://github.com/gostilima/Englead](https://github.com/gostilima/Englead)
