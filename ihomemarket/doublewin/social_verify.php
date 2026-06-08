<?php
/**
 * 앱 네이티브 소셜 로그인(카카오·네이버·구글) → 그누보드 회원 매핑 브리지. (모델 A)
 *
 * 배포 위치(카페24): /www/doublewin/social_verify.php
 *
 * 흐름:
 *   1) 더블윈 API 가 {provider, access_token, ts, sig} 를 POST.
 *      - sig: 공유 시크릿으로 {access_token, provider, ts} HMAC (호출자=더블윈 API 인증).
 *      - access_token: 카카오/네이버는 OAuth access token, 구글은 idToken(JWT).
 *   2) provider 토큰을 해당 소셜 API 로 검증 + 프로필(identifier/email/nick) 취득.
 *      - 카카오: kapi.kakao.com /v1 access_token_info(+app_id) + /v2 user/me. identifier=회원번호.
 *      - 네이버: openapi.naver.com /v1/nid/me. identifier=response.id (네이버 앱 스코프).
 *      - 구글 : oauth2.googleapis.com/tokeninfo?id_token=. identifier=sub (계정 전역 고정).
 *   3) g5_member_social_profiles(provider, identifier) 로 회원 조회.
 *      - 있으면 그 mb_id. 없으면 g5_member + social_profiles 행을 생성(자동가입, st_tp=1).
 *        → 웹 소셜 로그인도 동일 (provider, identifier) 로 같은 회원에 매칭(계정 통합).
 *   4) sso.php 와 동일한 서명 신원 {mb_id,email,nick,ts,sig} 반환 → API ihomeLogin() 재사용.
 *
 * 동일 앱 전제(계정 통합의 핵심):
 *   - 카카오/네이버 identifier 는 OAuth 앱 스코프 → 앱이 웹과 같은 카카오/네이버 앱키로
 *     발급한 토큰이라야 회원번호가 웹과 일치. (g5_config cf_kakao_rest_key / cf_naver_clientid)
 *   - 구글 sub 은 구글 계정 전역 고정 → 클라이언트가 달라도 동일. 단 idToken aud 는 우리
 *     구글 클라이언트(cf_google_clientid)와 일치해야 함(위조 토큰 차단).
 */

header('Content-Type: application/json; charset=utf-8');

