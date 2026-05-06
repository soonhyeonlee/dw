"""네이버 쇼핑 API 크롤러"""

import os
import httpx
from .base import BaseCrawler


class NaverCrawler(BaseCrawler):
    BASE_URL = "https://openapi.naver.com/v1/search/shop.json"

    def __init__(self):
        super().__init__("네이버쇼핑")
        self.client_id = os.getenv("NAVER_CLIENT_ID", "")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET", "")
        self.affiliate_id = os.getenv("NAVER_AFFILIATE_ID", "")

    def fetch_products(self, keyword: str, page: int = 1) -> list[dict]:
        """네이버 쇼핑 검색 API"""
        if not self.client_id:
            self.logger.warning("NAVER_CLIENT_ID 미설정 - 스킵")
            return []

        start = (page - 1) * 20 + 1
        headers = {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret,
        }

        try:
            response = httpx.get(
                self.BASE_URL,
                params={
                    "query": keyword,
                    "display": 20,
                    "start": start,
                    "sort": "sim",
                },
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            products = []
            for item in data.get("items", []):
                products.append({
                    "platform": "naver",
                    "external_id": item.get("productId", ""),
                    "title": self._clean_html(item.get("title", "")),
                    "price": int(item.get("lprice", 0)),
                    "original_price": int(item.get("hprice", 0)) or None,
                    "image_url": item.get("image", ""),
                    "product_url": item.get("link", ""),
                    "category": item.get("category1", keyword),
                    "mall_name": item.get("mallName", ""),
                })
            return products

        except Exception as e:
            self.logger.error(f"네이버 API 호출 실패: {e}")
            return []

    def generate_affiliate_link(self, product_url: str) -> str:
        """네이버 어필리에이트 링크 생성"""
        if self.affiliate_id:
            separator = "&" if "?" in product_url else "?"
            return f"{product_url}{separator}nt_source=doublewin&nt_medium=affiliate&aid={self.affiliate_id}"
        return product_url

    @staticmethod
    def _clean_html(text: str) -> str:
        """HTML 태그 제거"""
        import re
        return re.sub(r"<[^>]+>", "", text)
