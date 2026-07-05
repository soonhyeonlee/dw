---
name: 안드로이드 에뮬레이터 + ADB 캡처 워크플로우
description: DoubleWin 모바일 QA 시 에뮬레이터 띄우는 검증된 절차 + 자주 마주치는 함정
type: reference
originSessionId: b07bfdb0-c89b-4665-acae-aef0ba33e817
---
DoubleWin 모바일 앱을 에뮬레이터에서 띄워 ADB 스크린샷으로 QA할 때의 검증된 절차.

## AVD
- 기본 AVD: `Pixel_7_Pro_API_30` (1440x3120, density 560) — 이전 샵백 캡처 #1~#5 모두 이 AVD 기준
- 보조 AVD: `Pixel_3a_API_36_extension_level_17_x86_64` (리소스 부족 시 대안)

## 시작 절차 (재시작 후 사용)

1. 락 파일 정리 (가끔 멀티인스턴스 락이 남음):
   ```bash
   find "$USERPROFILE/.android/avd/Pixel_7_Pro_API_30.avd" -maxdepth 2 -name "*.lock" -delete
   ```

2. PowerShell `Start-Process -PassThru`로 detached 실행 — Bash `&` 백그라운드는 부모 셸 종료 시 같이 죽음:
   ```powershell
   $p = Start-Process -FilePath "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -ArgumentList '-avd','Pixel_7_Pro_API_30','-no-snapshot-load' -PassThru -WindowStyle Normal
   Start-Sleep -Seconds 8
   if ($p.HasExited) { Write-Output "DEAD" } else { Write-Output "ALIVE PID=$($p.Id)" }
   ```

3. 부팅 대기 (보통 90~180초):
   ```bash
   ADB="$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe"
   for i in {1..60}; do
     STATE=$("$ADB" -s emulator-5554 shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
     [ "$STATE" = "1" ] && echo "BOOTED" && break
     sleep 4
   done
   ```

## ADB 캡처 명령
```bash
ADB="$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe"
"$ADB" -s emulator-5554 shell "screencap -p /sdcard/cap.png"
"$ADB" -s emulator-5554 pull /sdcard/cap.png /path/to/output.png
```

## 좌표 (1440x3120)
- 하단 탭 5개 y=2920 (Home=144, Categories=432, Watchlist=720, Earn More=1008, Account=1296)
- 샵백 동일 좌표

## DoubleWin 앱 검증 (2026-05-20 확립)
- 패키지: `com.doublewin.app`, expo-router scheme `doublewin`, Metro 포트 8081
- dev 검증 절차: ① debug APK 설치(`adb install -r android/app/build/outputs/apk/debug/app-debug.apk`) ② `npx expo start --dev-client` ③ `adb reverse tcp:8081 tcp:8081` ④ deep link 실행:
  `adb shell am start -a android.intent.action.VIEW -d "doublewin://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.doublewin.app`
- **특정 화면 바로 진입**: `adb shell am start -a android.intent.action.VIEW -d "doublewin://region/a1" com.doublewin.app` (탭 좌표 안 맞춰도 됨). 학원 mock id: a1~a5
- `_layout.tsx` 등 변경 후엔 `am force-stop` → 재실행 deep link로 풀 리로드

## 함정
- **Bash `&` 백그라운드 금지** — 부모 셸 종료 시 자식도 죽음. PowerShell `Start-Process` 또는 Bash 툴 `run_in_background:true`로 detach.
- **`tasklist` 빈 결과는 거짓** — 다른 세션 프로세스를 못 볼 수 있음. `Get-Process emulator` 또는 `$p.HasExited` 직접 확인.
- **AVD 락 파일** — 비정상 종료 시 `multiinstance.lock` 잔존. 시작 전 정리.
- **`adb pull` 경로 깨짐** — Git Bash가 `/sdcard/...`를 Windows 경로로 변환함. `MSYS_NO_PATHCONV=1` 붙이고 대상은 상대경로로 (`MSYS_NO_PATHCONV=1 adb pull /sdcard/x.png _out/x.png`).
- **`uiautomator dump`는 더블윈 안 잡힘** — RN 앱이라 백그라운드 ShopBack(`com.shopback.app`) 트리를 잡아옴. 좌표 탭/deep link로 우회.
- **Bash 툴 cwd 누적** — `cd android && ...` 후엔 cwd가 `apps/mobile/android`로 남음. 이후 상대경로 검사 시 절대경로 쓰거나 cwd 재설정.
- **release 빌드 첫 시도 실패 가능** — OneDrive 경로라 `:app:packageRelease`가 `IncrementalSplitterRunnable`(파일락)로 실패할 수 있음. 그냥 `./gradlew :app:packageRelease` 재시도하면 성공.
- **Expo dev server 시스템 리소스 경고** — "System resource exhausted" 발생 시 다른 무거운 프로세스 종료 후 재시도.
- **expo 패키지 버전 mismatch** — `npx expo install --check` 권장. 강제 진행 시 일부 기능 오작동 가능.

## 샵백 앱 진입
이미 로그인된 상태라면:
```bash
"$ADB" -s emulator-5554 shell "monkey -p com.shopback.app -c android.intent.category.LAUNCHER 1"
```
(`am start`는 액티비티가 not exported라 권한 거부됨)
