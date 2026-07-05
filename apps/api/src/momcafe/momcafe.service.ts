import { Injectable } from '@nestjs/common';

export interface MomCafe {
  name: string;
  desc: string;
  url: string;
  region: string;
}

export interface MomCafeList {
  items: MomCafe[];
}

interface MomCafeQuery {
  region?: string;
  q?: string;
  limit?: number;
}

const MOM_CAFES: MomCafe[] = [
  {
    name: '맘스홀릭 베이비',
    desc: '전국 · 임신·출산·육아 1위 (약 320만)',
    url: 'https://cafe.naver.com/imsanbu',
    region: '전국',
  },
  {
    name: '레몬테라스',
    desc: '전국 · 살림·인테리어·육아 (약 296만)',
    url: 'https://cafe.naver.com/remonterrace',
    region: '전국',
  },
  {
    name: '용인맘 모여라',
    desc: '용인·광교·분당·수지 (약 37만)',
    url: 'https://cafe.naver.com/easyup',
    region: '수도권',
  },
  {
    name: '수원맘 모여라',
    desc: '수원 (약 33만)',
    url: 'https://cafe.naver.com/byungs94',
    region: '수도권',
  },
  {
    name: '동탄맘들 모여라',
    desc: '동탄·화성 (약 29만)',
    url: 'https://cafe.naver.com/dongtanmom',
    region: '수도권',
  },
  {
    name: '인천맘톡',
    desc: '인천 (약 24만)',
    url: 'https://cafe.naver.com/baby8',
    region: '수도권',
  },
  {
    name: '부경맘',
    desc: '부산·경남 (약 35만)',
    url: 'https://cafe.naver.com/pusanmom',
    region: '영남',
  },
  {
    name: '대구맘 365',
    desc: '대구 (약 30만)',
    url: 'https://cafe.naver.com/dgmom365',
    region: '영남',
  },
  {
    name: '울산맘들 모여라',
    desc: '울산 (약 14만)',
    url: 'https://cafe.naver.com/mammie',
    region: '영남',
  },
  {
    name: '대전세종맘',
    desc: '대전·세종·유성 (약 6만)',
    url: 'https://cafe.naver.com/djnoen',
    region: '충청',
  },
  {
    name: '제주맘',
    desc: '제주 (약 16만)',
    url: 'https://cafe.naver.com/jejumam',
    region: '제주',
  },
];

function resolveRegionGroup(region?: string) {
  if (!region) return undefined;
console.log(region);
  if (/(서울|경기|인천|수원|용인|성남|분당|광교|동탄|화성|수도권|의정부)/.test(region)) {
    return '수도권';
  }
  if (/(부산|대구|울산|경남|경북|창원|김해|양산|영남)/.test(region)) {
    return '영남';
  }
  if (/(대전|세종|충남|충북|청주|천안|충청)/.test(region)) {
    return '충청';
  }
  if (/(제주)/.test(region)) {
    return '제주';
  }

  return region;
}

@Injectable()
export class MomCafeService {
  getMomCafes(query: MomCafeQuery = {}): MomCafeList {
    const keyword = query.q?.trim().toLowerCase();
    const limit = Math.max(1, Math.min(query.limit || 2, 20));
    const regionGroup = resolveRegionGroup(query.region);

    let items = MOM_CAFES.filter((cafe) => {
      if (!keyword) return true;
      return `${cafe.name} ${cafe.desc} ${cafe.region}`.toLowerCase().includes(keyword);
    });

    if (regionGroup && !keyword) {
      const regional = items.filter((cafe) => cafe.region === regionGroup);
      const fallback = items.filter((cafe) => cafe.region !== regionGroup && cafe.region !== '전국');
      items = [...regional, ...fallback];
    } else if (!keyword) {
      items = items.filter((cafe) => cafe.region !== '전국');
    }

    return { items: items.slice(0, limit) };
  }
}
