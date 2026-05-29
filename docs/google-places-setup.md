# Google Places API 키 발급 + 배포 가이드

학원·어린이집을 Google Maps 기반으로 수집하려면 Google Places API 키 + 결제 등록이 필요합니다. Claude 가 GCP 콘솔에 인터랙티브 로그인할 수 없어 이 부분만 사용자 액션입니다.

## 1. GCP 콘솔 로그인 + 프로젝트 생성

1. https://console.cloud.google.com 접속, `mvcorp.top@gmail.com` 계정으로 로그인
2. 상단 프로젝트 드롭다운 → "새 프로젝트"
3. 프로젝트 이름: `doublewin-places` (자유)
4. 만들기

## 2. Places API (Legacy) 활성화

⚠️ Google Maps API 는 "Places API" 와 "Places API (New)" 두 종류가 있습니다. 우리 크롤러는 **Legacy** (`maps.googleapis.com/maps/api/place/...`) 를 사용합니다.

1. 좌측 메뉴 → "APIs & Services" → "라이브러리"
2. "Places API" 검색 (New 아님)
3. 사용 설정

## 3. 결제 계정 연결 (필수)

Places API 는 무료 크레딧 $200/월 이 있지만 결제 정보 등록은 필수입니다.

1. "결제" → "결제 계정 연결"
2. 카드 등록 (필요한 경우)
3. 프로젝트에 결제 계정 연결

**예상 비용 (초기 설계 기준)**:
- 풀 크롤 1회: ~$7 (35 지역 × 2 카테고리 × Nearby Search)
- 주간 갱신 (`schedule` 모드): 월 ~$30
- $200 무료 크레딧 안에서 안정 운영 가능

## 4. API 키 발급 + 제한 설정

1. "APIs & Services" → "사용자 인증 정보"
2. "+ 사용자 인증 정보 만들기" → "API 키"
3. 발급된 키 복사 (예: `AIza...`)
4. 키 편집 → API 제한사항 → "Places API" 만 선택 (보안)
5. 애플리케이션 제한사항은 "IP 주소" 로 EC2 외부 IP (`54.238.64.159`) 등록 권장

## 5. EC2 에 키 등록

```bash
ssh -i ~/.ssh/doublewin-key.pem ec2-user@54.238.64.159
cd doublewin
echo 'GOOGLE_PLACES_API_KEY=AIza...붙여넣기' | sudo tee -a .env
```

⚠️ PowerShell 에서 `tee -a` 로 echo 하면 UTF-16 BOM 이 붙어 docker compose 가 .env 파싱에 실패합니다. 반드시 EC2 내부 bash 에서 실행하거나 ASCII scp 패턴 사용.

`docker-compose.yml` 의 crawler 서비스 `environment:` 블록에도 매핑 추가:

```yaml
crawler:
  environment:
    GOOGLE_PLACES_API_KEY: ${GOOGLE_PLACES_API_KEY}
```

## 6. RDS 스키마 마이그레이션

academy 엔티티에 `latitude/longitude/googlePlaceId/source` 컬럼이 추가됐습니다. 프로덕션은 synchronize 비활성이므로 수동 적용:

```bash
ssh -i ~/.ssh/doublewin-key.pem ec2-user@54.238.64.159
cd doublewin
sudo docker exec -i doublewin-postgres psql -U doublewin doublewin < apps/api/migrations/2026-05-29-academy-geo.sql
```

(RDS 직접 사용 시: psql 클라이언트로 같은 SQL 적용)

## 7. API 컨테이너 재배포 + 1회 크롤 트리거

```bash
# API 새 코드 반영 (entity 변경 포함)
sudo docker compose up -d --build doublewin-api

# Google Places 1회 수집
sudo docker compose run --rm -e CRAWLER_MODE=places_once doublewin-crawler

# 결과 확인
sudo docker exec -i doublewin-postgres psql -U doublewin doublewin -c \
  "SELECT region, category, count(*) FROM academies WHERE source='google_maps' GROUP BY region, category ORDER BY region;"
```

## 8. 모바일 APK 재빌드

`expo-location` 네이티브 모듈 추가 + AndroidManifest 위치 권한 추가됐으므로 새 APK 빌드 필요:

```bash
cd apps/mobile/android
./gradlew :app:assembleRelease
```

산출물: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

## 9. 검증 시나리오

- 우리지역 탭 → **전체 보기**: 전국 학원/어린이집 (rating 정렬) 표시
- **내 주변 5km**: 위치 권한 허용 → 현재 좌표 기반 거리 정렬, 카드에 `1.2km` 같은 거리 뱃지
- 카테고리 칩 "어린이집" 누르면 어린이집만 필터
- 검색창에 학원명 일부 입력 → 클라이언트 필터 (서버 keyword 도 지원)
