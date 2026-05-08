/**
 * 우리지역(아카데미/쿠폰) 모의 데이터.
 * 상품/쇼핑몰 모의 데이터는 제거되었으며 실제 API에서 불러옵니다.
 */

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=640&h=640&fit=crop&auto=format&q=70`;

export type MockAcademy = {
  id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  heartCount: number;
  thumbnail: string;
  tags: string[];
};

export const MOCK_ACADEMIES: MockAcademy[] = [
  {
    id: 'a1',
    name: '국제 태권도 아카데미 강남점',
    category: '태권도',
    address: '서울 강남구 역삼동 823-12',
    rating: 4.8,
    reviewCount: 342,
    viewCount: 12304,
    heartCount: 482,
    thumbnail: img('1555597673-b21d5c935865'),
    tags: ['체험수업', '셔틀운행', '소수정예'],
  },
  {
    id: 'a2',
    name: 'YBM 영어학원 삼성센터',
    category: '영어',
    address: '서울 강남구 삼성동 159-8',
    rating: 4.6,
    reviewCount: 521,
    viewCount: 28410,
    heartCount: 923,
    thumbnail: img('1434030216411-0b793f4b4173'),
    tags: ['원어민수업', '레벨테스트', '토플'],
  },
  {
    id: 'a3',
    name: '수학의 정석 전문학원',
    category: '수학',
    address: '서울 강남구 대치동 929-15',
    rating: 4.9,
    reviewCount: 284,
    viewCount: 19204,
    heartCount: 771,
    thumbnail: img('1509228468518-180dd4864904'),
    tags: ['내신대비', '심화반', '1대1클래스'],
  },
  {
    id: 'a4',
    name: '하모니 피아노 학원',
    category: '피아노',
    address: '서울 강남구 논현동 77-4',
    rating: 4.7,
    reviewCount: 192,
    viewCount: 8301,
    heartCount: 312,
    thumbnail: img('1513883049090-d0b7439799bf'),
    tags: ['유아반', '성인반', '입시준비'],
  },
  {
    id: 'a5',
    name: '디자인 플러스 미술학원',
    category: '미술',
    address: '서울 강남구 신사동 547-9',
    rating: 4.8,
    reviewCount: 231,
    viewCount: 10421,
    heartCount: 402,
    thumbnail: img('1513364776144-60967b0f800f'),
    tags: ['입시미술', '취미반', '포트폴리오'],
  },
];

export type MockCoupon = {
  id: string;
  title: string;
  partnerName: string;
  value: string;
  couponType: '할인권' | '이용권' | '무료체험';
  expireAt: string;
  remainingQuantity: number;
  category: string;
};

export const MOCK_COUPONS: MockCoupon[] = [
  { id: 'c1', title: '첫 수업 50% 할인', partnerName: '국제 태권도 아카데미', value: '50%', couponType: '할인권', expireAt: '2026-05-31', remainingQuantity: 24, category: '태권도' },
  { id: 'c2', title: '무료 레벨테스트 이용권', partnerName: 'YBM 영어학원', value: 'FREE', couponType: '무료체험', expireAt: '2026-06-15', remainingQuantity: 58, category: '영어' },
  { id: 'c3', title: '1개월 수강료 3만원 할인', partnerName: '수학의 정석', value: '30,000원', couponType: '할인권', expireAt: '2026-05-20', remainingQuantity: 12, category: '수학' },
  { id: 'c4', title: '피아노 1시간 체험권', partnerName: '하모니 피아노', value: '1시간', couponType: '이용권', expireAt: '2026-07-01', remainingQuantity: 31, category: '피아노' },
  { id: 'c5', title: '미술 재료비 20% 할인', partnerName: '디자인 플러스', value: '20%', couponType: '할인권', expireAt: '2026-06-30', remainingQuantity: 45, category: '미술' },
];
