"""11번가 OPEN API 크롤러"""

import os
import httpx
from xml.etree import ElementTree
from .base import BaseCrawler


class EleventhStCrawler(BaseCrawler):
    BASE_URL = "http://openapi.11st.co.kr/openapi/OpenApiService.tmall"

    AFFILIATE_BASE_URL = "https://www.11st.co.kr/products/"

    def __init__(self):
        super().__init__("11번가")
        self.api_key = os.getenv("ELEVENTH_API_KEY", "")
        self.affiliate_id = os.getenv("ELEVENTH_AFFILIATE_ID", "")

    def fetch_products(self, keyword: str, page: int = 1) -> list[dict]:
        """11번가 상품 검색 API (XML)"""
        if not self.api_key:
            self.logger.warning("ELEVENTH_API_KEY 미설정 - 스킵")
            return []

        try:
            response = httpx.get(
                self.BASE_URL,
                params={
                    "key": self.api_key,
                    "apiCode": "ProductSearch",
                    "keyword": keyword,
                    "pageNum": page,
                    "pageSize": 20,
                },
                timeout=10,
            )
            response.raise_for_status()

            root = ElementTree.fromstring(response.text)
            products = []

            for item in root.findall(".//Product"):
                products.append({
                    "platform": "11st",
                    "external_id": self._get_text(item, "ProductCode"),
                    "title": self._get_text(item, "ProductName"),
                    "price": int(self._get_text(item, "SalePrice") or 0),
                    "original_price": int(self._get_text(item, "ProductPrice") or 0) or None,
                    "image_url": self._get_text(item, "ProductImage300"),
                    "product_url": self._get_text(item, "DetailPageUrl"),
                    "category": keyword,
                    "rating": float(self._get_text(item, "BuySatisfy") or 0),
                })
            return products

        except Exception as e:
            self.logger.error(f"11번가 API 호출 실패: {e}")
            return []

    def generate_affiliate_link(self, product_url: str) -> str:
        """11번가 어필리에이트 링크 생성 (CPA 방식)"""
        if not self.affiliate_id:
            self.logger.warning("ELEVENTH_AFFILIATE_ID 미설정 - 원본 URL 반환")
            return product_url

        separator = "&" if "?" in product_url else "?"
        return f"{product_url}{separator}utm_source=doublewin&utm_medium=affiliate&affiliateId={self.affiliate_id}"

    @staticmethod
    def _get_text(element, tag: str) -> str:
        """XML 엘리먼트에서 텍스트 추출"""
        child = element.find(tag)
        return child.text if child is not None and child.text else ""
