<#
.SYNOPSIS
  더블원플러스 — 빌드 + Play 자동 업로드 (한 방).
  versionCode 자동 +1 → AAB 빌드 → Play 트랙 업로드.

.EXAMPLE
  # 내부 테스트 트랙(기본)
  pwsh scripts/play-deploy/deploy.ps1

  # 프로덕션 즉시 출시 + 출시노트
  pwsh scripts/play-deploy/deploy.ps1 -Track production -Notes "우리지역 사진/검색 개선"

  # versionCode 안 올리고(이미 올림) 업로드만
  pwsh scripts/play-deploy/deploy.ps1 -NoBump

  # 빌드 건너뛰고 기존 AAB만 업로드
  pwsh scripts/play-deploy/deploy.ps1 -SkipBuild
#>
param(
  [ValidateSet("internal","alpha","beta","production")]
  [string]$Track = "internal",
  [ValidateSet("completed","draft","inProgress","halted")]
  [string]$Status = "completed",
  [string]$Notes = "",
  [switch]$NoBump,
  [switch]$SkipBuild
)
$ErrorActionPreference = "Stop"
$mobile  = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$gradle  = Join-Path $mobile "android\app\build.gradle"
$aab     = Join-Path $mobile "android\app\build\outputs\bundle\release\app-release.aab"

# 1) versionCode 자동 +1 (Play 는 중복 versionCode 거부)
if (-not $NoBump) {
  $txt = Get-Content $gradle -Raw
  if ($txt -match 'versionCode\s+(\d+)') {
    $cur = [int]$Matches[1]; $next = $cur + 1
    $txt = $txt -replace 'versionCode\s+\d+', "versionCode $next"
    Set-Content $gradle $txt -Encoding utf8
    Write-Host "• versionCode $cur -> $next" -ForegroundColor Cyan
  } else { throw "build.gradle 에서 versionCode 를 못 찾음" }
}

# 2) AAB 빌드
if (-not $SkipBuild) {
  Write-Host "• AAB 빌드 중..." -ForegroundColor Cyan
  Push-Location (Join-Path $mobile "android")
  try { & .\gradlew.bat bundleRelease } finally { Pop-Location }
  if ($LASTEXITCODE -ne 0) { throw "gradle 빌드 실패" }
}

# 3) Play 업로드
Write-Host "• Play 업로드 중..." -ForegroundColor Cyan
$py = Join-Path $PSScriptRoot "play_deploy.py"
$pyArgs = @($py, "--aab", $aab, "--track", $Track, "--status", $Status)
if ($Notes) { $pyArgs += @("--notes", $Notes) }
& python @pyArgs
if ($LASTEXITCODE -ne 0) { throw "업로드 실패" }
Write-Host "`n🎉 배포 파이프라인 완료" -ForegroundColor Green
