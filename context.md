# 📋 Project Context — SFA (Sales Force Automation)

> **Dokumen ini adalah sumber kebenaran tunggal (single source of truth) untuk proyek SFA.**
> Perbarui dokumen ini setiap kali ada perubahan signifikan pada arsitektur, keputusan desain, atau arah produk.

---

## 1. 🎯 Gambaran Umum Proyek

| Field | Detail |
|---|---|
| **Nama Proyek** | SFA — Sales Force Automation |
| **Versi** | 0.1.0 |
| **Status** | 🟡 In Development |
| **Tanggal Mulai** | 2026-06-28 |
| **Target Rilis MVP** | TBD |
| **Tim** | TBD |
| **Repositori** | https://github.com/Jeffrey-Herly/SFA |

### Deskripsi Singkat
Sistem **Sales Force Automation (SFA)** adalah platform digital yang dirancang untuk membantu tim penjualan dalam melakukan **pencatatan aktivitas**, **tracking pipeline penjualan**, dan **otomisasi pekerjaan rutin** — sehingga tenaga penjualan dapat fokus pada hal yang paling penting: menutup deal.

### Masalah yang Dipecahkan
| # | Masalah | Solusi SFA |
|---|---|---|
| 1 | Aktivitas sales tidak tercatat / lupa follow-up | Pencatatan aktivitas & pengingat otomatis |
| 2 | Pipeline tidak transparan bagi manajer | Dashboard & tracking real-time |
| 3 | Pekerjaan administratif membuang waktu | Otomasi tugas berulang |
| 4 | Tidak ada visibilitas kinerja per salesperson | Laporan & KPI tracking |
| 5 | Data pelanggan tersebar di mana-mana | Centralized customer & account data |

### Tujuan Utama
- [ ] Meningkatkan produktivitas tenaga penjualan
- [ ] Memberikan visibilitas real-time pipeline penjualan kepada manajemen
- [ ] Mengotomasi pengingat, laporan, dan tugas administratif
- [ ] Menyediakan data akurat untuk pengambilan keputusan bisnis

---

## 2. 👥 Pemangku Kepentingan & Pengguna

### Stakeholders
| Peran | Nama | Tanggung Jawab |
|---|---|---|
| Product Owner | Jeffrey Herly | Visi produk & prioritas fitur |
| Tech Lead | Jeffrey Herly | Arsitektur & review kode |
| Developer | Jeffrey Herly | Implementasi |
| Designer | Jeffrey Herly | UI/UX |

### User Roles & Persona

> **Leads/prospek adalah data, bukan user sistem.** Tabel di bawah adalah role pengguna yang login ke aplikasi.

| Role (nilai di DB) | Tampilan | Deskripsi | Kebutuhan Utama |
|---|---|---|---|
| `sales_rep` | **Salesperson / SPG** | Tenaga penjual di lapangan | Catat kunjungan, lihat target, input order dengan cepat |
| `sales_manager` | **Sales Manager** | Pemimpin tim sales | Monitor tim, approve, lihat pipeline & KPI |
| `admin` | **Admin** | Pengelola data master | Kelola produk, area, user, konfigurasi sistem |
| `executive` | **Management / Direktur** | Pengambil keputusan | Dashboard executive, laporan agregat, trend penjualan |

---

## 3. ✨ Modul & Fitur

### Modul Inti (MVP)

#### 🗂️ M01 — Master Data
| Fitur | Deskripsi | Status |
|---|---|---|
| Manajemen Produk | CRUD produk, harga, kategori | 📋 Planned |
| Manajemen Customer / Account | CRUD pelanggan, tipe, segmen | 📋 Planned |
| Manajemen Area / Wilayah | Pembagian territory per salesperson | 📋 Planned |
| Manajemen User & Role | CRUD user, assignment role | 📋 Planned |
| Target / Kuota | Set target penjualan per periode/per user | 📋 Planned |

#### 📞 M02 — Aktivitas Sales
| Fitur | Deskripsi | Status |
|---|---|---|
| Pencatatan Kunjungan (Visit) | Log kunjungan ke customer + GPS check-in/out | 📋 Planned |
| Pencatatan Panggilan (Call Log) | Log telepon / WA ke customer | 📋 Planned |
| Pencatatan Meeting | Agenda, notulen, follow-up meeting | 📋 Planned |
| Pencatatan Email | Link/summary email ke customer | 📋 Planned |
| History Aktivitas per Customer | Timeline semua aktivitas per akun | 📋 Planned |

