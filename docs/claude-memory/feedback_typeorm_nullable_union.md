---
name: typeorm-nullable-union-explicit-type
description: TypeORM 엔티티에 nullable 컬럼이나 union 타입 쓸 때는 @Column 에 type 명시 필수
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ce1e35b7-226b-4c47-9ebe-bc85b3a041cd
---

TypeORM `@Column` 에 nullable: true 만 있고 type 안 주면 reflect-metadata 가 TS 타입을 `Object` 로 추론해서 `DataTypeNotSupportedError: Data type "Object" in "X.field" is not supported by "postgres" database` 로 컨테이너 부팅 실패.

**Why:** 2026-05-29 세션에서 Academy 엔티티에 `googlePlaceId: string | null` 과 `source: 'manual' | 'google_maps'` 추가했더니 EC2 API 컨테이너가 같은 에러로 무한 retry. union/nullable TS 타입은 reflect-metadata 가 `Object` 로 표시하기 때문. 같은 파일에 `latitude: number | null` 도 있었는데 그쪽은 `type: 'decimal'` 명시되어 있어 통과.

**How to apply:** 새 엔티티 컬럼 추가하거나 기존 컬럼에 `| null` / union literal 붙일 때:
- `string` → `@Column({ type: 'varchar', length: 255, ... })`
- `number` → `@Column({ type: 'int' | 'decimal' | 'bigint', ... })`
- enum/union literal → `@Column({ type: 'varchar', length: N, ... })` 또는 `@Column({ type: 'enum', enum: [...] })`
- boolean → `@Column({ type: 'boolean', ... })`

dev 가 SQLite (synchronize 자동) 면 같은 코드도 통과되어 발견 안 됨. **prod Postgres 에 배포 직후 docker logs 로 catch.**

관련: [[reference-aws-deploy-workflow]] (배포 직후 `docker logs --tail 30 doublewin-api 2>&1 | grep -i error` 한 줄 항상 돌릴 것)
