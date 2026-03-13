# TASKLOG — 배포 가이드

## 프로젝트 구조
```
project/
├── frontend/        # React (Vite) → GitHub Pages
├── backend/         # Express.js  → Render.com
├── database/        # schema.sql  → Supabase
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## 1. Supabase 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. SQL Editor에서 `database/schema.sql` 전체 실행
3. Settings → Database → Connection string (URI) 복사

---

## 2. 백엔드 (Render.com)

### 로컬 테스트
```bash
cd backend
cp .env.example .env
# .env의 DATABASE_URL, JWT_SECRET 입력
npm install
npm run dev
```

### Render.com 배포
1. [render.com](https://render.com) → New Web Service
2. GitHub 레포 연결 → Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables 설정:
   - `DATABASE_URL` = Supabase Connection URI
   - `JWT_SECRET` = 랜덤 문자열 (최소 32자)
   - `JWT_EXPIRES_IN` = `7d`
   - `NODE_ENV` = `production`
6. 배포 후 서비스 URL 복사 (예: `https://tasklog-api.onrender.com`)

> ⚠️ Render Free 플랜은 15분 비활성 시 슬립됩니다. 첫 요청이 느릴 수 있어요.

---

## 3. 프론트엔드 (GitHub Pages)

### 설정 수정
```js
// frontend/vite.config.js
base: '/YOUR-REPO-NAME/',

// frontend/src/App.jsx
<BrowserRouter basename="/YOUR-REPO-NAME">
```

### 로컬 테스트
```bash
cd frontend
cp .env.example .env
# .env의 VITE_API_URL = http://localhost:4000
npm install
npm run dev
```

### GitHub Actions 자동 배포
1. 레포 → Settings → Pages → Source: `gh-pages` 브랜치
2. Secrets → Actions에 추가:
   - `VITE_API_URL` = Render 백엔드 URL
3. `main` 브랜치에 push → 자동 빌드 및 배포

### 수동 배포
```bash
cd frontend
VITE_API_URL=https://your-backend.onrender.com npm run build
# dist/ 폴더를 gh-pages 브랜치에 push
```

---

## API 명세 요약

| Method | Endpoint | Auth | 설명 |
|--------|----------|------|------|
| POST | `/api/auth/register` | ✗ | 회원가입 |
| POST | `/api/auth/login` | ✗ | 로그인 |
| GET | `/api/auth/profile` | ✓ | 프로필 조회 |
| PUT | `/api/auth/profile` | ✓ | 프로필/비번 수정 |
| DELETE | `/api/auth/profile` | ✓ | 회원 탈퇴 |
| GET | `/api/tasks` | ✓ | 할 일 목록 |
| POST | `/api/tasks` | ✓ | 할 일 추가 |
| PUT | `/api/tasks/:id` | ✓ | 할 일 수정 |
| DELETE | `/api/tasks/:id` | ✓ | 할 일 삭제 |
| GET | `/api/logs?date=&from=&to=&task_id=` | ✓ | 로그 조회 |
| POST | `/api/logs` | ✓ | 로그 기록/수정 |
| DELETE | `/api/logs/:id` | ✓ | 로그 삭제 |
| GET | `/api/stats?task_id=&from=&to=` | ✓ | 통계 조회 |

인증: `Authorization: Bearer <JWT_TOKEN>` 헤더

---

## 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18 + Vite + React Router v6 + Recharts |
| 백엔드 | Node.js + Express 4 + bcryptjs + jsonwebtoken |
| DB | Supabase (PostgreSQL) |
| 배포 | GitHub Pages + Render.com Free |