#### 🎯 M03 — Lead & Opportunity Management
| Fitur | Deskripsi | Status |
|---|---|---|
| Manajemen Lead | Input & kualifikasi prospek baru | 📋 Planned |
| Pipeline / Funnel Penjualan | Visual kanban stage dari prospek ke closing | 📋 Planned |
| Opportunity Tracking | Nilai deal, probabilitas, estimasi closing | 📋 Planned |
| Konversi Lead → Opportunity → Customer | Workflow konversi bertahap | 📋 Planned |

#### ✅ M04 — Task & Follow-up
| Fitur | Deskripsi | Status |
|---|---|---|
| Manajemen Tugas (Task) | Buat, assign, selesaikan tugas | 📋 Planned |
| Pengingat Otomatis | Notifikasi follow-up jatuh tempo | 📋 Planned |
| Jadwal Kunjungan (Visit Plan) | Rencana kunjungan harian/mingguan | 📋 Planned |
| Kalender Aktivitas | View kalender semua aktivitas sales | 📋 Planned |

#### 🛒 M05 — Order & Transaksi
| Fitur | Deskripsi | Status |
|---|---|---|
| Input Order | Catat pesanan dari customer | 📋 Planned |
| Status Order | Tracking status: draft → confirmed → delivered | 📋 Planned |
| History Transaksi per Customer | Riwayat pembelian akun | 📋 Planned |

#### 📊 M06 — Laporan & Dashboard
| Fitur | Deskripsi | Status |
|---|---|---|
| Dashboard Salesperson | Target vs. realisasi, aktivitas hari ini | 📋 Planned |
| Dashboard Manager | Ringkasan tim, pipeline, KPI | 📋 Planned |
| Dashboard Executive | Trend penjualan, area, produk terlaris | 📋 Planned |
| Laporan Aktivitas | Rekap kunjungan, call, meeting per periode | 📋 Planned |
| Laporan Pipeline | Nilai & jumlah opportunity per stage | 📋 Planned |
| Laporan Penjualan | Sales vs. target per user/area/produk | 📋 Planned |
| Export Laporan | Export ke Excel / PDF | 📋 Planned |

#### 🔔 M07 — Notifikasi & Otomasi
| Fitur | Deskripsi | Status |
|---|---|---|
| Notifikasi Follow-up | Pengingat otomatis bila lead/task jatuh tempo | 📋 Planned |
| Notifikasi Approval | Alert ketika order/data butuh persetujuan | 📋 Planned |
| Otomasi Email | Template email otomatis ke customer | 📋 Planned |
| Workflow Automation | Trigger aksi otomatis berdasarkan kondisi | 📋 Planned |

### Fitur Post-MVP
| Fitur | Catatan |
|---|---|
| Mobile App (iOS/Android) | Untuk salesperson di lapangan |
| GPS Tracking Real-time | Pantau posisi salesperson |
| Integrasi WhatsApp | Kirim pesan WA langsung dari sistem |
| Integrasi ERP / Accounting | Sinkron data order ke sistem keuangan |
| AI Rekomendasi | Saran produk / waktu terbaik follow-up |
| Gamification | Leaderboard & badge untuk motivasi tim |

**Status Legend:** 📋 Planned · 🔵 In Progress · ✅ Done · ⛔ Blocked · 🚫 Cancelled

---

## 4. 🗺️ Domain Model & Entitas

> Detail schema kolom ada di [database.md](./database.md). Bagian ini menjelaskan relasi antar entitas domain.

### Terminologi Entitas

| Istilah | Tabel DB | Keterangan |
|---|---|---|
| **Account** | `accounts` | Perusahaan / organisasi pelanggan |
| **Contact** | `contacts` | Orang kontak (PIC) di dalam sebuah Account |
| **Lead** | `leads` | Prospek individu / perusahaan yang belum jadi account |
| **Opportunity** | `opportunities` | Peluang deal yang sedang dikejar dari sebuah Lead/Account |
| **Activity** | `activities` | Log interaksi: call, email, meeting, note, status_change |

### Entitas Utama & Relasi

```
[User] ─────────── role: sales_rep | sales_manager | admin | executive
  │
  ├── assigned ──────────────────── [Lead]
  │     └── dikonversi ke ────────── [Opportunity]
  │           ├── linked to ────────── [Account]
  │           └── closed_won ──────── [Order]
  │
  ├── assigned ──────────────────── [Account]
  │     └── memiliki ────────────── [Contact]  (orang PIC di account)
  │
  ├── mencatat ─────────────────── [Activity]  (call/email/meeting/note)
  │     └── bisa linked ke ──────── Lead | Opportunity | Account | Contact
  │
  └── diukur dengan ──────────────── [Target]
        └── dibanding ─────────────── Realisasi dari [Order]
```

### Detail Entitas (sesuai database.md)

