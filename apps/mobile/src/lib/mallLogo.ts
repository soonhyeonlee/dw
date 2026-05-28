/**
 * 쇼핑몰 로고 해석.
 * 우선순위: 어드민 지정 logoUrl/iconUrl → 앱 번들 실제 로고 → 도메인 파비콘.
 * 번들 로고는 scripts/fetch-mall-logos.mjs 로 받은 실제 브랜드 마크.
 */

// 번들된 실제 몰 로고 (Metro 요구상 정적 require)
const MALL_LOGO_ASSET: Record<string, any> = {
  coupang: require('../../assets/images/malls/coupang.png'),
  naver: require('../../assets/images/malls/naver.png'),
  '11st': require('../../assets/images/malls/11st.png'),
  gmarket: require('../../assets/images/malls/gmarket.png'),
  ssg: require('../../assets/images/malls/ssg.png'),
  lotteon: require('../../assets/images/malls/lotteon.png'),
  tmon: require('../../assets/images/malls/tmon.png'),
};

const PLATFORM_DOMAIN: Record<string, string> = {
  coupang: 'coupang.com',
  naver: 'naver.com',
  '11st': '11st.co.kr',
  gmarket: 'gmarket.co.kr',
  ssg: 'ssg.com',
  lotteon: 'lotteon.com',
  wemakeprice: 'wemakeprice.com',
  tmon: 'tmon.co.kr',
  auction: 'auction.co.kr',
  interpark: 'interpark.com',
  kurly: 'kurly.com',
  oliveyoung: 'oliveyoung.co.kr',
};

export interface MallLike {
  platform?: string;
  name?: string;
  baseUrl?: string;
  logoUrl?: string;
  iconUrl?: string;
  color?: string;
}

/** 도메인 기반 파비콘 URL (번들 로고 없는 몰의 폴백). */
export function mallFaviconUrl(mall: MallLike): string | undefined {
  let domain: string | undefined = mall.platform ? PLATFORM_DOMAIN[mall.platform] : undefined;
  if (!domain && mall.baseUrl) {
    try {
      domain = new URL(mall.baseUrl).hostname.replace(/^www\./, '');
    } catch {
      /* invalid url */
    }
  }
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : undefined;
}

/**
 * 로고 이미지 소스 해석. RN Image의 source로 바로 사용 가능.
 * 우선순위: 어드민 지정 URL → 번들 로고(require) → 도메인 파비콘. 없으면 undefined.
 */
export function mallLogoSource(mall: MallLike): any {
  const adminUrl = mall.logoUrl || mall.iconUrl;
  if (adminUrl) return { uri: adminUrl };
  const asset = mall.platform ? MALL_LOGO_ASSET[mall.platform] : undefined;
  if (asset) return asset;
  const fav = mallFaviconUrl(mall);
  return fav ? { uri: fav } : undefined;
}
