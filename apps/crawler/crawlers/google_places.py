"""
Google Places API → academies 테이블 수집기

- Nearby Search 로 (지역 좌표 × 키워드) 그리드 탐색
- googlePlaceId 로 dedup, 재실행 시 UPSERT
- 학원/어린이집 두 카테고리

비용 주의: Nearby Search $32/1000, Place Details $17/1000.
초기 풀 크롤(35 지역 × 2 키워드 × 3 페이지) ≈ 210 콜 ≈ $7. 이후 갱신은 ON CONFLICT 로 저렴.

필수 env:
  GOOGLE_PLACES_API_KEY  GCP 콘솔 → Places API 활성 후 발급한 키
"""

import os
import time
import logging
import requests

from db.repository import save_academies

logger = logging.getLogger('crawler.google_places')

PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place'
NEARBY_URL = f'{PLACES_API_BASE}/nearbysearch/json'
DETAILS_URL = f'{PLACES_API_BASE}/details/json'

# 검색 시드. 좌표는 각 행정구역 대략 중심점, radius 는 미터 단위.
# 필요시 더 추가하면 자동 확장.
SEARCH_AREAS = [
    # 서울 25구
    {'region': '서울 종로구',   'lat': 37.5731, 'lng': 126.9794, 'radius': 3000},
    {'region': '서울 중구',     'lat': 37.5636, 'lng': 126.9970, 'radius': 3000},
    {'region': '서울 용산구',   'lat': 37.5326, 'lng': 126.9905, 'radius': 3000},
    {'region': '서울 성동구',   'lat': 37.5634, 'lng': 127.0371, 'radius': 3000},
    {'region': '서울 광진구',   'lat': 37.5384, 'lng': 127.0824, 'radius': 3000},
    {'region': '서울 동대문구', 'lat': 37.5744, 'lng': 127.0398, 'radius': 3000},
    {'region': '서울 중랑구',   'lat': 37.6063, 'lng': 127.0926, 'radius': 3000},
    {'region': '서울 성북구',   'lat': 37.5894, 'lng': 127.0167, 'radius': 3000},
    {'region': '서울 강북구',   'lat': 37.6396, 'lng': 127.0257, 'radius': 3000},
    {'region': '서울 도봉구',   'lat': 37.6688, 'lng': 127.0471, 'radius': 3000},
    {'region': '서울 노원구',   'lat': 37.6542, 'lng': 127.0568, 'radius': 4000},
    {'region': '서울 은평구',   'lat': 37.6027, 'lng': 126.9291, 'radius': 4000},
    {'region': '서울 서대문구', 'lat': 37.5791, 'lng': 126.9368, 'radius': 3000},
    {'region': '서울 마포구',   'lat': 37.5638, 'lng': 126.9084, 'radius': 4000},
    {'region': '서울 양천구',   'lat': 37.5170, 'lng': 126.8665, 'radius': 3000},
    {'region': '서울 강서구',   'lat': 37.5509, 'lng': 126.8495, 'radius': 5000},
    {'region': '서울 구로구',   'lat': 37.4954, 'lng': 126.8874, 'radius': 4000},
    {'region': '서울 금천구',   'lat': 37.4569, 'lng': 126.8954, 'radius': 3000},
    {'region': '서울 영등포구', 'lat': 37.5264, 'lng': 126.8962, 'radius': 4000},
    {'region': '서울 동작구',   'lat': 37.5124, 'lng': 126.9393, 'radius': 3000},
    {'region': '서울 관악구',   'lat': 37.4784, 'lng': 126.9516, 'radius': 4000},
    {'region': '서울 서초구',   'lat': 37.4837, 'lng': 127.0324, 'radius': 4000},
    {'region': '서울 강남구',   'lat': 37.5172, 'lng': 127.0473, 'radius': 4000},
    {'region': '서울 송파구',   'lat': 37.5145, 'lng': 127.1059, 'radius': 4000},
    {'region': '서울 강동구',   'lat': 37.5301, 'lng': 127.1238, 'radius': 4000},
    # 경기 주요 도시
    {'region': '경기 성남시 분당구',  'lat': 37.3815, 'lng': 127.1190, 'radius': 5000},
    {'region': '경기 수원시 영통구',  'lat': 37.2526, 'lng': 127.0717, 'radius': 4000},
    {'region': '경기 고양시 일산서구', 'lat': 37.6743, 'lng': 126.7517, 'radius': 5000},
    {'region': '경기 용인시 수지구',  'lat': 37.3221, 'lng': 127.0962, 'radius': 4000},
    # 광역시
    {'region': '부산 해운대구', 'lat': 35.1631, 'lng': 129.1638, 'radius': 5000},
    {'region': '대구 수성구',   'lat': 35.8587, 'lng': 128.6300, 'radius': 5000},
    {'region': '인천 연수구',   'lat': 37.4099, 'lng': 126.6786, 'radius': 5000},
    {'region': '광주 서구',     'lat': 35.1521, 'lng': 126.8902, 'radius': 4000},
    {'region': '대전 유성구',   'lat': 36.3625, 'lng': 127.3563, 'radius': 5000},
    {'region': '울산 남구',     'lat': 35.5388, 'lng': 129.3309, 'radius': 5000},
]

