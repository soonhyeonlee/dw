"""DB 연결 관리"""

import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger('crawler.db')


def get_connection():
    """PostgreSQL 연결 생성"""
    try:
        kwargs = dict(
            host=os.getenv('DATABASE_HOST', 'localhost'),
            port=int(os.getenv('DATABASE_PORT', '5432')),
            user=os.getenv('DATABASE_USER', 'doublewin'),
            password=os.getenv('DATABASE_PASSWORD', 'doublewin_dev'),
            database=os.getenv('DATABASE_NAME', 'doublewin'),
            cursor_factory=RealDictCursor,
        )
        if os.getenv('DATABASE_SSL', 'false').lower() == 'true':
            kwargs['sslmode'] = 'require'
        conn = psycopg2.connect(**kwargs)
        return conn
    except Exception as e:
        logger.error(f"DB 연결 실패: {e}")
        raise
