import { login as kakaoLogin } from '@react-native-seoul/kakao-login';

/** 사용자가 카카오 로그인 시트를 닫았을 때 던지는 표준 메시지(웹뷰 핸들러와 동일 처리). */
export const KAKAO_CANCELLED = '로그인이 취소되었습니다';

/**
 * 네이티브 카카오 로그인. 카카오톡 앱이 있으면 앱 로그인, 없으면 카카오계정 로그인으로
 * 폴백(@react-native-seoul/kakao-login 의 login() 기본 동작) → access token 반환.
 * 이 토큰을 백엔드 /auth/ihome-social 에 넘기면 아이홈마켓 회원과 통합된다.
 */
export async function loginWithKakaoNative(): Promise<string> {
  try {
    const token = await kakaoLogin();
    return token.accessToken;
  } catch (e: any) {
    // 카카오 SDK 는 사용자가 취소하면 code/message 로 cancel 을 알린다(플랫폼마다 상이).
    const code = e?.code ?? '';
    const msg = String(e?.message ?? '');
    if (
      code === 'E_CANCELLED_OPERATION' ||
      /cancel/i.test(code) ||
      /cancel|취소/i.test(msg)
    ) {
      throw new Error(KAKAO_CANCELLED);
    }
    throw new Error(msg || '카카오 로그인에 실패했습니다.');
  }
}