# keyword = 구글 Places 검색어, category = academies.category 에 저장(모바일 칩/백엔드
# ACADEMY_CATEGORY_KEYWORDS 키와 동일해야 필터가 맞물림). 넓은 '학원'은 첫 타깃으로 두고,
# 세분 키워드가 같은 place 를 더 구체적 category 로 덮어쓴다(repository UPSERT 의 CASE).
SEARCH_TARGETS = [
    # 넓은 분류
    {'keyword': '학원',     'category': '학원'},
    {'keyword': '어린이집', 'category': '어린이집'},
    {'keyword': '유치원',   'category': '유치원'},
    # 격투/무술
    {'keyword': '복싱',        'category': '복싱'},
    {'keyword': '킥복싱',      'category': '킥복싱'},
    {'keyword': '주짓수',      'category': '주짓수'},
    {'keyword': '종합격투기',  'category': 'MMA'},
    {'keyword': '합기도',      'category': '합기도'},
    {'keyword': '유도',        'category': '유도'},
    {'keyword': '태권도',      'category': '태권도'},
    {'keyword': '검도',        'category': '검도'},
    # 헬스/피트니스
    {'keyword': '헬스장',      'category': '헬스클럽'},
    {'keyword': '크로스핏',    'category': '크로스핏'},
    {'keyword': 'PT 퍼스널트레이닝', 'category': 'PT샵'},
    {'keyword': '필라테스',    'category': '필라테스'},
    {'keyword': '요가',        'category': '요가'},
    {'keyword': '수영장',      'category': '수영'},
    {'keyword': '골프연습장',  'category': '골프'},
    # 교과
    {'keyword': '영어학원',    'category': '영어'},
    {'keyword': '수학학원',    'category': '수학'},
    {'keyword': '논술학원',    'category': '논술'},
    {'keyword': '과학학원',    'category': '과학'},
    {'keyword': '코딩학원',    'category': '코딩'},
    # 예체능
    {'keyword': '피아노학원',  'category': '피아노'},
    {'keyword': '미술학원',    'category': '미술'},
    {'keyword': '음악학원',    'category': '음악'},
    {'keyword': '발레학원',    'category': '무용'},
]


def fetch_nearby(api_key: str, lat: float, lng: float, radius: int, keyword: str,
                 language: str = 'ko', max_pages: int = 3) -> list[dict]:
    """Nearby Search 페이지네이션. next_page_token 활성화에 2초 딜레이 필요."""
    results: list[dict] = []
    params = {
        'key': api_key,
        'location': f'{lat},{lng}',
        'radius': radius,
        'keyword': keyword,
        'language': language,
    }
    next_token = None
    for page in range(max_pages):
        if next_token:
            time.sleep(2)
            params = {'key': api_key, 'pagetoken': next_token}
        try:
            r = requests.get(NEARBY_URL, params=params, timeout=15)
            data = r.json()
        except Exception as e:
            logger.error(f"Nearby Search 요청 실패: {e}")
            break

        status = data.get('status')
        if status not in ('OK', 'ZERO_RESULTS'):
            logger.warning(f"Nearby Search 비정상 status={status} err={data.get('error_message')}")
            break

        results.extend(data.get('results', []))
        next_token = data.get('next_page_token')
        if not next_token:
            break

    return results


def normalize(area: dict, target: dict, place: dict) -> dict:
    """Google Place 객체 → academies row dict."""
    pid = place.get('place_id')
    loc = (place.get('geometry') or {}).get('location') or {}
    return {
        'name': place.get('name', ''),
        'category': target['category'],
        'address': place.get('vicinity', '') or place.get('formatted_address', ''),
        'phone': '',  # Nearby 결과엔 없음. 필요시 Place Details 별도 호출
        'region': area['region'],
        'latitude': loc.get('lat'),
        'longitude': loc.get('lng'),
        'google_place_id': pid,
        'rating': place.get('rating'),
        'review_count': place.get('user_ratings_total') or 0,
        'photos': [],  # Photo reference → 실제 URL 변환은 별도 API 필요. 추후 추가
    }


class GooglePlacesCrawler:
    name = 'google_places'

    def __init__(self):
        self.logger = logging.getLogger(f'crawler.{self.name}')
        self.api_key = os.getenv('GOOGLE_PLACES_API_KEY')
        if not self.api_key:
            self.logger.warning('GOOGLE_PLACES_API_KEY 미설정 — 크롤러 비활성')

    def run(self):
        if not self.api_key:
            return 0, 0

        self.logger.info(f"{self.name} 크롤링 시작: {len(SEARCH_AREAS)} 지역 × {len(SEARCH_TARGETS)} 카테고리")
        total_collected = 0
        total_saved = 0

        for area in SEARCH_AREAS:
            for target in SEARCH_TARGETS:
                self.logger.info(f"  [{area['region']}] {target['keyword']}")
                try:
                    places = fetch_nearby(
                        self.api_key, area['lat'], area['lng'],
                        area['radius'], target['keyword'],
                        max_pages=2,  # 지역×카테고리당 최대 40건. 비용/시간 균형.
                    )
                    rows = [normalize(area, target, p) for p in places if p.get('place_id')]
                    saved = save_academies(rows)
                    self.logger.info(f"    수집 {len(rows)} / 저장 {saved}")
                    total_collected += len(rows)
                    total_saved += saved
                except Exception as e:
                    self.logger.error(f"    실패: {e}")

                time.sleep(1)  # 콜 간 보수적 딜레이

        self.logger.info(f"{self.name} 완료: 수집 {total_collected}건, 저장 {total_saved}건")
        return total_collected, total_saved
