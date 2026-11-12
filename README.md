# Tech Oferta — Portal de Ofertas e Afiliados Mercado Livre

Portal moderno e responsivo para divulgação de ofertas, promoções e produtos de tecnologia com links de afiliados do Mercado Livre.

## Como rodar localmente

```bash
npm install
npm run dev
```

O servidor inicia na porta `3000` (`http://localhost:3000`).

## Como publicar no GitHub Pages (100% Gratuito)

Este repositório já está configurado com `base: './'` no Vite e workflow automático em `.github/workflows/deploy.yml`:

1. Envie o projeto para um repositório no GitHub (branch `main` ou `master`).
2. No GitHub, acesse **Settings → Pages**.
3. Em **Build and deployment → Source**, selecione **GitHub Actions**.
4. O site será compilado (`npm run build`) e publicado automaticamente no seu link `https://<seu-usuario>.github.io/<nome-do-repositorio>/`.

## Como publicar com Backend Node.js completo (Render / Railway / Cloud Run)

Caso queira manter a sincronização via servidor (`/api/catalog`, importador por link e persistência em `data/catalog.json`):

- **Build command:** `npm install && npm run build`
- **Start command:** `NODE_ENV=production npm start`
- **Variável opcional:** `GEMINI_API_KEY` (opcional — o importador funciona com ou sem chave de API)
