# 맘카페 코드 위치 & getEnforcing 크래시 전달

## 1. 맘카페 코드 위치

| 역할 | 경로 |
|------|------|
| **화면 본체** (카페 목록·UI 전부) — 핵심, 여기만 보면 됨 | `apps/mobile/app/(tabs)/momcafe.tsx` |
| 탭 등록 (하단 4번째 탭) | `apps/mobile/app/(tabs)/_layout.tsx` (75~82행) |
| 지역상세 내 맘카페 연결부 | `apps/mobile/app/region/[id].tsx` |
| API | `apps/mobile/src/api/region.ts` |

카페 URL·회원수는 `momcafe.tsx` 안 `FEATURED` / `REGIONS` 배열에 하드코딩돼 있음.

## 2. `turboModuleRegistry.getEnforcing` 크래시

**맘카페 코드 버그 아님.** `momcafe.tsx`는 RN 코어 + `@expo/vector-icons` + `react-native-safe-area-context`만 쓰고, 이 모듈들은 홈·마이 등 다른 탭에서도 똑같이 쓰임. 새 네이티브 모듈 호출 없음.

**에러 뜻:** JS 번들이 요구하는 네이티브 모듈이 지금 실행 중인 앱 바이너리에 없음 = **JS ↔ 네이티브 빌드 불일치**.

이 프로젝트는 `android/` 폴더 있는 dev client 구조라 원인은 보통 둘 중 하나:

1. **Expo Go로 실행함** → 이 앱 커스텀 네이티브 모듈(카카오 로그인 등)이 Expo Go엔 없음. **Expo Go 쓰지 말 것.**
2. **오래된 dev client/APK에 최신 JS만 붙임** → 네이티브 추가된 이후 재빌드 안 함.

### 해결

```bash
cd apps/mobile
npx expo prebuild --clean     # 네이티브 꼬였을 때만
npx expo run:android          # dev client 재빌드+설치
```

그래도 안 되면: `node_modules` 재설치 + `npx expo start -c` (Metro 캐시 클리어)

> **원인 확정하려면** 에러 메시지에서 `'____' could not be found` 의 **모듈 이름**을 알려줘.
> (예: `RNCSafeAreaContext` = safe-area-context 미링크 / 카카오 등 특정 이름 = 그 패키지 재빌드 누락)