#### Account (tabel: `accounts`)
```
accounts
  ├── id: UUID PK
  ├── company_name: VARCHAR
  ├── industry: VARCHAR
  ├── website: VARCHAR
  ├── address: TEXT
  └── created_at: TIMESTAMP
```

#### Contact (tabel: `contacts`)
```
contacts
  ├── id: UUID PK
  ├── account_id: UUID FK → accounts
  ├── name: VARCHAR
  ├── email: VARCHAR
  ├── phone: VARCHAR
  ├── position: VARCHAR
  └── created_at: TIMESTAMP
```

#### Lead (tabel: `leads`)
```
leads
  ├── id: UUID PK
  ├── name: VARCHAR                        ← nama prospek / perusahaan
  ├── email: VARCHAR
  ├── phone: VARCHAR
  ├── interest: TEXT                       ← produk/layanan yang diminati
  ├── status: ENUM [new, contacted, qualified, converted, dead]
  ├── source: ENUM [web_form, manual, referral, import]
  ├── created_by: UUID FK → users          ← NULL jika dari form publik
  ├── assigned_to: UUID FK → users
  ├── notes: TEXT
  ├── created_at: TIMESTAMP
  └── updated_at: TIMESTAMP
```

#### Opportunity (tabel: `opportunities`)
```
opportunities
  ├── id: UUID PK
  ├── title: VARCHAR
  ├── lead_id: UUID FK → leads
  ├── account_id: UUID FK → accounts
  ├── stage: ENUM [prospecting, qualification, proposal, negotiation, closed_won, closed_lost]
  ├── amount: DECIMAL                      ← nilai deal
  ├── probability: INTEGER (0–100)
  ├── expected_close: DATE
  ├── loss_reason: TEXT                    ← wajib diisi jika closed_lost
  ├── created_at: TIMESTAMP
  └── updated_at: TIMESTAMP
```

#### Activity (tabel: `activities`) — append-only
```
activities
  ├── id: UUID PK
  ├── user_id: UUID FK → users             ← wajib
  ├── lead_id: UUID FK → leads             ← nullable
  ├── opportunity_id: UUID FK → opportunities ← nullable
  ├── contact_id: UUID FK → contacts       ← nullable
  ├── account_id: UUID FK → accounts       ← nullable (minimal 1 FK harus terisi)
  ├── type: ENUM [call, email, meeting, note, status_change]
  ├── notes: TEXT
  ├── meta: JSONB                          ← misal: { from: 'new', to: 'qualified' }
                                             atau: { lat, lng, check_in_at, check_out_at }
  ├── activity_date: TIMESTAMP
  └── created_at: TIMESTAMP
```

> **Catatan Visit/GPS:** Kunjungan fisik dicatat sebagai `type: meeting` dengan data lokasi GPS
> disimpan di field `meta` JSONB: `{ lat, lng, address, check_in_at, check_out_at }`.

#### Order (tabel: `orders` — ditambahkan ke database.md)
```
orders
  ├── id: UUID PK
  ├── order_number: VARCHAR UNIQUE
  ├── account_id: UUID FK → accounts
  ├── opportunity_id: UUID FK → opportunities (nullable)
  ├── salesperson_id: UUID FK → users
  ├── status: ENUM [draft, submitted, approved, processing, delivered, cancelled]
  ├── order_date: DATE
  ├── delivery_date: DATE
  ├── total_amount: DECIMAL
  ├── notes: TEXT
  ├── created_at: TIMESTAMP
  └── updated_at: TIMESTAMP
```

#### Target (tabel: `targets` — ditambahkan ke database.md)
```
targets
  ├── id: UUID PK
  ├── user_id: UUID FK → users
  ├── period_type: ENUM [monthly, quarterly, yearly]
  ├── period_start: DATE
  ├── period_end: DATE
  ├── target_amount: DECIMAL               ← target omzet
  ├── target_visits: INTEGER
  ├── target_new_leads: INTEGER
  ├── created_at: TIMESTAMP
  └── updated_at: TIMESTAMP
```

---

## 5. 🔄 Alur Bisnis Utama (Business Flow)

