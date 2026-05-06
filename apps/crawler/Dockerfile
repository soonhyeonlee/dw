FROM python:3.12-slim

WORKDIR /app

COPY apps/crawler/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/crawler/ .

ENV CRAWLER_MODE=schedule
ENV CRAWLER_INTERVAL_HOURS=6

CMD ["python", "main.py"]
