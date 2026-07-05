---
name: reference-github-repo
description: CEN 프로젝트 GitHub 원격 레포 위치·계정·push 시 403 주의점
metadata: 
  node_type: memory
  type: reference
  originSessionId: 14c27b97-efbb-4021-9447-ad3c1efda3d8
---

CEN 프로젝트(`C:\Users\sangw\OneDrive\Documents\Unreal Projects\CEN`)의 GitHub 원격.

- **원격**: `origin` = `https://github.com/soonhyeonlee/dw.git` (비공개)
- **계정**: `soonhyeonlee` (soonhyeon.lee@aichemist.kr)
- **최초 push**: 2026-07-05, main 브랜치 (파일 352개, 58MB). `.env` 실파일은 미포함(.gitignore), `.env.example`만 트래킹.
- 다른 PC 이어서 작업: `git clone https://github.com/soonhyeonlee/dw.git` 후 `.env.example` 참고해 환경변수 채우기.

⚠️ **push 403 주의**: 이 PC의 Windows 자격증명 관리자에 **다른 계정(`minwookfromaichemist`) 토큰**이 저장돼 있음. 그냥 `git push` 하면 그 계정으로 인증돼 `soonhyeonlee/dw`에 권한 없음 → 403. 해결: `gh auth login`으로 `soonhyeonlee` 로그인 한 번 해두거나, 일회용으로 PAT를 URL에 넣어 push (`https://soonhyeonlee:<PAT>@github.com/...` — `-u` 쓰면 토큰이 config에 남으니 push 후 `git remote set-url origin`으로 토큰 없는 URL 복원 필수).