### Alur Sales Utama
```
1. INPUT LEAD
   Salesperson menemukan prospek baru
   └─> Lead dicatat [source, info kontak, estimasi nilai]

2. KUALIFIKASI
   Salesperson menghubungi dan menilai potensi lead
   └─> Aktivitas (Call/Visit) dicatat
   └─> Lead dikualifikasi → QUALIFIED atau UNQUALIFIED

3. KONVERSI KE OPPORTUNITY
   Lead qualified → dibuat Opportunity
   └─> Stage: Prospecting → Qualification → Proposal → Negotiation

4. AKTIVITAS LANJUTAN
   Salesperson melakukan kunjungan, demo, negosiasi
   └─> Setiap aktivitas dicatat di system
   └─> Task & follow-up dibuat otomatis

5. PENUTUPAN DEAL
   └─> Closed Won → Order dibuat
   └─> Closed Lost → Alasan dicatat → nurture kembali

6. ORDER DIPROSES
   Order → Submitted → Approved (Manager) → Processing → Delivered

7. PELAPORAN
   Aktivitas & transaksi dihitung terhadap Target
   └─> Dashboard diupdate real-time
```

### Alur Kunjungan Harian (Visit Flow)
```
Salesperson
  1. Buka Visit Plan hari ini
  2. Berangkat ke lokasi customer
  3. CHECK-IN (GPS tercatat otomatis)
  4. Lakukan aktivitas (demo, presentasi, negosiasi)
  5. Catat notes & outcome kunjungan
  6. CHECK-OUT
  7. Sistem otomatis buat task follow-up jika diperlukan
```

---

## 6. 🏗️ Arsitektur & Stack Teknologi

> ✅ *Stack teknologi sudah dikonfirmasi.*

### Stack Teknologi

#### Frontend — Vue.js 3
| Layer | Pilihan | Keterangan |
|---|---|---|
| **Framework** | **Vue.js 3** | Composition API + `<script setup>` |
| **Build Tool** | **Vite** | Dev server cepat, HMR instant |
| **Styling** | **Tailwind CSS** | Utility-first, rapid UI development |
| **Router** | **Vue Router 4** | SPA routing |
| **State Management** | **Pinia** | Ringan, modern, Vue 3 native |
| **HTTP Client** | **Axios** | API calls ke backend |
| **Charting** | **ApexCharts** (vue3-apexcharts) | Dashboard & KPI charts |
| **Map / GPS** | **Leaflet** (vue-leaflet) | Peta kunjungan & geofencing |
| **UI Component** | **PrimeVue / Naive UI** | Komponen siap pakai |
| **Form Validation** | **VeeValidate + Zod** | Validasi form & schema |

#### Backend — Node.js + Express.js
| Layer | Pilihan | Keterangan |
|---|---|---|
| **Runtime** | **Node.js LTS (v20+)** | Server-side JavaScript |
| **Framework** | **Express.js** | REST API server, minimalis & fleksibel |
| **Bahasa** | **TypeScript** | Type-safe, lebih robust |
| **API Style** | **REST** | JSON responses |
| **ORM** | **Prisma** | Schema-first, type-safe DB access + migrations |
| **Validasi** | **Zod** | Request body & query validation |
| **Auth** | **jsonwebtoken** | JWT access token + refresh token |
| **Password** | **bcrypt** | Hash & verify password |
| **Logging** | **Winston + Morgan** | Request log & error log |
| **Queue / Job** | **Bull + Redis** | Background jobs, pengingat otomatis |
| **Upload** | **Multer** | Handle multipart file upload |
| **API Docs** | **Swagger (swagger-ui-express)** | Auto-generate dokumentasi API |

#### Database
| Komponen | Pilihan | Keterangan |
|---|---|---|
| **Primary DB** | **PostgreSQL** | Relational, robust, production-ready |
| **ORM** | **Prisma** | Migrations + query builder type-safe |
| **Cache / Queue** | **Redis** | Session, job queue, cache response |
| **Storage / Upload** | **MinIO / AWS S3** | File upload, foto bukti kunjungan |

#### Notifikasi
| Channel | Tools | Keterangan |
|---|---|---|
| **Push Notif** | FCM / OneSignal | Notifikasi browser & mobile |
| **Email** | **Nodemailer + SendGrid** | Email otomatis ke customer & user |
| **WhatsApp** | **Fonnte / WABLAS** | Pengingat & notifikasi via WA |

#### Infrastructure & DevOps
| Komponen | Pilihan |
|---|---|
| **Cloud** | VPS / AWS / GCP |
| **Web Server** | **Nginx** (reverse proxy + static) |
| **Process Manager** | **PM2** (Node.js production) |
| **CI/CD** | GitHub Actions |
| **Containerization** | Docker + Docker Compose |


### Diagram Arsitektur (High Level)
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│   [Vue.js Web App (Browser)]    [Mobile App (Post-MVP)]     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────▼──────────────────────────────────────┐
│                        API LAYER                             │
│                    [REST API Server]                         │
│   Auth · Master Data · Activity · Pipeline · Order · Report │
└──────┬──────────────────┬─────────────────┬─────────────────┘
       │                  │                 │
