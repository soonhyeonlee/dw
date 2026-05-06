"""쿠팡파트너스 API 크롤러"""

import os
import time
import hmac
import hashlib
from datetime import datetime, timezone
import httpx
from .base import BaseCrawler


class CoupangCrawler(BaseCrawler):
    BASE_URL = "https://api-gateway.coupang.com"

    def __init__(self):
        super().__init__("쿠팡파트너스")
        self.access_key = os.getenv("COUPANG_ACCESS_KEY", "")
        self.secret_key = os.getenv("COUPANG_SECRET_KEY", "")
        self.partner_id = os.getenv("COUPANG_PARTNER_ID", "")

    def _generate_hmac(self, method: str, url_path: str, query_string: str = "") -> dict:
        """HMAC 서명 생성 (쿠팡 API 인증)"""
        datetime_now = datetime.now(timezone.utc).strftime("%y%m%dT%H%M%SZ")
        message = f"{datetime_now}{method}{url_path}{query_string}"
        signature = hmac.new(
            self.secret_key.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return {
            "Authorization": f"CEA algorithm=HmacSHA256, access-key={self.access_key}, "
                             f"signed-date={datetime_now}, signature={signature}",
            "Content-Type": "application/json",
        }

    def fetch_products(self, keyword: str, page: int = 1) -> list[dict]:
        """쿠팡 상품 검색 API"""
        if not self.access_key:
            self.logger.warning("COUPANG_ACCESS_KEY 미설정 - 스킵")
            return []

        url_path = "/v2/providers/affiliate_open_api/apis/openapi/products/search"
        query_string = f"keyword={keyword}&limit=20&page={page}"
        headers = self._generate_hmac("GET", url_path, query_string)

        try:
            response = httpx.get(
                f"{self.BASE_URL}{url_path}?{query_string}",
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            products = []
            for item in data.get("data", []):
                products.append({
                    "platform": "coupang",
                    "external_id": str(item.get("productId", "")),
                    "title": item.get("productName", ""),
                    "price": item.get("productPrice", 0),
                    "original_price": item.get("originalPrice"),
                    "image_url": item.get("productImage", ""),
                    "product_url": item.get("productUrl", ""),
                    "category": item.get("categoryName", keyword),
                    "rating": item.get("rating"),
                    "review_count": item.get("reviewCount"),
                })
            return products

        except Exception as e:
            self.logger.error(f"쿠팡 API 호출 실패: {e}")
            return []

    def generate_affiliate_link(self, product_url: str) -> str:
        """쿠팡 딥링크 생성 API"""
        if not self.access_key:
            return product_url

        url_path = "/v2/providers/affiliate_open_api/apis/openapi/deeplink"
        headers = self._generate_hmac("POST", url_path)

        try:
            response = httpx.post(
                f"{self.BASE_URL}{url_path}",
                headers=headers,
                json={
                    "coupangUrls": [product_url],
                    "subId": self.partner_id,
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            links = data.get("data", [])
            return links[0].get("shortenUrl", product_url) if links else product_url

        except Exception as e:
            self.logger.error(f"딥링크 생성 실패: {e}")
            return product_url
