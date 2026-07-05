# DoubleWin(CEN) 첫 PC 셋업 스크립트 (Windows PowerShell)
# 멱등: 여러 번 실행해도 안전. 실행: powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "▶ 1/6  필수 도구 확인"
$missing = $false
foreach ($c in @("git","node","npm","docker")) {
  $p = (Get-Command $c -ErrorAction SilentlyContinue)
  if ($null -eq $p) { Write-Host "  ✗ '$c' 없음 — 먼저 설치하세요"; $missing = $true }
  else { Write-Host "  ✓ $c $($p.Source)" }
}
if ($missing) { Write-Host "필수 도구 설치 후 다시 실행"; exit 1 }

Write-Host "▶ 2/6  .env 준비"
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "  → .env 생성됨. ⚠️ DB비번/JWT_SECRET/COUPANG·NAVER·LLM 키를 직접 채워야 함"
} else { Write-Host "  ✓ .env 이미 존재 (유지)" }

Write-Host "▶ 3/6  DB/Redis 컨테이너 기동"
docker compose up -d postgres redis

Write-Host "▶ 4/6  의존성 설치 (npm workspaces)"
npm install

Write-Host "▶ 5/6  DB 마이그레이션 + 관리자 시드"
try { npm run db:migrate } catch { Write-Host "  (마이그레이션 스킵/실패 — DB 준비 후 재시도 가능)" }
try { npm run seed }       catch { Write-Host "  (시드 스킵/실패 — 이미 있거나 DB 미준비)" }

Write-Host "▶ 6/6  완료. 실행 명령:"
Write-Host "  npm run api      # 백엔드  http://localhost:3000"
Write-Host "  npm run admin    # 관리자  http://localhost:3001"
Write-Host "  npm run mobile   # 모바일 (Expo)"
Write-Host "  npm run crawler  # 크롤러 (Python 필요, 1회)"
Write-Host "✅ setup.ps1 종료"