┌──────▼──────┐  ┌────────▼───────┐  ┌─────▼──────────┐
│  PostgreSQL  │  │  Redis Cache   │  │  File Storage  │
│  (Primary)  │  │  (Session/Job) │  │  (Uploads/Docs)│
└─────────────┘  └────────────────┘  └────────────────┘
                       │
            ┌──────────▼───────────┐
            │  Notification Service │
            │  (Email/WA/Push)     │
            └──────────────────────┘
```

---

## 7. 📁 Struktur Proyek (Usulan)

```
SFA/
├── apps/
│   ├── web/                    # Frontend Web App
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── customers/
│   │   │   │   ├── leads/
│   │   │   │   ├── opportunities/
│   │   │   │   ├── activities/
│   │   │   │   ├── orders/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── mobile/                 # Mobile App (Post-MVP)
│
├── backend/                    # API Server
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── master-data/
│   │   │   │   ├── customers/
│   │   │   │   ├── products/
│   │   │   │   └── territories/
│   │   │   ├── activities/
│   │   │   ├── leads/
│   │   │   ├── opportunities/
│   │   │   ├── orders/
│   │   │   ├── targets/
│   │   │   ├── notifications/
│   │   │   └── reports/
│   │   ├── common/
│   │   │   ├── middlewares/
│   │   │   ├── guards/
│   │   │   ├── decorators/
│   │   │   └── utils/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeders/
│   │   └── config/
│   └── package.json
│
├── docs/                       # Dokumentasi tambahan
│   ├── api/                    # API spec (OpenAPI/Swagger)
│   ├── database/               # ERD, schema diagram (konteks menggunkan file database.md)
│   └── flows/                  # Diagram alur bisnis
│
├── .env.example
├── docker-compose.yml
├── context.md                  # ← Dokumen ini
└── README.md
```

---

## 8. 🔌 Integrasi Eksternal

| Layanan | Tujuan | Prioritas |
|---|---|---|
| Google Maps / Mapbox | GPS check-in kunjungan, visualisasi area | MVP |
| WhatsApp API (Fonnte/WABLAS) | Kirim pengingat & notifikasi via WA | MVP |
| Email Provider (SendGrid) | Email otomatis ke customer & user | MVP |
| ERP / Accounting System | Sinkron order ke sistem keuangan | Post-MVP |
| Google Calendar | Sinkron jadwal kunjungan | Post-MVP |
| Power BI / Tableau | Laporan lanjutan untuk management | Post-MVP |

---

## 9. 🔐 Keamanan & Autentikasi

- **Metode Auth**: JWT (Access Token + Refresh Token)
- **Authorization**: RBAC (Role-Based Access Control)

| Role (DB) | Hak Akses |
|---|---|
| `sales_rep` | Akses data sendiri & account/lead di area-nya |
| `sales_manager` | Akses data seluruh tim di bawahnya, dapat approve order |
| `admin` | Akses penuh + konfigurasi sistem & master data |
| `executive` | Read-only: seluruh laporan & dashboard |

- **GPS / Lokasi**: Validasi radius check-in (geofencing), data GPS disimpan di `activities.meta` JSONB
- **Data Sensitif**: Enkripsi password (bcrypt), HTTPS wajib
- **Audit Log**: Perubahan status dicatat via tabel `activities` dengan `type: status_change`

---

## 9b. 🛡️ Mitigasi Keamanan — OWASP Top 10 (2021)

> Setiap risiko di bawah ini dipetakan ke konteks SFA dengan mitigasi teknis yang konkret menggunakan stack **Node.js + Express + Prisma + PostgreSQL**.

---

### A01 — Broken Access Control
**Risiko di SFA:** `sales_rep` mengakses data lead/order milik salesperson lain; akses endpoint admin tanpa role yang benar.

| Mitigasi | Implementasi |
|---|---|
| Enforce RBAC di setiap route | Middleware `rbac.middleware.ts` — cek `req.user.role` sebelum handler |
| Row-level ownership check | Service layer wajib filter `WHERE assigned_to = req.user.id` untuk `sales_rep` |
| Deny by default | Semua route di-protect; whitelist hanya endpoint publik (login, form lead publik) |
| Test negatif wajib | Setiap endpoint API harus punya test case akses lintas role |

```typescript
// Contoh: sales_rep hanya bisa akses lead miliknya
async getLeadById(id: string, requestor: User) {
  const lead = await LeadRepository.findById(id)
  if (requestor.role === 'sales_rep' && lead.assigned_to !== requestor.id) {
    throw new ForbiddenError('Akses ditolak')
  }
  return lead
}
```

---

### A02 — Cryptographic Failures
**Risiko di SFA:** Password tersimpan plain-text; token JWT bocor; data sensitif customer tidak terenkripsi.

| Mitigasi | Implementasi |
|---|---|
| Hash password | `bcrypt` dengan cost factor ≥ 12 |
| JWT aman | `ACCESS_TOKEN` TTL pendek (15 menit); `REFRESH_TOKEN` di HttpOnly cookie |
| HTTPS wajib | Nginx terminate SSL; redirect HTTP → HTTPS |
| Env vars tidak di-commit | `.env` masuk `.gitignore`; gunakan secret manager di production |
| Tidak log data sensitif | Logger dikonfigurasi untuk menyensor field `password`, `token` |

---

### A03 — Injection
**Risiko di SFA:** SQL Injection via input form lead/order; NoSQL injection di query filter; command injection di fitur export.

| Mitigasi | Implementasi |
|---|---|
| Parameterized query via Prisma | Prisma ORM secara default menggunakan prepared statement — tidak ada raw string query |
| Validasi & sanitasi input | Semua request body divalidasi dengan **Zod** schema sebelum masuk service |
| Hindari `prisma.$queryRaw` | Jika terpaksa raw query, wajib gunakan `Prisma.sql` template literal |
| Content-Type validation | Middleware cek `Content-Type: application/json` di semua POST/PUT |

```typescript
// ✅ Aman — Prisma parameterized
await prisma.lead.findMany({ where: { assigned_to: userId } })

