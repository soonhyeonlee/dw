import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const KAKAO_CLIENT_ID = Constants.expoConfig?.extra?.KAKAO_CLIENT_ID || '';
const NAVER_CLIENT_ID = Constants.expoConfig?.extra?.NAVER_CLIENT_ID || '';
const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID || '';

export interface SocialProfile {
  provider: string;
  providerId: string;
  email: string;
  nickname: string;
  profileImage?: string;
}

function getRedirectUri() {
  return AuthSession.makeRedirectUri({ scheme: 'doublewin' });
}

async function openAuthUrl(authUrl: string): Promise<WebBrowser.WebBrowserAuthSessionResult> {
  const redirectUri = getRedirectUri();
  return WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
}

function extractParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryString = url.split('?')[1] || url.split('#')[1] || '';
  for (const pair of queryString.split('&')) {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  return params;
}

// 카카오 로그인
export async function loginWithKakao(): Promise<SocialProfile> {
  const redirectUri = getRedirectUri();
  const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

  const result = await openAuthUrl(authUrl);

  if (result.type !== 'success' || !result.url) {
    throw new Error('카카오 로그인이 취소되었습니다');
  }

  const params = extractParams(result.url);
  if (!params.code) {
    throw new Error('카카오 인가 코드를 받지 못했습니다');
  }

  // 인가 코드로 토큰 교환
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=authorization_code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${params.code}`,
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    throw new Error('카카오 토큰 교환에 실패했습니다');
  }

  // 사용자 정보 조회
  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();

  return {
    provider: 'kakao',
    providerId: String(userData.id),
    email: userData.kakao_account?.email || `kakao_${userData.id}@doublewin.co.kr`,
    nickname: userData.properties?.nickname || '카카오 사용자',
    profileImage: userData.properties?.profile_image,
  };
}

// 네이버 로그인
export async function loginWithNaver(): Promise<SocialProfile> {
  const redirectUri = getRedirectUri();
  const state = Math.random().toString(36).substring(7);
  const authUrl = `https://nid.naver.com/oauth2.0/authorize?client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;

  const result = await openAuthUrl(authUrl);

  if (result.type !== 'success' || !result.url) {
    throw new Error('네이버 로그인이 취소되었습니다');
  }

  const params = extractParams(result.url);
  if (!params.code) {
    throw new Error('네이버 인가 코드를 받지 못했습니다');
  }

  // 인가 코드를 서버로 전달하여 토큰 교환 (client_secret 보호)
  // 현재는 코드를 providerId로 사용하고 서버에서 토큰 교환 처리
  return {
    provider: 'naver',
    providerId: params.code,
    email: `naver_${params.code.substring(0, 8)}@doublewin.co.kr`,
    nickname: '네이버 사용자',
  };
}

// 구글 로그인
export async function loginWithGoogle(): Promise<SocialProfile> {
  const redirectUri = getRedirectUri();
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile`;

  const result = await openAuthUrl(authUrl);

  if (result.type !== 'success' || !result.url) {
    throw new Error('구글 로그인이 취소되었습니다');
  }

  const params = extractParams(result.url);
  if (!params.access_token) {
    throw new Error('구글 액세스 토큰을 받지 못했습니다');
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${params.access_token}` },
  });
  const userData = await userRes.json();

  return {
    provider: 'google',
    providerId: userData.id,
    email: userData.email,
    nickname: userData.name || '구글 사용자',
    profileImage: userData.picture,
  };
}
