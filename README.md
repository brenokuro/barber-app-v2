# BarberApp – Sistema de Agendamento

App Expo (React Native) + API Express + PostgreSQL.

## Configuração local

1. **Variáveis de ambiente**  
   Copie os valores no `.env` (ou use o `.env.example` como referência):

   - `DATABASE_URL` – URL do PostgreSQL (ex.: `postgresql://user:senha@localhost:5432/barbearia`)
   - `PORT` – Porta do servidor (opcional, padrão `5000`)
   - `EXPO_PUBLIC_API_URL` – URL da API (ex.: `http://localhost:5000`)

2. **Banco de dados**  
   Com o PostgreSQL rodando e `DATABASE_URL` definida:

   ```bash
   npm run db:push
   ```

3. **Backend**

   ```bash
   npm run server:dev
   ```

4. **Frontend (Expo)**

   ```bash
   npm run start
   ```

## Deploy na Vercel

1. Conecte o repositório à Vercel e faça o deploy (a Vercel detecta o Express pelo `server.ts` na raiz).

2. **Variáveis de ambiente** no painel da Vercel:
   - `DATABASE_URL` – URL do Postgres (ex.: Vercel Postgres, Neon, Supabase)
   - `EXPO_PUBLIC_API_URL` – URL da API em produção (ex.: `https://seu-projeto.vercel.app`)

3. **Schema do banco**  
   Rode uma vez (local ou CI) com a mesma `DATABASE_URL` de produção:

   ```bash
   DATABASE_URL="postgresql://..." npm run db:push
   ```

4. O endpoint da API na Vercel será: `https://seu-dominio.vercel.app/api/...` (ex.: `/api/auth/login`, `/api/services`, etc.).
