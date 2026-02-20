# Vardiya Planlama Sistemi

NestJS + Next.js ile geliştirilmiş tam kapsamlı vardiya yönetim uygulaması.

## Proje Yapısı

```
vardiya/
├── shift-planner-api/   # NestJS Backend (REST API)
└── shift-planner-web/   # Next.js Frontend
```

## Teknolojiler

- **Backend**: NestJS 10, Prisma 6, PostgreSQL
- **Frontend**: Next.js 14 (App Router), Tailwind CSS v4, TanStack Query v5
- **Auth**: JWT (access 15dk + refresh 7gün, httpOnly cookie)
- **Deploy**: Render (backend) + Vercel (frontend) + Neon.tech (DB)

---

## Yerel Geliştirme

### Gereksinimler
- Node.js 20+
- Docker (PostgreSQL için) veya yerel PostgreSQL

### Backend

```bash
cd shift-planner-api
cp .env.example .env
# .env dosyasındaki DATABASE_URL, JWT_SECRET vb. değerleri düzenleyin

npm install
docker run -d --name shift_planner_db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shift_planner -p 5432:5432 postgres:16

npx prisma migrate deploy
npx prisma db seed

npm run start:dev
# http://localhost:3001/api
```

### Frontend

```bash
cd shift-planner-web
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

npm install
npm run dev
# http://localhost:3000
```

---

## Production Deployment (Ücretsiz)

### 1. Neon.tech (PostgreSQL)

1. [neon.tech](https://neon.tech) → Sign up → Create Project
2. Project adı: `shift-planner`
3. **Connection string** kopyalayın (sslmode=require ile birlikte)
4. İleride bu URL'i Render'a ekleyeceksiniz

### 2. Render (Backend)

1. [render.com](https://render.com) → New → Web Service
2. GitHub repo'yu bağlayın: `leskuy7/vardiya`
3. Ayarlar:
   - **Root Directory**: `shift-planner-api`
   - **Build Command**: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `node dist/main`
   - **Plan**: Free
4. Environment Variables ekleyin:
   ```
   NODE_ENV=production
   PORT=3001
   TZ=UTC
   DATABASE_URL=<Neon connection string>
   JWT_SECRET=<güçlü rastgele string>
   JWT_REFRESH_SECRET=<güçlü rastgele string>
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   FRONTEND_URL=<Vercel URL - deploy sonrası eklenecek>
   ```

### 3. Vercel (Frontend)

1. [vercel.com](https://vercel.com) → New Project → GitHub'dan import
2. Repo: `leskuy7/vardiya`
3. **Root Directory**: `shift-planner-web`
4. Framework: Next.js (otomatik algılar)
5. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://<render-servis-adı>.onrender.com/api
   ```
6. Deploy edin → aldığınız URL'i Render'daki `FRONTEND_URL` değişkenine ekleyin

---

## Güvenlik Notları

- `.env` dosyaları `.gitignore`'a dahil — asla commit etmeyin
- JWT secret'larını en az 32 karakter güçlü string yapın
- Production'da `NODE_ENV=production` zorunludur

## Test

```bash
# Backend e2e testler (20/20)
cd shift-planner-api
npm run test:e2e
```
