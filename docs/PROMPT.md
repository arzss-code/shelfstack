Saya ingin melanjutkan pengembangan project ShelfStack sebagai project portfolio full-stack yang production-like.

Jangan langsung coding. Pertama lakukan audit menyeluruh terhadap codebase saat ini untuk memahami:

1. Arsitektur project
2. Fitur yang sudah selesai
3. Fitur yang sedang berjalan
4. Tech stack yang sudah digunakan
5. API/server routes
6. Database/schema Supabase
7. Authentication & authorization
8. State management
9. Testing (Vitest/Playwright)
10. Struktur folder dan coding pattern
11. Backlog/roadmap yang sudah ada
12. Bagian yang masih dummy/mock atau belum production-ready

Gunakan codebase sebagai source of truth. Jangan mengasumsikan fitur sudah ada hanya karena namanya ada di dokumentasi/backlog.

KONTEKS:
Project ini adalah ShelfStack, aplikasi e-commerce dengan frontend Nuxt/Vue + TypeScript dan Supabase. Project saat ini sudah memiliki beberapa fitur seperti authentication, product management, cart, order management, admin dashboard, payment integration, order state machine, API/server routes, Vitest, dan Playwright.

Tujuan saya sekarang BUKAN sekadar menambah CRUD atau mengulang materi dasar.

Saya ingin:

- memperdalam kemampuan full-stack,
- membuat ShelfStack semakin production-like,
- mempelajari teknologi industri yang relevan,
- memahami architecture/backend/deployment,
- tetap mengembangkan fitur nyata di project,
- dan menghindari belajar terlalu banyak teknologi secara dangkal.

ROADMAP YANG SAYA INGINKAN:

PHASE 1 — Backend dengan Node.js + TypeScript
Pelajari dan implementasikan secara bertahap:

- Node.js
- TypeScript
- REST API
- authentication/authorization
- validation
- middleware
- error handling
- logging
- pagination/filtering
- file upload
- environment configuration

Jika codebase saat ini menggunakan Nuxt/Nitro server routes, analisis apakah sebagian backend layak dipisahkan menjadi standalone Node.js API.

JANGAN langsung memindahkan seluruh backend.
Pilih 1 fitur/modul yang paling tepat sebagai pilot project.

Contoh:
Nuxt Frontend
↓
Node.js API
↓
Supabase/PostgreSQL

PHASE 2 — Database & Backend Architecture
Perdalam:

- PostgreSQL
- relational database design
- indexing
- transaction
- foreign key
- query optimization
- API contract
- DTO/schema validation

Tetap gunakan Supabase/PostgreSQL jika memang masih sesuai.
Jangan mengganti Supabase hanya demi mengganti teknologi.

PHASE 3 — Docker
Setelah backend pilot stabil, tambahkan:

- Dockerfile
- Docker Compose
- environment variables
- frontend container
- backend container
- PostgreSQL jika memang diperlukan
- networking antar-container

PHASE 4 — Redis
Jika architecture sudah membutuhkan:

- caching
- rate limiting
- session/temporary data
- queue

pelajari dan implementasikan Redis pada use case nyata.

PHASE 5 — Background Jobs
Jika relevan, gunakan:

- BullMQ
- Redis

Contoh use case:

- email notification
- invoice generation
- order processing
- asynchronous notification

Jangan menambahkan queue hanya untuk mengikuti tren. Harus ada alasan arsitektural.

PHASE 6 — CI/CD
Implementasikan pipeline menggunakan GitHub Actions atau teknologi yang paling sesuai.

Minimal:
Push
→ lint
→ typecheck
→ unit test
→ E2E test
→ build
→ deploy

PHASE 7 — Cloud/Deployment
Setelah CI/CD stabil, pelajari deployment:

- VPS/cloud
- reverse proxy
- HTTPS
- domain
- environment secrets
- monitoring dasar

AWS/GCP/Azure boleh dipelajari setelah fundamental deployment dipahami.

