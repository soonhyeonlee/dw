import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { IHOME_SSO_URL } from '../constants/api';

WebBrowser.maybeCompleteAuthSession();

export interface IhomeIdentity {
  mbId: string;
  email: string;
  nickname: string;
  ts: string;
  sig: string;
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

/**
 * 아이홈마켓(그누보드) 로그인 페이지를 웹뷰로 열어 로그인/회원가입을 처리하고,
 * 성공 시 sso.php 가 doublewin://auth 딥링크로 돌려준 서명된 신원 정보를 파싱한다.
 * 카카오/네이버/구글/아이디 로그인은 모두 아이홈마켓 쪽에서 처리되므로
 * 앱에 별도 소셜 SDK/키가 필요 없다.
 */
export async function loginWithIhome(): Promise<IhomeIdentity> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'doublewin', path: 'auth' });
  const authUrl = `${IHOME_SSO_URL}?redirect=${encodeURIComponent(redirectUri)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success' || !result.url) {
    throw new Error('로그인이 취소되었습니다');
  }

  const p = extractParams(result.url);
  if (!p.mb_id || !p.sig || !p.ts) {
    throw new Error(p.err || '아이홈마켓 인증 정보를 받지 못했습니다');
  }

  return {
    mbId: p.mb_id,
    email: p.email || '',
    nickname: p.nick || p.nickname || '',
    ts: p.ts,
    sig: p.sig,
  };
}
