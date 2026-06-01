<?php
/**
 * 앱 네이티브 소셜 로그인(현재 카카오) → 그누보드 회원 매핑 브리지. (모델 A)
 *
 * 배포 위치(카페24): /www/doublewin/social_verify.php
 *
 * 흐름:
 *   1) 더블윈 API 가 {provider, access_token, ts, sig} 를 POST.
 *      - sig: 공유 시크릿으로 {access_token, provider, ts} HMAC (호출자=더블윈 API 인증).
 *   2) provider 토큰을 해당 소셜 API 로 검증 + 프로필(id/email/nick) 취득.
 *      - 카카오: GET kapi.kakao.com/v2/user/me + /v1/user/access_token_info(app_id 확인).
 *   3) g5_member_social_profiles(provider, identifier) 로 회원 조회.
 *      - 있으면 그 mb_id. 없으면 g5_member + social_profiles 행을 생성(자동가입, st_tp=1).
 *        → 웹 소셜 로그인도 동일 identifier 로 같은 회원에 매칭(계정 통합).
 *   4) sso.php 와 동일한 서명 신원 {mb_id,email,nick,ts,sig} 반환 → API ihomeLogin() 재사용.
 *
 * 카카오 앱 식별: g5_config.cf_kakao_rest_key 와 같은 앱의 네이티브 키로 발급된 토큰만
 *   유효(같은 앱이라야 회원번호 identifier 가 웹과 일치). app_id 는 sso_config 의
 *   DW_KAKAO_APP_ID 가 정의돼 있으면 강제 일치 검사한다.
 */

header('Content-Type: application/json; charset=utf-8');

function sfail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'err' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function http_get_json($url, $headers) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
    ));
    $body = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return array($http, json_decode($body, true));
}

// --- 시크릿 ---------------------------------------------------------------
@include_once __DIR__ . '/sso_config.php';
if (!defined('DW_SSO_SECRET') || DW_SSO_SECRET === '') {
    $envSecret = getenv('IHOME_SYNC_SECRET');
    if ($envSecret) define('DW_SSO_SECRET', $envSecret);
}
if (!defined('DW_SSO_SECRET')) sfail('secret not configured', 500);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sfail('POST only', 405);

$provider = isset($_POST['provider']) ? strtolower(trim((string) $_POST['provider'])) : '';
$token    = isset($_POST['access_token']) ? (string) $_POST['access_token'] : '';
$ts       = isset($_POST['ts']) ? (string) $_POST['ts'] : '';
$sig      = isset($_POST['sig']) ? (string) $_POST['sig'] : '';

if ($provider === '' || $token === '' || $ts === '' || $sig === '') sfail('missing fields');
if ($provider !== 'kakao') sfail('unsupported provider', 400); // 현재 카카오만

// --- 요청 서명 검증 (호출자 = 더블윈 API) ----------------------------------
if (!ctype_digit($ts) || abs(time() - (int) $ts) > 300) sfail('stale request', 401);
$req = array('access_token' => $token, 'provider' => $provider, 'ts' => $ts);
ksort($req);
$expected = hash_hmac('sha256', http_build_query($req), DW_SSO_SECRET);
if (!hash_equals($expected, $sig)) sfail('bad request signature', 401);

// --- 그누보드 컨텍스트 ------------------------------------------------------
$common = dirname(__DIR__) . '/common.php';
if (!is_file($common)) sfail('gnuboard common.php not found', 500);
ob_start(); include_once $common; ob_end_clean();

// --- 카카오 토큰 검증 + 프로필 ----------------------------------------------
list($ic, $info) = http_get_json('https://kapi.kakao.com/v1/user/access_token_info',
    array('Authorization: Bearer ' . $token));
if ($ic !== 200 || !isset($info['id'])) sfail('카카오 토큰이 유효하지 않습니다.', 401);

// 우리 카카오 앱에서 발급된 토큰인지 (app_id 일치) — 설정돼 있을 때만 강제.
if (defined('DW_KAKAO_APP_ID') && DW_KAKAO_APP_ID && (string) $info['app_id'] !== (string) DW_KAKAO_APP_ID) {
    sfail('토큰의 앱이 일치하지 않습니다.', 401);
}

list($pc, $me) = http_get_json('https://kapi.kakao.com/v2/user/me',
    array('Authorization: Bearer ' . $token));
if ($pc !== 200 || !isset($me['id'])) sfail('카카오 프로필 조회 실패', 401);

$identifier = (string) $me['id']; // 카카오 회원번호 (앱 스코프 — 웹과 동일)
$kakao_acc  = isset($me['kakao_account']) ? $me['kakao_account'] : array();
$email      = isset($kakao_acc['email']) ? (string) $kakao_acc['email'] : '';
$nick       = '';
if (isset($kakao_acc['profile']['nickname'])) $nick = (string) $kakao_acc['profile']['nickname'];
elseif (isset($me['properties']['nickname'])) $nick = (string) $me['properties']['nickname'];

