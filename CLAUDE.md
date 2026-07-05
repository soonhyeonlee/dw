# DoubleWin (CEN) — Claude 작업 가이드

> 이 파일은 Claude Code가 모든 PC에서 자동 로드한다. **새 PC에서 처음 열었다면 아래 "새 PC 시작"부터.**

## 🚀 새 PC 시작 (첫 세팅)
1. **`pc-setup` 에이전트를 실행**해서 세팅을 자동 진행한다.
   - 사용자: "새 컴퓨터라 세팅해줘" / "이어서 하자" → Claude는 `pc-setup` 서브에이전트를 띄운다.
   - 수동으로 하려면: Windows `powershell -ExecutionPolicy Bypass -File scripts/setup.ps1`, 그 외 `bash scripts/setup.sh`.
2. 세팅 에이전트가 **Claude 메모리를 `docs/claude-memory/` → 로컬 memory 폴더로 복원**한다. 이걸 해야 이전까지의 작업 맥락이 살아난다.
3. 복원된 `MEMORY.md` 최상단의 **"이어서 진입점"**을 읽고 다음 작업을 잡는다.

## 프로젝트 구조 (npm workspaces, monorepo)
```
apps/api      NestJS 백엔드 (:3000) — TypeORM + PostgreSQL
apps/admin    Next.js 관리자 (:3001)
apps/mobile   React Native (Expo) 앱
apps/crawler  Python 크롤러 (Google Places 등)
packages/shared  공유 TS 타입
docker-compose.yml  postgres + redis + api + admin + crawler + nginx
```
자세한 실행/구조는 `HANDOFF.md`, `PROJECT_PLAN.md` 참고.

## 자주 쓰는 명령
```
npm run api      # 백엔드 dev
npm run admin    # 관리자 dev
npm run mobile   # Expo
npm run crawler  # 크롤러 1회
npm run db:migrate ; npm run seed   # DB 스키마 + 관리자 시드
```

## Git / 배포
- 원격: `origin = https://github.com/soonhyeonlee/dw.git` (비공개). **반드시 `soonhyeonlee` 계정으로 push** — 다른 계정 자격증명 저장 시 403. 막히면 `gh auth login`으로 `soonhyeonlee` 로그인.
- 백엔드 배포는 GitHub 안 거치고 **SSH 직접 배포**(EC2 54.238.64.159 + tarball + docker compose). 절차는 `docs/claude-memory/reference_aws_deploy_workflow.md`.
- 카페24(아이홈마켓) 작업 SOP: `docs/claude-memory/reference_cafe24_workflow.md`.

## 지켜야 할 함정 (과거에 당한 것들)
- **TypeORM**: `string | null` / union literal 컬럼은 `@Column({ type: ... })`로 타입 명시 필수 — 안 하면 `DataTypeNotSupportedError`.
- **RN ScrollView**: `stickyHeaderIndices`는 직접 자식의 flex를 깨뜨림 → wrapper `View`로 감싸고 안쪽에 진짜 flex 컨테이너.
- **비밀키 절대 커밋 금지**: `.env`는 gitignore됨(`.env.example`만 트래킹). 실키는 EC2 `.env`에만.
- **모바일 변경은 앱 재빌드/OTA 필요** — 백엔드만 배포하면 앱에 반영 안 됨.

## 작업 스타일 (사용자 선호)
- 4지선다 확인 질문 지양. **합리적 디폴트로 실행 후 보고**.
- 디자인 시안은 Figma Make → Claude가 코드 변환.
- 앱 전면 디자인 = **T3 Quiet Mono**(화이트 + 코랄 `#F0410E`). `login_C`(소프트카드)는 폐기안, 되돌리지 말 것.

## 맥락의 원천
- `docs/claude-memory/` = 이전 세션들의 축적 메모리(28+ 파일). **로컬 memory 폴더로 복원해서 사용.** 세션 종합/진입점은 `MEMORY.md`.
- 새로 알게 된 지속 정보는 로컬 memory 폴더에 저장하고, 커밋 전 `docs/claude-memory/`에도 동기화하면 다른 PC로 전파된다.
