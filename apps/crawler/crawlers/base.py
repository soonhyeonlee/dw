"""크롤러 베이스 클래스"""

import time
import logging
from abc import ABC, abstractmethod
from db.repository import save_products


class BaseCrawler(ABC):
    MAX_RETRIES = 3
    RETRY_DELAY = 5

    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f'crawler.{name}')

    @abstractmethod
    def fetch_products(self, keyword: str, page: int = 1) -> list[dict]:
        """상품 목록 조회"""
        pass

    @abstractmethod
    def generate_affiliate_link(self, product_url: str) -> str:
        """어필리에이트 링크 생성"""
        pass

    def fetch_with_retry(self, keyword: str, page: int = 1) -> list[dict]:
        """재시도 로직이 포함된 상품 조회"""
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                return self.fetch_products(keyword, page)
            except Exception as e:
                if attempt == self.MAX_RETRIES:
                    self.logger.error(f"  [{keyword}] {self.MAX_RETRIES}회 시도 실패: {e}")
                    return []
                delay = self.RETRY_DELAY * attempt
                self.logger.warning(f"  [{keyword}] 시도 {attempt} 실패, {delay}초 후 재시도: {e}")
                time.sleep(delay)
        return []

    def run(self):
        self.logger.info(f"{self.name} 크롤링 시작")
        categories = ['패션', '전자제품', '생활용품', '식품', '뷰티']
        total_collected = 0
        total_saved = 0

        for category in categories:
            try:
                products = self.fetch_with_retry(category)
                self.logger.info(f"  [{category}] {len(products)}개 상품 수집")

                for p in products:
                    p['affiliate_url'] = self.generate_affiliate_link(p.get('product_url', ''))

                saved = save_products(products)
                total_collected += len(products)
                total_saved += saved

            except Exception as e:
                self.logger.error(f"  [{category}] 실패: {e}")

            time.sleep(2)

        self.logger.info(f"{self.name} 완료: 수집 {total_collected}건, 저장 {total_saved}건")
        return total_collected, total_saved
