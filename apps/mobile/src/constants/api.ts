import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 우선순위: EXPO_PUBLIC_API_URL 환경변수 → __DEV__ 플랫폼별 기본 → 프로덕션 도메인
// (.env의 EXPO_PUBLIC_API_URL 이 release 빌드에도 적용되게 맨 앞)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

const PROD_API_URL = 'https://api.doublewin.co.kr';

function getDevApiUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:3000`;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

const DEV_FALLBACK_URL = getDevApiUrl();

export const API_URL = ENV_API_URL || (__DEV__ ? DEV_FALLBACK_URL : PROD_API_URL);

// 아이홈마켓 계정 공유 SSO 브리지 (그누보드 측 PHP).
// 앱은 이 URL을 웹뷰로 열어 아이홈마켓 로그인/가입을 거친 뒤
// doublewin://auth 딥링크로 서명된 신원 정보를 돌려받는다.
export const IHOME_SSO_URL =
  process.env.EXPO_PUBLIC_IHOME_SSO_URL ||
  'https://i-homemarket.co.kr/doublewin/sso.php';
