# DoubleWin (CEN) — 새 작업환경 온보딩 A→Z

> 새 PC에서 이 프로젝트를 처음부터 돌리고, Claude가 이전 맥락 그대로 이어받게 만드는 **완전 매뉴얼**.
> 급하면 [§B 3분 요약](#b-3분-요약)만 봐도 됨. 막히면 [§I 트러블슈팅](#i-트러블슈팅).

---

## A. 사전 준비물 (설치돼 있어야 함)

| 도구 | 용도 | 확인 |
|---|---|---|
| **Git** | 소스 클론/푸시 | `git --version` |
| **Node.js 20+** & npm | api/admin/mobile | `node -v` |
| **Docker Desktop** | PostgreSQL + Redis | `docker --version` |
| **GitHub CLI (`gh`)** | 계정 인증 | `gh --version` |
| Python 3.11+ *(선택)* | crawler | `python --version` |
| Expo / Android Studio *(모바일 할 때만)* | 앱 빌드·에뮬 | — |
| Claude Code | 이어서 작업 | — |

---

## B. 3분 요약

```bash
# 1) 클론
git clone https://github.com/soonhyeonlee/dw.git
cd dw

# 2) 세팅 (아래 중 하나)
#   Windows:
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
#   macOS / Linux / Git-Bash:
bash scripts/setup.sh

# 3) .env 실제 값 채우기  (§E 표 참고)

# 4) 실행
npm run api      # 백엔드  http://localhost:3000
npm run admin    # 관리자  http://localhost:3001
```

**Claude로 이어서 하려면**: 클론한 폴더에서 Claude Code를 열고 *"새 컴퓨터라 세팅해줘"* 라고 하면 `CLAUDE.md`를 읽고 `pc-setup` 에이전트가 나머지(메모리 복원 포함)를 자동 진행함.

---

## C. GitHub 인증 (푸시하려면 필수)

이 프로젝트는 **반드시 `soonhyeonlee` 계정**으로 push해야 함 (원격: `https://github.com/soonhyeonlee/dw.git`).

```bash
gh auth login --hostname github.com --git-protocol https --web
#  → 일회용 코드 표시 → Enter → 브라우저에서 코드 입력 → Authorize
gh auth status   # ✓ Logged in as soonhyeonlee 확인
```

> ⚠️ 다른 계정 자격증명(예: `minwookfromaichemist`)이 저장돼 있으면 그냥 `git push` 시 **403**. → [§I](#i-트러블슈팅).

일회용 PAT로 밀어야 할 때:
```bash
git push "https://soonhyeonlee:<PAT>@github.com/soonhyeonlee/dw.git" main
git remote set-url origin https://github.com/soonhyeonlee/dw.git   # 토큰 config에서 제거
```

---

## D. 프로젝트 구조

```
dw/  (repo root, npm workspaces monorepo — package name: doublewin)
├── apps/
│   ├── api/        NestJS 백엔드 (:3000) — TypeORM + PostgreSQL
│   ├── admin/      Next.js 관리자 대시보드 (:3001)
│   ├── mobile/     React Native (Expo) 앱
│   └── crawler/    Python 크롤러 (Google Places 등)
├── packages/
│   └── shared/     공유 TypeScript 타입
├── docker-compose.yml     postgres + redis + api + admin + crawler + nginx
├── nginx.conf             리버스 프록시
├── .env.example           환경변수 템플릿 (.env는 gitignore)
├── CLAUDE.md              Claude 자동로드 가이드
├── .claude/agents/pc-setup.md   첫 세팅 에이전트
├── docs/
│   ├── ONBOARDING.md       ← 이 문서
│   └── claude-memory/      로컬 Claude 메모리 스냅샷(28+개)
├── scripts/setup.ps1 / setup.sh   세팅 스크립트
├── HANDOFF.md              프로젝트 핸드오프(기능 상세)
└── PROJECT_PLAN.md         계획
```

---

## E. 환경변수 (`.env`)

`setup` 스크립트가 `.env.example` → `.env`로 복사만 함. **실제 값은 직접 채워야 함.**
실값 출처: 운영 **EC2 `.env`**(SSH `54.238.64.159`, [§H](#h-배포-요약) 참고), GCP 콘솔, 각 파트너 콘솔.

| 키 | 필요성 | 비고 |
|---|---|---|
| `DATABASE_*` | 필수 | 로컬은 docker-compose 기본값이면 대체로 OK |
| `JWT_SECRET`, `WEBHOOK_SECRET` | 필수 | 아무 강한 랜덤값. 운영은 EC2와 동일해야 토큰 호환 |
| `COUPANG_ACCESS_KEY/SECRET_KEY/PARTNER_ID` | 캐시백 핵심 | 있어야 affiliate `isEnabled()`=true → 실적립 |
| `NAVER_CLIENT_ID/SECRET/AFFILIATE_ID` | 제휴 | |
| `ELEVENTH_API_KEY/AFFILIATE_ID` | 제휴(11번가) | |
| `KAKAO_CLIENT_ID`, `NAVER_CLIENT_ID`, `GOOGLE_CLIENT_ID` | 소셜 로그인 | 카카오 완료, 네이버·구글은 OAuth 콘솔 등록 상태 확인 |
| `OPENAI_API_KEY`, `GEMINI_API_KEY` | LLM 기능 | |
| `MIN_WITHDRAWAL_AMOUNT`, `CASHBACK_RATE_PERCENT` | 정책값 | 기본 5000 / 50 |

> 🔒 **실키는 절대 레포에 커밋 금지.** `.env`, `.env.*`는 gitignore됨(`.env.example`만 트래킹). 레포의 `docs/claude-memory/` 스냅샷에 있던 실키는 이미 `‹REDACTED›` 처리됨.

---

## F. 로컬 실행

```bash
# DB/Redis (setup이 이미 띄웠으면 생략)
docker compose up -d postgres redis
docker compose ps            # 상태 확인

# 스키마 + 관리자 계정
npm run db:migrate
npm run seed                 # admin 계정 시드

# 개발 서버
npm run api                  # NestJS   http://localhost:3000
npm run admin                # Next.js  http://localhost:3001
npm run mobile               # Expo (QR/에뮬)
npm run crawler              # Python 크롤러 1회 (Python 필요)
```

전체 스택을 도커로: `docker compose up -d` (api/admin/crawler/nginx 포함).

---

## G. Claude 메모리 복원 (이어서 작업의 핵심)

이전 PC의 Claude 메모리는 `docs/claude-memory/`에 스냅샷으로 동봉됨(28+개 `.md`).
`pc-setup` 에이전트가 이걸 **로컬 Claude memory 폴더**
(`~/.claude/projects/<프로젝트슬러그>/memory/`)로 복사해 맥락을 되살림.

- 대상 폴더가 비어 있으면 전부 복사, 이미 있으면 **덮어쓰기 전 확인**.
- 복원 후 `MEMORY.md` 최상단 **"이어서 진입점"**이 다음 할 일의 시작점.
- 새로 알게 된 지속 정보는 로컬 memory에 저장하고, 커밋 전 `docs/claude-memory/`에도 동기화하면 다른 PC로 전파됨. **(실키 유입 금지 — push protection에 막힘)**

---

## H. 배포 요약

- **백엔드/관리자**: GitHub 안 거치고 **SSH 직접 배포**. EC2 `54.238.64.159` + tarball + `docker compose`.
  상세 절차 → `docs/claude-memory/reference_aws_deploy_workflow.md`. **백엔드 작업 전 반드시 먼저 읽기.**
- **카페24(아이홈마켓)**: FTP + 외부 DB IP 화이트리스트. → `docs/claude-memory/reference_cafe24_workflow.md`.
- **모바일**: 변경은 **앱 재빌드/OTA 필요** — 백엔드만 배포하면 앱에 반영 안 됨. 릴리스 키스토어 → `docs/claude-memory/reference_android_release_keystore.md`.

---

## I. 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| `git push` → **403 denied to minwookfromaichemist** | 다른 계정 자격증명 저장됨. `gh auth login`으로 `soonhyeonlee` 재로그인, 또는 일회용 PAT URL([§C](#c-github-인증-푸시하려면-필수)). Windows 자격증명 관리자에서 github.com 항목 삭제 후 재인증도 가능 |
| push → **repository rule violations / push cannot contain secrets** | 커밋에 실키 포함됨. 파일에서 키를 `‹REDACTED›`로 지우고 `git commit --amend` 후 재push. **allow(unblock) 하지 말 것** |
| `docker compose` 실패 | Docker Desktop 실행 여부 확인. 포트 5432/6379 충돌 시 기존 프로세스 종료 |
| `npm run seed` 실패 | DB 미기동/미마이그레이션. `docker compose ps` → `npm run db:migrate` 후 재시도 |
| **TypeORM** `DataTypeNotSupportedError` | `string \| null`/union 컬럼은 `@Column({ type: ... })` 타입 명시 필수 |
| **RN** sticky 헤더가 flex 깨뜨림 | `stickyHeaderIndices`는 직접 자식 wrapper `View`로 감싸고 안쪽에 진짜 flex 컨테이너 |
| affiliate 적립 안 됨 | `.env`의 `COUPANG_*` 비어 있으면 `isEnabled()`=false. 값 채우기 |

---

## J. 작업 스타일 (사용자 선호)

- 4지선다 확인 질문 지양 → **합리적 디폴트로 실행 후 보고.**
- 디자인 시안은 **Figma Make → Claude 코드 변환** 흐름.
- 앱 전면 디자인 = **T3 Quiet Mono** (화이트 + 코랄 `#F0410E`). `login_C`(소프트카드)는 폐기안 — 되돌리지 말 것.

---

## 관련 문서
- `CLAUDE.md` — Claude 자동로드 가이드(요약본)
- `HANDOFF.md` — 기능/구조 상세 핸드오프
- `PROJECT_PLAN.md` — 계획
- `docs/claude-memory/MEMORY.md` — 누적 메모리 인덱스 + "이어서 진입점"
