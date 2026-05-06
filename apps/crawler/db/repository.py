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
