# HedeflerBir LMS · app.hedeflerbir.com

Next.js 15 (App Router, RSC, Server Actions) · TypeScript strict · Prisma + PostgreSQL · Auth.js v5 · Tailwind CSS v4 · Radix UI · Motion

## Kurulum

```bash
cp .env.example .env          # AUTH_SECRET için: npx auth secret
docker compose up -d          # veya Neon / Supabase gibi bir Postgres URL'i
npm install
npm run db:deploy             # prisma/migrations altındaki migration'ları uygular
npm run db:seed               # demo hesaplar (yalnızca boş veritabanında)
npm run dev
```

**Docker olmadan:** `npx prisma dev --name hedeflerbir --detach` yerel bir Postgres (PGlite) başlatır.
Çıktıdaki TCP adresini `DATABASE_URL` olarak kullanın ve sonuna `&connection_limit=1&pgbouncer=true` ekleyin
(PGlite tek bağlantı kabul eder ve hazır sorgu ifadelerini desteklemez).

`RESEND_API_KEY` boşsa e-postalar gönderilmez; düz metin hâli (bağlantılar dahil) sunucu konsoluna yazılır.

Seed hesapları (`SEED_PASSWORD`, varsayılan `.env.example` içinde):

| Rol | E-posta | Giriş kapısı |
| --- | --- | --- |
| Yönetici | admin@hedeflerbir.com | `/login` |
| Eğitmen | egitmen@hedeflerbir.com | `/expert-login` |
| Mentor | mentor@hedeflerbir.com | `/expert-login` |
| Katılımcı | katilimci@hedeflerbir.com | `/login` |

## Mimari

```
src/
├─ app/                     # Yalnızca routing — ince sayfalar
│  ├─ (auth)/               # /login, /expert-login
│  ├─ (student)/            # /dashboard, /courses, /assignments, /mentors …
│  ├─ instructor/           # Eğitmen modu
│  ├─ mentor/               # Mentor modu
│  └─ admin/                # Kontrol merkezi
├─ modules/<context>/       # Bounded context'ler (DDD)
│  ├─ domain/               # Saf TS: kurallar, değer nesneleri, politikalar (framework'süz)
│  ├─ application/          # Query'ler (server-only) ve Server Action'lar
│  └─ ui/                   # Context'e özel bileşenler
├─ components/ui/           # Atomik tasarım sistemi (shadcn mimarisi)
├─ components/layout/       # AppShell, sidebar, hata/yükleme sınırları
├─ server/                  # Altyapı: Prisma client, Auth.js
└─ middleware.ts            # Edge RBAC → modules/identity/domain/access-policy.ts
```

### Yetkilendirme (RBAC)

- `access-policy.ts` her route alanını rol(ler)e ve giriş kapısına eşler; saf fonksiyondur, middleware ve sunucu guard'ları aynı kuralı kullanır.
- **Smart routing:** girişten sonra `/` → rolün ana sayfası (`/dashboard`, `/instructor`, `/mentor`, `/admin`).
- **Portal ayrımı:** Eğitmen/Mentor yalnızca `/expert-login`, Katılımcı/Yönetici yalnızca `/login` üzerinden giriş yapar.
- **Defense in depth:** her alan layout'u `getViewer(role)` ile sunucuda yeniden doğrular; mutation'lar da `requireRole` kullanır.

## Deployment

`output: "standalone"` açıktır. Production ortamında `AUTH_URL=https://app.hedeflerbir.com`, `AUTH_SECRET` ve `DATABASE_URL` zorunludur; build öncesi `npm run db:deploy` çalıştırın.
