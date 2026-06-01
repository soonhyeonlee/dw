<?php
/**
 * 더블윈 ↔ 아이홈마켓(그누보드5/영카트5) 계정 공유 SSO 브리지.
 *
 * 배포 위치(카페24): /www/doublewin/sso.php
 *   - 그누보드 루트가 /www 이므로 상위 common.php 를 include 한다.
 *
 * 흐름:
 *   1) 더블윈 앱이 이 URL 을 웹뷰로 연다: sso.php?redirect=doublewin://auth
 *   2) 비로그인 → 그누보드 로그인 페이지로 보냄(카카오/네이버/구글/아이디 모두 지원).
 *      로그인/회원가입 완료 후 다시 이 sso.php 로 복귀.
 *   3) 로그인됨 → {mb_id,email,nickname,ts} 를 공유 시크릿으로 HMAC-SHA256 서명 후
 *      redirect 딥링크( doublewin://auth?mb_id=..&email=..&nick=..&ts=..&sig=.. )로 리다이렉트.
 *
 * 서명 규칙은 더블윈 API(auth.service.ts _ihomeSign / ihome-sync.service.ts sign)와 동일:
 *   sig 제외, 키 오름차순 정렬, http_build_query(기본=RFC1738, space=+) 직렬화,
 *   hash_hmac('sha256', $qs, $secret) → hex.
 */

// --- 공유 시크릿 로드 (git 에 올리지 않음) ----------------------------------
// 같은 디렉터리의 sso_config.php 가 define('DW_SSO_SECRET', '<IHOME_SYNC_SECRET 과 동일값>') 한다.
@include_once __DIR__ . '/sso_config.php';
if (!defined('DW_SSO_SECRET') || DW_SSO_SECRET === '') {
    // getenv 백업 (호스팅이 환경변수를 주입하는 경우)
    $envSecret = getenv('IHOME_SYNC_SECRET');
    if ($envSecret) {
        define('DW_SSO_SECRET', $envSecret);
    }
}

function dw_fail($msg)
{
    // 앱이 파싱할 수 있도록 딥링크 err 로도 시도하되, 기본은 평문.
    header('Content-Type: text/plain; charset=utf-8');
    echo 'SSO_ERROR: ' . $msg;
    exit;
}

if (!defined('DW_SSO_SECRET')) {
    dw_fail('secret not configured');
}

// --- redirect(딥링크) 검증: doublewin 스킴만 허용 --------------------------
$redirect = isset($_GET['redirect']) ? (string) $_GET['redirect'] : 'doublewin://auth';
if (strpos($redirect, 'doublewin://') !== 0) {
    dw_fail('invalid redirect scheme');
}

// --- 그누보드 컨텍스트 로드 -------------------------------------------------
// 로그인 세션/회원정보를 얻기 위해 그누보드 common 을 포함.
// (_GNUBOARD_ 상수는 common.php 가 스스로 정의하므로 여기서 미리 define 하지 않는다.)
$common = dirname(__DIR__) . '/common.php'; // /www/common.php
if (!is_file($common)) {
    dw_fail('gnuboard common.php not found');
}
include_once $common;

// 자기 자신의 절대 URL (로그인 후 복귀용)
$self_scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$self_url = $self_scheme . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['SCRIPT_NAME']
    . '?redirect=' . rawurlencode($redirect);

// --- 비로그인 → 그누보드 로그인 페이지로 ------------------------------------
$logged_in = (defined('G5_DATA_DIR') && isset($member['mb_id']) && $member['mb_id'] !== '');
if (!$logged_in) {
    $login_url = G5_BBS_URL . '/login.php?url=' . urlencode($self_url);
    header('Location: ' . $login_url);
    exit;
}

// --- 로그인됨 → 서명 후 딥링크 리다이렉트 -----------------------------------
$mb_id    = (string) $member['mb_id'];
$email    = isset($member['mb_email']) ? (string) $member['mb_email'] : '';
$nickname = isset($member['mb_nick']) ? (string) $member['mb_nick'] : '';
$ts       = (string) time();

// 서명 대상은 ASCII 필드 {email, mb_id, ts} 만 (닉네임 멀티바이트 인코딩 차이 회피).
// 키 오름차순 정렬 후 http_build_query → HMAC-SHA256. (더블윈 API _ihomeSign 과 동일)
$signed = array('email' => $email, 'mb_id' => $mb_id, 'ts' => $ts);
ksort($signed);
$canonical = http_build_query($signed);
$sig = hash_hmac('sha256', $canonical, DW_SSO_SECRET);

// 닉네임은 서명 없이 표시용으로만 전달.
$qs = http_build_query(array(
    'mb_id' => $mb_id,
    'email' => $email,
    'nick'  => $nickname,
    'ts'    => $ts,
    'sig'   => $sig,
));

header('Location: ' . $redirect . '?' . $qs);
exit;
