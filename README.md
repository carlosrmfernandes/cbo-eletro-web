# cbo-eletro-web

Front React + Vite + TypeScript.

## Rodando

```bash
npm install
cp .env.example .env.local   # URL e publishable key do Supabase
npm run dev                  # http://localhost:5173
```

Em desenvolvimento, as chamadas para `/api` são repassadas para `http://localhost:3333`
(ver `vite.config.ts`). Em produção, defina `VITE_API_URL` com a URL da API antes do `npm run build`.

## Estrutura

- `src/pages/` — Login, Cadastro, Dashboard
- `src/auth/AuthContext.tsx` — sessão via Supabase Auth
- `src/lib/supabase.ts` — cliente Supabase
- `src/lib/api.ts` — cliente HTTP da cbo-eletro-api (envia o token do Supabase)
