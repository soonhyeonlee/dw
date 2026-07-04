# 📦 더블원플러스 — 배포 리소스 (직접배포 APK)

이 폴더(`apps/mobile/_release/`)는 **직접배포용 APK**(사이드로드/공유 링크)를 날짜별로 정리해 둡니다.
Play Console 업로드용 스토어 자료(설명·스크린샷·아이콘·AAB)는 `../_store/` 를 보세요.

> APK 파일은 `.gitignore`(`*.apk`)로 git 에 올라가지 않습니다. 이 폴더는 로컬 정리/공유용입니다.

---

## 빌드별 목록

| 날짜 | 파일 | versionName / Code | 비고 |
|---|---|---|---|
| 2026-06-18 | `doublewin-06.18.apk` | 1.0.0 / 1 | 번개장터 상세 = 실제 상품정보 노출 개편 + 어드민 쇼핑몰 관리 추가 |

---

## 다운로드 / 설치

- **공유 링크(호스팅)**: https://i-homemarket.co.kr/doublewin/doublewin.apk
  - 개인정보처리방침과 같은 위치(`/www/doublewin/`)에 업로드해 둡니다.
- **사이드로드**: 안드로이드에서 위 링크로 받아 "출처를 알 수 없는 앱 설치 허용" 후 설치.
- **Play 스토어(정식)**: https://play.google.com/store/apps/details?id=com.doublewin.app

---

## 새 APK 만드는 법

```powershell
# apps/mobile/android 에서
.\gradlew.bat assembleRelease
# 결과: app/build/outputs/apk/release/app-release.apk (서명됨)
```

Play(정식 출시)는 APK 가 아니라 AAB:
```powershell
pwsh scripts/play-deploy/deploy.ps1 -Track production -Notes "출시노트"
```
