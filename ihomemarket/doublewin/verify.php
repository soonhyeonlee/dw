<?php
/**
 * 더블윈 네이티브 ID/PW 로그인용 자격증명 검증 브리지 (sso.php 의 비-웹뷰 버전).
 *
 * 배포 위치(카페24): /www/doublewin/verify.php
 *
 * 흐름:
 *   1) 더블윈 API(서버) 가 {mb_id, mb_password, ts, sig} 를 POST 한다.
 *      - sig 는 요청 인증용: 더블윈 API 와 공유 시크릿으로 {mb_id, ts} 를 HMAC 서명.
 *        (이 서명을 못 만들면 호출 자체가 거부되므로 공개 비번 오라클이 되지 않는다.)
 *   2) 그누보드 컨텍스트에서 get_member + 비번 검증 + 승인(st_tp)·차단·탈퇴 체크.
 *   3) 성공 시 sso.php 와 동일한 "신원 서명" {mb_id,email,nick,ts,sig} 를 JSON 으로 반환.
 *      더블윈 API 는 기존 ihomeLogin() 으로 이 서명을 재검증 후 JWT 발급.
 *
 * 서명 규칙(요청·응답 공통)은 sso.php / auth.service.ts _ihomeSign 과 동일:
 *   sig 제외, 키 오름차순, http_build_query(RFC1738, space=+), hash_hmac sha256 hex.
 */

header('Content-Type: application/json; charset=utf-8');

function vfail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'err' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

// --- 공유 시크릿 (sso.php 와 같은 config 재사용) ----------------------------
@include_once __DIR__ . '/sso_config.php';
if (!defined('DW_SSO_SECRET') || DW_SSO_SECRET === '') {
    $envSecret = getenv('IHOME_SYNC_SECRET');
    if ($envSecret) define('DW_SSO_SECRET', $envSecret);
}
if (!defined('DW_SSO_SECRET')) vfail('secret not configured', 500);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') vfail('POST only', 405);

$mb_id = isset($_POST['mb_id']) ? trim((string) $_POST['mb_id']) : '';
$mb_pw = isset($_POST['mb_password']) ? (string) $_POST['mb_password'] : '';
$ts    = isset($_POST['ts']) ? (string) $_POST['ts'] : '';
$sig   = isset($_POST['sig']) ? (string) $_POST['sig'] : '';

if ($mb_id === '' || $mb_pw === '' || $ts === '' || $sig === '') vfail('missing fields');

// --- 1) 요청 서명 검증 (호출자가 더블윈 API 임을 확인) ----------------------
if (!ctype_digit($ts) || abs(time() - (int) $ts) > 300) vfail('stale request', 401);

$req = array('mb_id' => $mb_id, 'ts' => $ts);
ksort($req);
$req_canonical = http_build_query($req);
$req_expected  = hash_hmac('sha256', $req_canonical, DW_SSO_SECRET);
if (!hash_equals($req_expected, $sig)) vfail('bad request signature', 401);

// --- 2) 그누보드 컨텍스트 + 자격 검증 ---------------------------------------
$common = dirname(__DIR__) . '/common.php'; // /www/common.php
if (!is_file($common)) vfail('gnuboard common.php not found', 500);
ob_start(); include_once $common; ob_end_clean();

$mb = function_exists('get_member') ? get_member($mb_id) : null;

// 비번 검증 — login_check.php 와 동일 함수 우선 사용.
$pw_ok = false;
if ($mb && !empty($mb['mb_id'])) {
    if (function_exists('login_password_check')) {
        $pw_ok = login_password_check($mb, $mb_pw, $mb['mb_password']);
    } elseif (function_exists('check_password')) {
        $pw_ok = check_password($mb_pw, $mb['mb_password']);
    }
}
// 존재하지 않는 아이디/틀린 비번을 구분하지 않는다(열거 방지).
if (!$pw_ok) vfail('가입된 회원아이디가 아니거나 비밀번호가 틀립니다.', 401);

// 차단 / 탈퇴
$today = date('Ymd', time());
if (!empty($mb['mb_intercept_date']) && $mb['mb_intercept_date'] <= $today) vfail('접근이 금지된 아이디입니다.', 403);
if (!empty($mb['mb_leave_date']) && $mb['mb_leave_date'] <= $today) vfail('탈퇴한 아이디입니다.', 403);

// 메일인증 (설정 사용 중일 때만)
if (function_exists('is_use_email_certify') && is_use_email_certify()
    && !preg_match('/[1-9]/', (string) $mb['mb_email_certify'])) {
    vfail('메일인증이 완료되지 않은 계정입니다.', 403);
}

// 관리자 승인 (youngcart 커스텀: login_check.php 의 st_tp 게이트와 동일)
if (isset($mb['st_tp']) && (int) $mb['st_tp'] !== 1) {
    vfail('아직 관리자의 승인이 이루어지지 않은 계정입니다.', 403);
}

// --- 3) 신원 서명 후 반환 (sso.php 딥링크 파라미터와 동일 형식) --------------
$email = isset($mb['mb_email']) ? (string) $mb['mb_email'] : '';
$nick  = isset($mb['mb_nick']) ? (string) $mb['mb_nick'] : '';
$now   = (string) time();

$signed = array('email' => $email, 'mb_id' => $mb_id, 'ts' => $now); // ASCII 3필드만 서명
ksort($signed);
$out_sig = hash_hmac('sha256', http_build_query($signed), DW_SSO_SECRET);

echo json_encode(array(
    'ok'    => true,
    'mb_id' => $mb_id,
    'email' => $email,
    'nick'  => $nick,   // 표시용(미서명)
    'ts'    => $now,
    'sig'   => $out_sig,
), JSON_UNESCAPED_UNICODE);
