<?php
/**
 * 이 파일을 sso_config.php 로 복사한 뒤 시크릿을 채운다.
 * 값은 더블윈 API EC2 .env 의 IHOME_SYNC_SECRET 과 반드시 동일해야 한다
 * (기존 상품 동기화 엔드포인트가 쓰는 그 시크릿과 같은 값).
 *
 * sso_config.php 는 git/배포 트래킹에서 제외(.gitignore)되며, 카페24에 직접 업로드한다.
 */
define('DW_SSO_SECRET', 'PUT-THE-SAME-VALUE-AS-IHOME_SYNC_SECRET-HERE');
