---
name: AWS 직접 배포 워크플로우 (EC2 SSH + RDS aws cli)
description: GitHub 거치지 않고 SSH/AWS CLI로 직접 작업하는 사용자 배포 패턴 — 매 세션 첫 백엔드 작업 전 반드시 먼저 읽기
type: reference
originSessionId: 101eed50-9ca5-4474-8530-3a50970ab56d
---
**Why:** 사용자는 이 프로젝트를 GitHub 없이 AWS CLI + SSH 로 직접 배포·관리하는 워크플로우. 2026-05-06 세션에서 GitHub repo 생성·push 자동화를 시도했다가 사용자에게 "그냥 aws에 cli로 필요한거 바로 너가다 직접 작업했잖아 / 히스토리 확인 안 해?" 지적 받음. 다음부터는 백엔드/인프라 작업 시 GitHub 대신 SSH·AWS CLI 우선.

**How to apply:** "EC2", "API", "백엔드", "DB", "RDS" 작업이 들어오면 GitHub remote 만들 생각 하지 말고 바로 이 워크플로우 사용.

## EC2 인스턴스
- **현재 IP**: `54.238.64.159` (탄력 IP 변경 가능 — `aws ec2 describe-instances --region ap-northeast-1`로 확인)
- **이전 IP**: `43.201.79.161` (known_hosts에 남아있지만 더 이상 유효하지 않음)
- **Instance ID**: `i-0b66e19cf7033b610`
- **KeyName**: `doublewin-key`
- **사용자**: `ec2-user`
- **deploy 디렉토리**: `/opt/doublewin`

## SSH 키
- 위치: `~/.ssh/doublewin-key.pem`
- ⚠️ **OneDrive 폴더 ACL 함정**: 새 윈도우 권한이 644로 잡혀서 OpenSSH가 거부함. 사용 전 반드시 PowerShell로:
  ```powershell
  icacls "$env:USERPROFILE\.ssh\doublewin-key.pem" /inheritance:r
  icacls "$env:USERPROFILE\.ssh\doublewin-key.pem" /grant:r "$($env:USERNAME):(R)"
  ```
- SSH 명령: `ssh -i ~/.ssh/doublewin-key.pem -o IdentitiesOnly=yes ec2-user@54.238.64.159`

## RDS PostgreSQL
- 호스트는 `.env.aws`에 (`doublewin-db.czw6ymkwut58.ap-northeast-1.rds.amazonaws.com`)
- 직접 SQL 실행은 로컬 node + pg 모듈로 (`verify-aws-db.js` 패턴):
  - `node -e "const {Client}=require('./node_modules/pg'); ..."`
- production 환경은 `synchronize: false`이므로 entity 변경 시 **반드시 직접 ALTER TABLE 실행**

## AWS CLI
- 인증: `~/.aws/credentials` (이미 설정됨, account `884057032474`, user `aichemist_admin`)
- region 기본 사용: `ap-northeast-1`
- 자주 쓰는 명령:
  - `aws ec2 describe-instances --region ap-northeast-1` (IP 확인)
  - `aws s3 ls`, `aws cloudfront ...`

## 배포 절차 (백엔드 코드 변경 후)
1. 로컬에서 monorepo 압축 (node_modules/android/ios/dist 제외):
   ```bash
   tar --exclude='**/node_modules' --exclude='**/dist' --exclude='**/.next' \
       --exclude='**/build' --exclude='**/.expo' --exclude='**/android' \
       --exclude='**/ios' --exclude='**/.gradle' \
       -czf /tmp/dw-deploy.tar.gz \
       apps packages package.json package-lock.json tsconfig.json \
       docker-compose.prod.yml nginx.conf
   ```
2. `scp -i ~/.ssh/doublewin-key.pem -o IdentitiesOnly=yes /tmp/dw-deploy.tar.gz ec2-user@54.238.64.159:/tmp/`
3. SSH로 압축 해제 + chown:
   ```bash
   ssh -i ~/.ssh/doublewin-key.pem ec2-user@54.238.64.159 "
     sudo cp -r /opt/doublewin/apps /opt/doublewin/.apps.bak.\$(date +%s);
     cd /opt/doublewin && sudo tar xzf /tmp/dw-deploy.tar.gz;
     sudo chown -R ec2-user:ec2-user /opt/doublewin/apps /opt/doublewin/packages \
       /opt/doublewin/package*.json /opt/doublewin/tsconfig.json"
   ```
4. docker compose 재빌드:
   ```bash
   ssh ... "cd /opt/doublewin && sudo docker compose -f docker-compose.prod.yml up -d --build api"
   ```
5. 검증: `curl https://api-dev.sumbodyweb.com/malls` 또는 `curl http://54.238.64.159:4000/malls`

## /opt/doublewin 구조
- 코드는 git 저장소 아님 (`NO_GIT`) — tarball deploy
- `.env`는 EC2에만 있고 tarball에 포함하지 않음 (보존)
- 백업은 `/opt/doublewin/.apps.bak.<timestamp>` 자동 생성

## 주의
- CloudFront 도메인: `api-dev.sumbodyweb.com` → CloudFront → EC2:4000
- nginx 등 프록시 변경 시 EC2의 nginx.conf도 동기화
- container 3개: `doublewin-api`, `doublewin-admin`, `doublewin-crawler`
