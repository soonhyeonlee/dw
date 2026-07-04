# 🤖 Play 자동 배포 파이프라인

빌드 → 업로드를 **명령 한 줄**로. (Google Play Developer API + 서비스 계정, Ruby/Expo 불필요)

```
deploy.ps1        # versionCode +1 → AAB 빌드 → 내부테스트 트랙 업로드
play_deploy.py    # AAB 업로드만 하는 코어 스크립트
requirements.txt  # 파이썬 의존성 (이미 설치됨)
```

---

## ⚙️ 1회 설정 (사장님이 처음 한 번만 — 약 5분)

### A. 첫 출시는 콘솔로 먼저
> **중요:** Play API 는 *앱의 첫 버전*은 못 올립니다. 첫 출시 1회만 콘솔에서 수동 업로드하세요
> (`apps/mobile/_store/` 자료 사용). **그 다음부터** 이 파이프라인이 동작합니다.

### B. 서비스 계정 키 발급 + 권한 연결
1. **Google Cloud Console** (https://console.cloud.google.com)
   - 프로젝트 선택(또는 새로 만들기)
   - **API 및 서비스 → 라이브러리** → `Google Play Android Developer API` 검색 → **사용 설정**
   - **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → 서비스 계정**
     - 이름 예: `play-deploy` → 만들고 완료
   - 만든 서비스 계정 클릭 → **키 탭 → 키 추가 → 새 키 만들기 → JSON** → 다운로드
2. **Play Console** (https://play.google.com/console)
   - 왼쪽 맨 아래 **설정 → API 액세스**
   - 위에서 만든 **Google Cloud 프로젝트를 연결**
   - 해당 **서비스 계정**에 **액세스 권한 부여** →
     권한: **앱 출시 관리(릴리스)** + **프로덕션·테스트 트랙 출시** 체크 → 초대/저장
   - (권한이 적용되기까지 몇 분 걸릴 수 있음)

### C. 키 파일 배치
다운로드한 JSON 을 아래 경로에 저장 (이 경로는 git 에 안 올라가도록 이미 처리됨):
```
apps/mobile/_secrets/play-service-account.json
```
> 다른 경로면 환경변수로: `$env:PLAY_SA_KEY = "D:\keys\play.json"`

설정 끝!

---

## 🚀 사용 (이후 매 업데이트마다)

PowerShell 에서 `apps/mobile` 폴더 기준:

```powershell
# 내부 테스트 트랙으로 (가장 안전, 권장 — 본인 기기에서 먼저 확인)
pwsh scripts/play-deploy/deploy.ps1

# 프로덕션 즉시 출시 + 출시노트
pwsh scripts/play-deploy/deploy.ps1 -Track production -Notes "우리지역 사진·검색 개선"

# 단계적 출시(10%)로 프로덕션
python scripts/play-deploy/play_deploy.py --track production --status inProgress --rollout 0.1

# 이미 빌드해둔 AAB 만 업로드 (빌드 스킵)
pwsh scripts/play-deploy/deploy.ps1 -SkipBuild
```

`deploy.ps1` 이 하는 일:
1. `build.gradle` 의 `versionCode` 를 자동으로 +1 (Play 는 같은 versionCode 재업로드를 거부함)
2. `gradlew.bat bundleRelease` 로 AAB 빌드
3. `play_deploy.py` 로 선택한 트랙에 업로드 + 커밋

---

## 🔍 확인
- 콘솔 → **출시 → (해당 트랙)** 에서 *검토 중 → 게시됨*
- 공개 페이지: https://play.google.com/store/apps/details?id=com.doublewin.app

## 🆘 자주 나는 오류
| 메시지 | 원인/해결 |
|---|---|
| `...first version...` / draft 관련 | 아직 첫 출시 전 → 콘솔에서 1회 수동 업로드 후 재시도 |
| `403 ... does not have permission` | Play 콘솔 API 액세스에서 서비스 계정 권한 미부여/전파 대기 |
| `versionCode N has already been used` | `-NoBump` 빼고 다시 실행(자동 +1) 하거나 build.gradle 수동 증가 |
| `APK specifies ... that has already been used` | 동일 — versionCode 증가 필요 |

> 참고: Expo EAS 로도 가능(`eas.json` 의 `submit.production.android.serviceAccountKeyPath` 에 위 키 경로 넣고 `eas submit`).
> 단 EAS 는 Expo 계정 로그인이 필요해, 본 파이썬 파이프라인이 더 가볍습니다.