// --- 회원 매핑 (g5_member_social_profiles) ----------------------------------
$T_MEMBER  = G5_TABLE_PREFIX . 'member';
$T_SOCIAL  = G5_TABLE_PREFIX . 'member_social_profiles';
$id_esc    = sql_escape_string($identifier);

$row = sql_fetch("SELECT mb_id FROM `$T_SOCIAL` WHERE provider='kakao' AND identifier='$id_esc'");
$mb_id = $row && !empty($row['mb_id']) ? $row['mb_id'] : '';

if ($mb_id === '') {
    // 최초 소셜 로그인 → 회원 + 매핑 자동 생성 (자동가입, st_tp=1).
    $base = 'kko' . preg_replace('/[^0-9a-z]/i', '', $identifier);
    $new_id = substr($base, 0, 20);
    // mb_id 충돌 회피
    $i = 0;
    while (sql_fetch("SELECT mb_id FROM `$T_MEMBER` WHERE mb_id='" . sql_escape_string($new_id) . "'")) {
        $i++; $new_id = substr($base, 0, 17) . sprintf('%03d', $i);
    }
    $mb_email = $email !== '' ? $email : ($new_id . '@kakao.local');
    $mb_nick  = $nick !== '' ? $nick : ('카카오' . substr($identifier, -4));
    $now = date('Y-m-d H:i:s'); $today = date('Y-m-d');
    $rand = function_exists('random_bytes') ? bin2hex(random_bytes(8)) : uniqid('', true);
    $pw_hash = function_exists('get_encrypt_string') ? get_encrypt_string($rand) : '';

    $cols = array(
        'mb_id'            => $new_id,
        'mb_password'      => $pw_hash,
        'mb_name'          => $mb_nick,
        'mb_nick'          => $mb_nick,
        'mb_nick_date'     => $today,
        'mb_email'         => $mb_email,
        'mb_level'         => '2',
        'mb_mailling'      => '0',
        'mb_sms'           => '0',
        'mb_open'          => '0',
        'mb_email_certify' => $now,
        'mb_datetime'      => $now,
        'mb_today_login'   => $now,
        'mb_ip'            => '0.0.0.0',
        'st_tp'            => '1',
    );
    $fields = array(); $values = array();
    foreach ($cols as $k => $v) { $fields[] = "`$k`"; $values[] = "'" . sql_escape_string($v) . "'"; }
    sql_query("INSERT INTO `$T_MEMBER` (" . implode(',', $fields) . ") VALUES (" . implode(',', $values) . ")", false);

    $object_sha = sha1($provider . $identifier);
    sql_query("INSERT INTO `$T_SOCIAL`
        (mb_id, provider, object_sha, identifier, profileurl, photourl, displayname, description, mp_register_day, mp_latest_day)
        VALUES ('" . sql_escape_string($new_id) . "', 'kakao', '" . sql_escape_string($object_sha) . "',
                '$id_esc', '', '', '" . sql_escape_string($mb_nick) . "', '', '$now', '$now')", false);

    $mb_id = $new_id;
} else {
    sql_query("UPDATE `$T_SOCIAL` SET mp_latest_day='" . date('Y-m-d H:i:s') . "'
               WHERE provider='kakao' AND identifier='$id_esc'", false);
}

// 회원 상태 재확인 (차단/탈퇴/미승인)
$mb = get_member($mb_id);
$todayYmd = date('Ymd');
if (!empty($mb['mb_intercept_date']) && $mb['mb_intercept_date'] <= $todayYmd) sfail('접근이 금지된 계정입니다.', 403);
if (!empty($mb['mb_leave_date']) && $mb['mb_leave_date'] <= $todayYmd) sfail('탈퇴한 계정입니다.', 403);
if (isset($mb['st_tp']) && (int) $mb['st_tp'] !== 1) sfail('아직 관리자의 승인이 이루어지지 않은 계정입니다.', 403);

// --- 서명 신원 반환 (sso.php 형식과 동일) -----------------------------------
$out_email = isset($mb['mb_email']) ? (string) $mb['mb_email'] : $email;
$out_nick  = isset($mb['mb_nick']) ? (string) $mb['mb_nick'] : $nick;
$now2 = (string) time();
$signed = array('email' => $out_email, 'mb_id' => $mb_id, 'ts' => $now2);
ksort($signed);
$out_sig = hash_hmac('sha256', http_build_query($signed), DW_SSO_SECRET);

echo json_encode(array(
    'ok'    => true,
    'mb_id' => $mb_id,
    'email' => $out_email,
    'nick'  => $out_nick,
    'ts'    => $now2,
    'sig'   => $out_sig,
), JSON_UNESCAPED_UNICODE);
