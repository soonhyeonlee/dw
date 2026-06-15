"""상품 DB 저장 (UPSERT)"""

import logging
from .connection import get_connection

logger = logging.getLogger('crawler.db')

UPSERT_SQL = """
INSERT INTO products (
    platform, "externalId", title, price, "originalPrice",
    "discountRate", "imageUrl", "productUrl", "affiliateUrl",
    "cashbackRate", "cashbackAmount", category, rating, "reviewCount",
    "isActive", "createdAt", "updatedAt"
) VALUES (
    %(platform)s, %(external_id)s, %(title)s, %(price)s, %(original_price)s,
    %(discount_rate)s, %(image_url)s, %(product_url)s, %(affiliate_url)s,
    %(cashback_rate)s, %(cashback_amount)s, %(category)s, %(rating)s, %(review_count)s,
    true, NOW(), NOW()
)
ON CONFLICT (platform, "externalId") DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    "originalPrice" = EXCLUDED."originalPrice",
    "discountRate" = EXCLUDED."discountRate",
    "imageUrl" = EXCLUDED."imageUrl",
    "affiliateUrl" = EXCLUDED."affiliateUrl",
    "cashbackAmount" = EXCLUDED."cashbackAmount",
    rating = EXCLUDED.rating,
    "reviewCount" = EXCLUDED."reviewCount",
    "updatedAt" = NOW()
"""


def save_products(products: list[dict], default_cashback_rate: float = 2.5) -> int:
    """상품 목록을 DB에 UPSERT. 저장된 건수 반환."""
    if not products:
        return 0

    conn = get_connection()
    saved = 0

    try:
        cur = conn.cursor()
        for p in products:
            price = p.get('price', 0)
            original_price = p.get('original_price')
            discount_rate = None
            if original_price and original_price > price and original_price > 0:
                discount_rate = round((1 - price / original_price) * 100, 1)

            cashback_amount = round(price * default_cashback_rate / 100)

            params = {
                'platform': p.get('platform', ''),
                'external_id': str(p.get('external_id', '')),
                'title': p.get('title', '')[:500],
                'price': price,
                'original_price': original_price,
                'discount_rate': discount_rate,
                'image_url': p.get('image_url', ''),
                'product_url': p.get('product_url', ''),
                'affiliate_url': p.get('affiliate_url', ''),
                'cashback_rate': default_cashback_rate,
                'cashback_amount': cashback_amount,
                'category': p.get('category', ''),
                'rating': p.get('rating'),
                'review_count': p.get('review_count'),
            }

            try:
                cur.execute(UPSERT_SQL, params)
                saved += 1
            except Exception as e:
                logger.warning(f"상품 저장 실패 [{p.get('title', '')[:30]}]: {e}")
                conn.rollback()
                continue

        conn.commit()
        logger.info(f"DB 저장 완료: {saved}/{len(products)}건")
    except Exception as e:
        logger.error(f"DB 저장 에러: {e}")
        conn.rollback()
    finally:
        conn.close()

    return saved


ACADEMY_UPSERT_SQL = """
INSERT INTO academies (
    name, category, address, phone, region,
    latitude, longitude, "googlePlaceId", source,
    rating, "reviewCount", photos,
    "isActive", "createdAt", "updatedAt"
) VALUES (
    %(name)s, %(category)s, %(address)s, %(phone)s, %(region)s,
    %(latitude)s, %(longitude)s, %(google_place_id)s, 'google_maps',
    %(rating)s, %(review_count)s, %(photos)s::json,
    true, NOW(), NOW()
)
ON CONFLICT ("googlePlaceId") DO UPDATE SET
    name = EXCLUDED.name,
    -- 세분 카테고리 보존: 들어온 값이 넓은 '학원'이고 기존이 이미 더 구체적이면 기존 유지.
    category = CASE
        WHEN EXCLUDED.category = '학원' AND academies.category NOT IN ('', '학원')
        THEN academies.category
        ELSE EXCLUDED.category
    END,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    region = EXCLUDED.region,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    rating = EXCLUDED.rating,
    "reviewCount" = EXCLUDED."reviewCount",
    photos = EXCLUDED.photos,
    "updatedAt" = NOW()
"""


def save_academies(academies: list[dict]) -> int:
    """Google Places 학원/어린이집 데이터 UPSERT. googlePlaceId 가 충돌 키."""
    if not academies:
        return 0

    conn = get_connection()
    saved = 0

    try:
        import json
        cur = conn.cursor()
        for a in academies:
            params = {
                'name': (a.get('name') or '')[:200],
                'category': (a.get('category') or '')[:50],
                'address': (a.get('address') or '')[:500],
                'phone': (a.get('phone') or '')[:50],
                'region': (a.get('region') or '')[:100],
                'latitude': a.get('latitude'),
                'longitude': a.get('longitude'),
                'google_place_id': a.get('google_place_id'),
                'rating': a.get('rating'),
                'review_count': a.get('review_count') or 0,
                'photos': json.dumps(a.get('photos') or []),
            }
            try:
                cur.execute(ACADEMY_UPSERT_SQL, params)
                saved += 1
            except Exception as e:
                logger.warning(f"학원 저장 실패 [{params['name'][:30]}]: {e}")
                conn.rollback()
                continue

        conn.commit()
        logger.info(f"학원 DB 저장 완료: {saved}/{len(academies)}건")
    except Exception as e:
        logger.error(f"학원 DB 저장 에러: {e}")
        conn.rollback()
    finally:
        conn.close()

    return saved