// ❌ Berbahaya — JANGAN lakukan ini
await prisma.$queryRawUnsafe(`SELECT * FROM leads WHERE id = '${id}'`)
```

---

### A04 — Insecure Design
**Risiko di SFA:** Flow konversi lead bisa dilewati; order bisa dibuat tanpa account valid; tidak ada rate limit pada login.

| Mitigasi | Implementasi |
|---|---|
| Business rule di service layer | Validasi state machine: Lead harus `qualified` sebelum bisa jadi Opportunity |
| Rate limiting login | `express-rate-limit` — maks 5 attempt/IP/menit pada endpoint `/auth/login` |
| Threat modeling per fitur | Setiap fitur baru wajib ada analisis "apa yang bisa disalahgunakan?" sebelum dev |
| Order harus ada account | Service `OrderService.create()` validasi `account_id` wajib ada dan aktif |

---

### A05 — Security Misconfiguration
**Risiko di SFA:** Header HTTP bocorkan info server; Swagger terbuka di production; CORS terlalu lebar; debug mode aktif di prod.

| Mitigasi | Implementasi |
|---|---|
| Security headers | Gunakan **Helmet.js** — set `X-Frame-Options`, `X-Content-Type-Options`, `CSP`, dll |
| CORS dikonfigurasi ketat | Whitelist hanya `FRONTEND_URL` dari env var |
| Swagger hanya di non-prod | Guard Swagger UI dengan `if (process.env.APP_ENV !== 'production')` |
| Disable stack trace di prod | Error handler tidak expose `error.stack` ke response di production |
| Remove default credentials | Tidak ada default password; seed user wajib ganti password saat login pertama |

```typescript
// app.ts
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
if (process.env.APP_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}
```

---

### A06 — Vulnerable & Outdated Components
**Risiko di SFA:** Library npm yang digunakan punya CVE yang belum di-patch.

| Mitigasi | Implementasi |
|---|---|
| Audit dependency rutin | Jalankan `npm audit` setiap PR dan di CI/CD pipeline |
| Update dependency terjadwal | Review & update minor/patch setiap sprint |
| Gunakan Dependabot / Renovate | Auto PR untuk update dependency di GitHub |
| Pinned versions di `package.json` | Gunakan exact version atau `^` yang terkontrol |

---

### A07 — Identification & Authentication Failures
**Risiko di SFA:** Token tidak diinvalidasi saat logout; brute force password; token bocor via URL.

| Mitigasi | Implementasi |
|---|---|
| Refresh token rotation | Setiap `/auth/refresh` menghasilkan token baru; token lama diinvalidasi via Redis blocklist |
| Logout invalidasi token | `POST /auth/logout` masukkan `access_token` ke Redis blocklist hingga TTL habis |
| Brute force protection | Rate limit + lockout akun setelah 10 gagal login berturut-turut |
| Token tidak di URL | JWT **tidak pernah** dikirim via query string; selalu via `Authorization: Bearer` header |
| Password strength policy | Minimum 8 karakter, harus ada huruf besar, angka, simbol |

---

### A08 — Software & Data Integrity Failures
**Risiko di SFA:** File upload berbahaya (script dalam gambar); data order dimanipulasi saat transit.

| Mitigasi | Implementasi |
|---|---|
| Validasi file upload | Cek MIME type + ekstensi; batasi ukuran (maks 5MB); scan dengan `file-type` library |
| File disimpan di storage terpisah | Upload ke MinIO/S3, bukan di server Express langsung |
| Checksum data kritis | Order total dihitung ulang di server; client tidak bisa kirim `total_amount` langsung |
| CI/CD pipeline integrity | GitHub Actions menggunakan pinned action SHA, bukan branch/tag yang bisa berubah |

---

### A09 — Security Logging & Monitoring Failures
**Risiko di SFA:** Tidak ada jejak siapa yang mengakses/mengubah data; serangan tidak terdeteksi.

| Mitigasi | Implementasi |
|---|---|
| Request logging | **Morgan** log semua request: method, path, status, IP, user ID, response time |
| Audit trail di DB | Tabel `activities` type `status_change` catat semua perubahan state penting |
| Log autentikasi | Setiap login sukses/gagal dicatat dengan IP dan timestamp |
| Alert threshold | Bull queue monitor — alert jika job gagal > N kali |
| Log retention | Log disimpan minimal 90 hari; format JSON untuk kemudahan parsing |

```typescript
// Format log entry
{
  timestamp: "2026-06-28T12:00:00Z",
  level: "warn",
  event: "LOGIN_FAILED",
  ip: "192.168.1.1",
  email: "user@example.com",
  attempt: 3
}
```

---

### A10 — Server-Side Request Forgery (SSRF)
**Risiko di SFA:** Fitur integrasi webhook/ERP bisa dimanfaatkan untuk membuat server mengakses internal resource.

| Mitigasi | Implementasi |
|---|---|
| Whitelist URL eksternal | Validasi URL webhook hanya ke domain yang diizinkan (allowlist) |
| Blokir private IP range | Tolak request ke `10.x.x.x`, `192.168.x.x`, `127.x.x.x`, `169.254.x.x` |
| Tidak expose response mentah | Response dari external API tidak langsung diteruskan ke client tanpa sanitasi |
| Timeout & redirect control | Set timeout singkat; nonaktifkan auto-follow redirect pada HTTP client |

---

### Checklist Keamanan Pre-Deploy

| # | Checklist | Status |
|---|---|---|
| 1 | `npm audit` clean — tidak ada high/critical CVE | ☐ |
| 2 | Semua env var production sudah di-set & tidak di-commit | ☐ |
| 3 | HTTPS aktif, HTTP di-redirect ke HTTPS | ☐ |
| 4 | Swagger UI **disabled** di production | ☐ |
| 5 | Rate limiting aktif di endpoint auth | ☐ |
| 6 | CORS hanya izinkan domain frontend production | ☐ |
| 7 | `Helmet.js` aktif dengan CSP yang benar | ☐ |
| 8 | JWT secret panjang (≥ 256-bit) dan unik per environment | ☐ |
| 9 | Penetration test dasar pada endpoint kritis | ☐ |
| 10 | Log & monitoring aktif | ☐ |

> **Referensi:** [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/) · [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

---

## 10. ⚙️ Environment & Konfigurasi

```env
# App
APP_NAME=SFA
APP_ENV=development
APP_PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sfa_db
DB_USER=sfa_user
DB_PASSWORD=

