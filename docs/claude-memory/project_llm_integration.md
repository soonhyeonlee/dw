---
name: LLM 통합 모듈 작업
description: GPT 3종 + Gemini 3종 통합 LLM 채팅 모듈 구현 진행 상황
type: project
---

GPT 3종(GPT-4o, GPT-4o Mini, GPT-4 Turbo) + Gemini 3종(Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash) 통합 LLM 채팅 모듈 구현 완료.

**Why:** 관리자 대시보드에서 여러 LLM을 드롭업 박스로 선택하여 사용할 수 있도록 하기 위함.

**How to apply:** 사용자가 "다시 시작"이라고 하면 아래 완료 상태를 기반으로 이어서 작업.

## 완료된 작업 (2026-04-07)

### 백엔드 (apps/api/src/llm/)
- `dto/chat.dto.ts` — LlmProvider enum, ChatRequestDto, ChatMessageDto
- `llm.service.ts` — OpenAI/Gemini API 호출 로직 (fetch 기반)
- `llm.controller.ts` — GET /llm/models, POST /llm/chat (JwtAuthGuard 적용)
- `llm.module.ts` — NestJS 모듈
- `app.module.ts`에 LlmModule 등록 완료

### 프론트엔드 (apps/admin/src/app/dashboard/llm/)
- `page.tsx` — 채팅 UI + 드롭업 모델 선택기 (프로젝트 스타일에 맞춰 inline CSS)
- 사이드바에 "LLM 채팅" 메뉴 추가 완료 (dashboard/layout.tsx)

### 기타
- `.env.example`에 OPENAI_API_KEY, GEMINI_API_KEY 추가

## 남은 작업
- 사용자가 추가 요청 시 진행 (스트리밍, 시스템 프롬프트 UI 등)
