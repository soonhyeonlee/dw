import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

/** 사용자가 구글 로그인을 취소했을 때 던지는 표준 메시지(다른 소셜과 동일 처리). */
export const GOOGLE_CANCELLED = '로그인이 취소되었습니다';

// 아이홈마켓 웹과 동일 구글 프로젝트의 웹 클라이언트 ID(g5_config cf_google_clientid).
// 네이티브 로그인의 idToken audience 가 이 값이 되며, social_verify.php 가 aud 를
// 이 값과 대조한다. 구글 sub 은 계정 전역 고정이라 웹 회원과 통합된다.
// (Android 빌드가 실제로 토큰을 발급받으려면 같은 구글 프로젝트에 com.doublewin.app
//  + 릴리스 SHA-1 으로 등록된 Android OAuth 클라이언트가 있어야 한다.)
const WEB_CLIENT_ID =
  '726584045345-7qghvgh719e5dmcmqkll3ihha8k8bt44.apps.googleusercontent.com';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  configured = true;
}

/**
 * 네이티브 구글 로그인 → idToken(JWT) 반환. 이 토큰을 백엔드 /auth/ihome-social
 * (provider='google')에 넘기면 social_verify.php 가 tokeninfo 로 검증(iss/aud) 후
 * sub 으로 아이홈마켓 회원과 통합한다.
 */
export async function loginWithGoogleNative(): Promise<string> {
  ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (isSuccessResponse(response)) {
      const idToken = response.data.idToken;
      if (!idToken) throw new Error('구글 인증 토큰을 받지 못했습니다.');
      return idToken;
    }
    // type === 'cancelled'
    throw new Error(GOOGLE_CANCELLED);
  } catch (e: any) {
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error(GOOGLE_CANCELLED);
    }
    if (e?.message === GOOGLE_CANCELLED) throw e;
    throw new Error(e?.message || '구글 로그인에 실패했습니다.');
  }
}