# Authentication
JWT_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Storage
STORAGE_DRIVER=local          # local | s3 | cloudinary
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_S3_REGION=

# Notifications
WHATSAPP_API_URL=
WHATSAPP_API_KEY=
SENDGRID_API_KEY=
MAIL_FROM=noreply@sfa.com

# Maps
GOOGLE_MAPS_API_KEY=
VISIT_GEOFENCE_RADIUS_METERS=100

# FCM (Push Notification)
FCM_SERVER_KEY=
```

---

## 11. 🧪 Strategi Pengujian

| Jenis Test | Cakupan | Tools |
|---|---|---|
| Unit Test | Business logic, service layer | Jest / Vitest |
| Integration Test | API endpoint, DB query | Supertest |
| E2E Test | Alur kritis (login, input order, laporan) | Playwright / Cypress |
| Manual QA | UI, UX, mobile responsiveness | — |

**Alur kritis yang wajib di-test:**
- [ ] Login & refresh token
- [ ] Check-in / check-out kunjungan dengan GPS
- [ ] Konversi Lead → Opportunity → Order
- [ ] Kalkulasi realisasi vs. target
- [ ] Generate laporan & export

---

## 12. 📐 Konvensi & Standar Kode

### Naming Convention
| Konteks | Konvensi | Contoh |
|---|---|---|
| File/Folder | kebab-case | `customer-service.ts` |
| Komponen Vue | PascalCase | `PipelineKanban.vue` |
| Variabel/Fungsi | camelCase | `getOpportunityById()` |
| Konstanta | UPPER_SNAKE_CASE | `VISIT_GEOFENCE_RADIUS` |
| DB Table | snake_case plural | `opportunities`, `order_items` |
| DB Column | snake_case | `expected_close_date` |
| API Route | kebab-case | `/api/v1/lead-sources` |

### Git Convention
- **Branch**: `feat/M02-visit-checkin`, `fix/M03-pipeline-sorting`, `chore/setup-docker`
- **Commit**: Conventional Commits
  - `feat(M02): tambah GPS check-in kunjungan`
  - `fix(M03): perbaiki kalkulasi probabilitas opportunity`
  - `docs: update domain model di context.md`

---

## 13. 📌 Keputusan Arsitektur (ADR)

### ADR-001: Pendekatan Monorepo
- **Tanggal**: 2026-06-28
- **Status**: Proposed
- **Konteks**: Proyek memiliki web app dan kemungkinan mobile app di masa depan, serta backend API.
- **Keputusan**: Menggunakan struktur monorepo (`apps/web`, `apps/mobile`, `backend`) untuk memudahkan berbagi tipe & kontrak API.
- **Konsekuensi**: (+) Mudah berbagi kode. (-) Setup CI/CD lebih kompleks.

### ADR-002: [Judul]
- **Tanggal**: —
- **Status**: Proposed
- **Konteks**: —
- **Keputusan**: —
- **Konsekuensi**: —

---

## 14. 🗓️ Roadmap & Milestone

| Fase | Durasi | Deliverable |
|---|---|---|
| **Fase 0 — Setup** | 1 minggu | Arsitektur final, setup repo, DB schema, desain UI |
| **Fase 1 — Foundation** | 2 minggu | Auth, Master Data (User, Customer, Produk, Area) |
| **Fase 2 — Aktivitas** | 2 minggu | Visit log + GPS, Call log, Task & follow-up |
| **Fase 3 — Pipeline** | 2 minggu | Lead, Opportunity, Pipeline Kanban |
| **Fase 4 — Order** | 1 minggu | Input order, status tracking |
| **Fase 5 — Laporan** | 2 minggu | Dashboard, KPI, laporan, export |
| **Fase 6 — Notifikasi** | 1 minggu | WA/Email notif, pengingat otomatis |
| **MVP Launch** | — | Testing, bug fix, go-live |

---

## 15. ⚠️ Risiko & Mitigasi

| Risiko | Dampak | Probabilitas | Mitigasi |
|---|---|---|---|
| GPS tidak akurat di dalam gedung | High | High | Opsi manual input lokasi + toleransi radius |
| Salesperson tidak mau input data | High | Medium | UX simpel, mobile-first, gamifikasi |
| Data master tidak konsisten | Medium | Medium | Validasi ketat, approval workflow |
| Performa lambat saat data besar | Medium | Low | Indexing DB, pagination, caching |
| Integrasi ERP kompleks | High | Medium | Batasi scope di MVP, gunakan webhook |

---

## 16. 📝 Open Questions & TODO

### Open Questions
- [ ] Apakah sistem perlu mendukung multi-company / multi-tenant?
- [ ] Apakah ada integrasi dengan ERP yang sudah ada? (Odoo / SAP / custom?)
- [ ] Platform prioritas: Web atau Mobile?
- [ ] Apakah order perlu approval workflow bertingkat?
- [ ] Bagaimana skema komisi/insentif salesperson dihitung?
- [ ] Apakah kunjungan wajib ada foto bukti?

### Technical TODO
- [x] Finalisasi stack teknologi — Vue 3 + Express.js + PostgreSQL + Prisma
- [/] Buat schema DB → lihat [database.md](./database.md) (perlu tambah tabel `orders`, `order_items`, `targets`)
- [ ] Buat OpenAPI / Swagger spec di `docs/api/`
- [ ] Buat wireframe / mockup UI
- [ ] Setup repository & struktur proyek awal

---

## 17. 📚 Referensi

- [Salesforce CRM — Best Practices](https://www.salesforce.com)
- [HubSpot CRM — Referensi Fitur](https://www.hubspot.com/crm)
- [Pipedrive — Pipeline Reference](https://www.pipedrive.com)
- [Dokumentasi Framework](#) ← isi nanti
- [Figma / Design System](#) ← isi nanti
- [API Documentation / Swagger](#) ← isi nanti

---

*Terakhir diperbarui: 2026-06-28 — oleh: Jeffrey Herly*
