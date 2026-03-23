# EngLeap App

Workspace frontend do EngLeap.

Use os comandos pela raiz do repositorio:

```bash
npm install
npm run dev
npm run build
```

As variaveis locais ficam em `srs-app/.env.local`. Veja `srs-app/.env.example`.

No Render, a configuracao recomendada para esta app e `Static Site` usando o blueprint em `../render.yaml`.
Nao configure rewrite global para `/index.html`, porque a app tambem serve arquivos reais em `/materiais/...`.
