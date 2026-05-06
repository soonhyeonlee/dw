"""
DoubleWin Crawler - 상품 데이터 수집기
쿠팡, 네이버, 11번가 상품 정보를 크롤링하여 DB에 저장
"""

import os
import sys
import time
import logging
import schedule
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger('doublewin-crawler')


def run_all_crawlers():
    """모든 크롤러 실행"""
    from crawlers.coupang import CoupangCrawler
    from crawlers.naver import NaverCrawler
    from crawlers.eleventh import EleventhStCrawler

    logger.info("=" * 50)
    logger.info("크롤링 사이클 시작")
    logger.info("=" * 50)

    crawlers = [
        CoupangCrawler(),
        NaverCrawler(),
        EleventhStCrawler(),
    ]

    total = 0
    for crawler in crawlers:
        try:
            collected, saved = crawler.run()
            total += saved
        except Exception as e:
            logger.error(f"{crawler.name} 크롤링 실패: {e}")
        time.sleep(30)

    logger.info(f"크롤링 사이클 완료: 총 {total}건 저장")
    logger.info("=" * 50)


def main():
    logger.info("DoubleWin Crawler 시작")

    mode = os.getenv('CRAWLER_MODE', 'once')

    if mode == 'schedule':
        interval = int(os.getenv('CRAWLER_INTERVAL_HOURS', '6'))
        logger.info(f"스케줄 모드: {interval}시간 간격으로 실행")

        run_all_crawlers()

        schedule.every(interval).hours.do(run_all_crawlers)

        while True:
            schedule.run_pending()
            time.sleep(60)
    else:
        logger.info("1회 실행 모드")
        run_all_crawlers()


if __name__ == '__main__':
    main()