function sfail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'err' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function http_get_json($url, $headers = array()) {
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

$SUPPORTED = array('kakao', 'naver', 'google');
if ($provider === '' || $token === '' || $ts === '' || $sig === '') sfail('missing fields');
if (!in_array($provider, $SUPPORTED, true)) sfail('unsupported provider', 400);

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

// --- provider 별 토큰 검증 + 프로필 -> ($identifier, $email, $nick) ----------
$identifier = ''; $email = ''; $nick = '';

if ($provider === 'kakao') {
    // 우리 카카오 앱 토큰인지 확인(app_id) — DW_KAKAO_APP_ID 정의 시만 강제.
    list($ic, $info) = http_get_json('https://kapi.kakao.com/v1/user/access_token_info',
        array('Authorization: Bearer ' . $token));
    if ($ic !== 200 || !isset($info['id'])) sfail('카카오 토큰이 유효하지 않습니다.', 401);
    if (defined('DW_KAKAO_APP_ID') && DW_KAKAO_APP_ID && (string) $info['app_id'] !== (string) DW_KAKAO_APP_ID) {
        sfail('토큰의 앱이 일치하지 않습니다.', 401);
    }
    list($pc, $me) = http_get_json('https://kapi.kakao.com/v2/user/me',
        array('Authorization: Bearer ' . $token));
    if ($pc !== 200 || !isset($me['id'])) sfail('카카오 프로필 조회 실패', 401);
    $identifier = (string) $me['id']; // 카카오 회원번호 (앱 스코프 — 웹과 동일)
    $kakao_acc  = isset($me['kakao_account']) ? $me['kakao_account'] : array();
    $email      = isset($kakao_acc['email']) ? (string) $kakao_acc['email'] : '';
    if (isset($kakao_acc['profile']['nickname'])) $nick = (string) $kakao_acc['profile']['nickname'];
    elseif (isset($me['properties']['nickname'])) $nick = (string) $me['properties']['nickname'];

} elseif ($provider === 'naver') {
    // 네이버 access token → 프로필. identifier=response.id (우리 네이버 앱 스코프).
    list($pc, $me) = http_get_json('https://openapi.naver.com/v1/nid/me',
        array('Authorization: Bearer ' . $token));
    if ($pc !== 200 || !isset($me['resultcode']) || $me['resultcode'] !== '00' || empty($me['response']['id'])) {
        sfail('네이버 토큰이 유효하지 않습니다.', 401);
    }
    $r = $me['response'];
    $identifier = (string) $r['id'];
    $email      = isset($r['email']) ? (string) $r['email'] : '';
    if (!empty($r['nickname'])) $nick = (string) $r['nickname'];
    elseif (!empty($r['name'])) $nick = (string) $r['name'];

} elseif ($provider === 'google') {
    // 구글 idToken 검증 → sub. aud 가 우리 구글 클라이언트와 일치해야 함(위조 차단).
    list($gc, $gi) = http_get_json('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($token));
    if ($gc !== 200 || empty($gi['sub'])) sfail('구글 토큰이 유효하지 않습니다.', 401);
    $iss = isset($gi['iss']) ? (string) $gi['iss'] : '';
    if ($iss !== 'accounts.google.com' && $iss !== 'https://accounts.google.com') {
        sfail('구글 토큰 발급자가 올바르지 않습니다.', 401);
    }
    // 허용 aud: cf_google_clientid(웹/네이티브 공통 audience) + 선택 DW_GOOGLE_EXTRA_AUD.
    $allowed = array();
    if (!empty($config['cf_google_clientid'])) $allowed[] = (string) $config['cf_google_clientid'];
    if (defined('DW_GOOGLE_EXTRA_AUD') && DW_GOOGLE_EXTRA_AUD) {
        foreach (explode(',', DW_GOOGLE_EXTRA_AUD) as $a) { $a = trim($a); if ($a !== '') $allowed[] = $a; }
    }
    $aud = isset($gi['aud']) ? (string) $gi['aud'] : '';
    if (!empty($allowed) && !in_array($aud, $allowed, true)) {
        sfail('구글 토큰의 앱이 일치하지 않습니다.', 401);
    }
    if (isset($gi['email_verified']) && ($gi['email_verified'] === 'false' || $gi['email_verified'] === false)) {
        // 이메일 미인증이어도 sub 로 매칭은 가능 — 차단하지 않고 이메일만 비움.
    }
    $identifier = (string) $gi['sub'];
    $email      = isset($gi['email']) ? (string) $gi['email'] : '';
    $nick       = isset($gi['name']) ? (string) $gi['name'] : '';
}

if ($identifier === '') sfail('프로필 식별자를 가져오지 못했습니다.', 401);

// --- 회원 매핑 (g5_member_social_profiles) ----------------------------------
$T_MEMBER  = G5_TABLE_PREFIX . 'member';
$T_SOCIAL  = G5_TABLE_PREFIX . 'member_social_profiles';
$id_esc    = sql_escape_string($identifier);
$prov_esc  = sql_escape_string($provider);

$row = sql_fetch("SELECT mb_id FROM `$T_SOCIAL` WHERE provider='$prov_esc' AND identifier='$id_esc'");
$mb_id = $row && !empty($row['mb_id']) ? $row['mb_id'] : '';

if ($mb_id === '') {
    // 최초 소셜 로그인 → 회원 + 매핑 자동 생성 (자동가입, st_tp=1).
    $prefix_map = array('kakao' => 'kko', 'naver' => 'nv', 'google' => 'ggl');
    $prefix = isset($prefix_map[$provider]) ? $prefix_map[$provider] : substr($provider, 0, 3);
    $base = $prefix . preg_replace('/[^0-9a-z]/i', '', $identifier);
    $new_id = substr($base, 0, 20);
    // mb_id 충돌 회피
    $i = 0;
    while (sql_fetch("SELECT mb_id FROM `$T_MEMBER` WHERE mb_id='" . sql_escape_string($new_id) . "'")) {
        $i++; $new_id = substr($base, 0, 17) . sprintf('%03d', $i);
    }
    $nick_default = array('kakao' => '카카오', 'naver' => '네이버', 'google' => '구글');
    $mb_email = $email !== '' ? $email : ($new_id . '@' . $provider . '.local');
    $mb_nick  = $nick !== '' ? $nick : ($nick_default[$provider] . substr($identifier, -4));
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
        VALUES ('" . sql_escape_string($new_id) . "', '$prov_esc', '" . sql_escape_string($object_sha) . "',
                '$id_esc', '', '', '" . sql_escape_string($mb_nick) . "', '', '$now', '$now')", false);

    $mb_id = $new_id;
} else {
    sql_query("UPDATE `$T_SOCIAL` SET mp_latest_day='" . date('Y-m-d H:i:s') . "'
               WHERE provider='$prov_esc' AND identifier='$id_esc'", false);
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
