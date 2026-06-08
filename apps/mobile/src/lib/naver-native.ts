import NaverLogin from '@react-native-seoul/naver-login';

/** 사용자가 네이버 로그인을 취소했을 때 던지는 표준 메시지(다른 소셜과 동일 처리). */
export const NAVER_CANCELLED = '로그인이 취소되었습니다';

// 아이홈마켓 웹과 동일한 네이버 앱(g5_config cf_naver_*). 같은 앱이라야 네이버
// 회원 식별자(response.id)가 웹과 일치해 회원이 통합된다. clientId/secret 은
// 네이티브 네이버 로그인 특성상 앱에 내장된다(네이버 모바일 로그인 표준).
const CONSUMER_KEY = 'bgm8CCvyQVSYouzU6X3b';
const CONSUMER_SECRET = 'XZow1S1viU';
const APP_NAME = '더블윈';

let initialized = false;
function ensureInit() {
  if (initialized) return;
  NaverLogin.initialize({
    appName: APP_NAME,
    consumerKey: CONSUMER_KEY,
    consumerSecret: CONSUMER_SECRET,
  });
  initialized = true;
}

/**
 * 네이티브 네이버 로그인 → access token 반환. 이 토큰을 백엔드 /auth/ihome-social
 * (provider='naver')에 넘기면 social_verify.php 가 openapi.naver.com/v1/nid/me 로
 * 검증 후 아이홈마켓 회원과 통합한다.
 */
export async function loginWithNaverNative(): Promise<string> {
  ensureInit();
  const result = await NaverLogin.login();
  if (result.isSuccess && result.successResponse) {
    return result.successResponse.accessToken;
  }
  if (result.failureResponse?.isCancel) {
    throw new Error(NAVER_CANCELLED);
  }
  throw new Error(result.failureResponse?.message || '네이버 로그인에 실패했습니다.');
}
