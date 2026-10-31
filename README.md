# HedeflerBir LMS · app.hedeflerbir.com

Next.js 15 (App Router, RSC, Server Actions) · TypeScript strict · Prisma + PostgreSQL · Auth.js v5 · Tailwind CSS v4 · Radix UI · Motion

## Kurulum

```bash
cp .env.example .env          # AUTH_SECRET için: npx auth secret
docker compose up -d          # veya Neon / Supabase gibi bir Postgres URL'i
npm install
npm run db:deploy             # prisma/migrations altındaki migration'ları uygular
npm run db:seed               # demo hesaplar ve örnek veri (idempotent, tekrar çalıştırılabilir)
npm run dev
```

**Docker olmadan:** `npx prisma dev --name hedeflerbir --detach` yerel bir Postgres (PGlite) başlatır.
Çıktıdaki TCP adresini `DATABASE_URL` olarak kullanın ve sonuna `&connection_limit=1&pgbouncer=true` ekleyin
(PGlite tek bağlantı kabul eder ve hazır sorgu ifadelerini desteklemez).

`RESEND_API_KEY` boşsa e-postalar gönderilmez; düz metin hâli (bağlantılar dahil) sunucu konsoluna yazılır.

Demo hesapları (şifre `SEED_PASSWORD`, tanımlı değilse `HedeflerBir2026!`). Seed her çalıştığında bu hesapların şifresini yeniden ayarlar; geliştirme ortamında giriş sayfalarındaki "Demo ... Doldur" butonları formu doldurur (production'da yalnızca `DEMO_LOGIN_ENABLED=true` ile görünür).

| Rol | Ad Soyad | E-posta | Giriş kapısı |
| --- | --- | --- | --- |
| Yönetici | Sistem Yöneticisi | admin@hedeflerbir.com | `/login` |
| Eğitmen | Ahmet Yılmaz | egitmen@hedeflerbir.com | `/expert-login` |
| Mentor | Burak Demir | mentor@hedeflerbir.com | `/expert-login` |
| Öğrenci | Can Öztürk | ogrenci@hedeflerbir.com | `/login` |

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

**Zorunlu:** `DATABASE_URL` (PostgreSQL), `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST=true`.
**Opsiyonel (boş ya da `disabled` ⇒ güvenli fallback):** Resend (`RESEND_API_KEY`, `EMAIL_FROM`) ve S3/R2 (`S3_*`).
Build hiçbir ortam değişkeni olmadan da geçer; harici servisler yalnızca çalışma anında, gerçek değer verildiğinde devreye girer.

| Servis yok | Davranış |
| --- | --- |
| Resend | E-postalar atlanır; logda yalnızca alıcı ve konu görünür (sıfırlama bağlantıları loglanmaz). |
| S3/R2 | Yüklemeler yerel diske (`UPLOADS_DIR`, varsayılan `.uploads`) yazılır; ilk kullanımda uyarı loglanır. |
| Geçersiz `AUTH_URL` | `https://app.hedeflerbir.com` kullanılır, uyarı loglanır. |

### Hostinger (Node.js Web App)

1. **Veritabanı:** Hostinger'ın yönetilen veritabanları MySQL'dir; bu proje **PostgreSQL** kullanır. Neon veya Supabase gibi bir Postgres oluşturup bağlantı adresini `DATABASE_URL` olarak girin (`?sslmode=require`; havuzlanmış/pooler adresi kullanıyorsanız sonuna `&pgbouncer=true` ekleyin).
2. **Ortam değişkenleri:** hPanel'e girin. Build ve start komutları varsayılan kalabilir: `npm run build` (Prisma client'ı da üretir) ve `npm start`.
3. **Migration (ilk deploy ve her şema değişikliğinde):** kendi bilgisayarınızdan, üretim `DATABASE_URL`'i ile:
   ```bash
   DATABASE_URL="postgresql://…" npx prisma migrate deploy
   ```
4. **İlk yönetici hesabı (yalnızca boş veritabanında, bir kez):** `DATABASE_URL="postgresql://…" SEED_PASSWORD="…" SEED_ALLOW_PRODUCTION=true npm run db:seed` (seed, `NODE_ENV=production` iken bu bayrak olmadan çalışmaz) — ardından demo hesapları silin/askıya alın ve yönetici şifresini değiştirin.
5. **Alan adı:** geçici domain ile test ederken `AUTH_URL`'i o adrese, `app.hedeflerbir.com`'a geçince tekrar bu adrese ayarlayın.
6. **Yüklemeler:** S3/R2 tanımlanana kadar dosyalar sunucu diskinde durur ve yeniden deploy'da silinebilir. Kalıcılık için R2 bilgilerini girin ya da `UPLOADS_DIR`'i uygulama klasörü dışında kalıcı bir dizine yönlendirin.

Docker/self-contained kurulum için `NEXT_OUTPUT=standalone` ile build alıp `node .next/standalone/server.js` çalıştırın.
