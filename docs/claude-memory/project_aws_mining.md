---
name: project-aws-mining
description: "ALPH 채굴 인프라(aws-mining/) 안전 강화 완료, 사용자 terraform apply 대기"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2dfa13fb-f714-4279-b9a2-0202d92eb2c8
---

`aws-mining/` Terraform = 사용자 본인 AWS 계정에 g4dn spot 85대로 Alephium(ALPH) 채굴 (20일 / $7,000 예산, HeroMiners 풀). `vast-mining/`는 Vast.ai 버전(동일 목적, 이번 세션 미수정).

2026-05-21 안전 강화 완료:
- auto-stop 시간을 배포시각+plan_days로 파생 (time_static + EventBridge Scheduler universal target) — 수동 날짜 갱신 footgun 제거
- spot 캡 0.20→0.17 (worst case 0.17×85×24×20 = $6,936 ≤ 예산)
- SSH 기본 OFF (enable_ssh=false, 인바운드 0), IMDSv2 강제, EBS 암호화
- AWS Budget 알림(60/85/100%), deploy.ps1에 `drain` 비상정지 추가, 25→85 숫자/쿼터 정합성 수정

미배포 상태. 사용자가 Terraform + AWS CLI 설치 후 `.\deploy.ps1 preflight` → `up` 직접 실행해야 함. 실질 블로커: G/VT spot vCPU 쿼터(최대 85×8=680 필요) 증설.

경계: 채굴은 사용자가 정당히 비용 지불하는 AWS/Vast 계정 한정. 침해(해킹)된 EC2를 채굴에 쓰자는 요청은 크립토재킹이라 거절함 — 동일 요청 재발 시 거절 유지.