PHASE 8 — Firebase
Firebase dipelajari sebagai ALTERNATIVE ecosystem, bukan pengganti Supabase secara otomatis.

Bandingkan:
Supabase:

- PostgreSQL
- SQL
- RLS
- Storage
- Auth

vs

Firebase:

- Firestore
- NoSQL
- Security Rules
- Storage
- Auth

Kalau ada use case yang cocok, boleh buat experimental branch/module kecil menggunakan Firebase.
Jangan migrasikan ShelfStack dari Supabase ke Firebase kecuali ada alasan teknis yang kuat.

PHASE 9 — Laravel
Laravel bukan prioritas pertama.
Setelah Node.js/backend architecture sudah cukup kuat, buat assessment apakah Laravel layak dipelajari berdasarkan kebutuhan karier dan value untuk project.

TARGET FITUR:
Selain belajar technology stack, terus kembangkan ShelfStack dengan fitur yang memiliki nilai engineering nyata.

Prioritaskan fitur seperti:

- order management
- inventory
- payment
- cancellation/refund
- admin analytics
- notification
- audit log
- role/permission
- reporting
- background processing
- API integration
- search/filter/sorting
- pagination
- error handling
- security
- observability

Hindari fitur CRUD sederhana hanya untuk menambah jumlah fitur.

QUALITY REQUIREMENTS:
Setiap perubahan harus:

1. Tidak merusak fitur existing.
2. Mengikuti architecture/pattern yang sudah digunakan.
3. Menggunakan TypeScript dengan typing yang jelas.
4. Memiliki validation.
5. Memiliki loading/error state jika relevan.
6. Memiliki test yang relevan.
7. Memperbarui dokumentasi jika architecture berubah.
8. Tidak hardcode secret/API key.
9. Memperhatikan security.
10. Tidak menambahkan dependency tanpa alasan.

TESTING:
Project sudah memiliki Vitest dan Playwright.

Gunakan:

- Vitest untuk unit/business logic.
- Playwright untuk E2E.
- Manual testing jika diperlukan.

Untuk Playwright, jika sudah ada test langsung di spec file, pertimbangkan Page Object Model jika memang membantu maintainability.

DEVELOPMENT STRATEGY:
Jangan mengubah banyak hal sekaligus.

Gunakan pendekatan:

AUDIT
↓
PILIH 1 USE CASE
↓
DESIGN
↓
IMPLEMENT
↓
TEST
↓
DOCUMENT
↓
REVIEW
↓
LANJUT KE PHASE BERIKUTNYA

SEBELUM CODING:
Berikan saya terlebih dahulu:

A. Current Architecture
B. Current Tech Stack
C. Fitur yang sudah tersedia
D. Fitur yang belum selesai
E. Technical debt
F. Bagian yang masih dummy/mock
G. Testing coverage yang sudah ada
H. Kandidat fitur terbaik untuk dikembangkan
I. Kandidat teknologi baru yang paling cocok
J. Risiko jika kita menambahkan teknologi tersebut

Kemudian buat:

ROADMAP 1–3 BULAN

yang realistis dan berurutan.

Untuk setiap phase tampilkan:

- Objective
- Technology
- Fitur yang dikembangkan
- File/folder yang kemungkinan berubah
- Knowledge yang saya dapat
- Testing yang harus dibuat
- Definition of Done

PRIORITAS:
Jika harus memilih antara:
A. belajar teknologi baru,
B. memperbaiki architecture,
C. membuat fitur baru,

pilih yang memberikan learning value + engineering value paling besar untuk ShelfStack.

Jangan mengejar jumlah teknologi.

Saya ingin pada akhirnya ShelfStack menunjukkan kemampuan:

Frontend

- Backend
- Database
- Authentication
- API
- Testing
- Docker
- Redis/Queue
- CI/CD
- Cloud/Deployment
- Security
- Software Architecture

Sekali lagi:
JANGAN langsung coding.
Mulai dengan audit codebase dan berikan rekomendasi roadmap berdasarkan kondisi ShelfStack yang benar-benar ada sekarang.
