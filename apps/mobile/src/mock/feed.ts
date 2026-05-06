/**
 * 실제 페이지 느낌을 내기 위한 모의 피드 데이터.
 * - 쇼핑몰 로고: Clearbit Logo API (https://logo.clearbit.com/<domain>)
 * - 상품 이미지: Unsplash 공용 이미지 (상품 카테고리에 매칭되도록 큐레이션)
 */

const brandLogo = (domain: string) => `https://logo.clearbit.com/${domain}?size=120`;
const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=640&h=640&fit=crop&auto=format&q=70`;

export type MockMall = {
  id: string;
  platform: string;
  name: string;
  cashbackRate: number;
  logoUrl: string;
  tintColor: string;
  wordmark: string;
};

export type MockProduct = {
  id: string;
  title: string;
  brand?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  cashbackRate: number;
  imageUrl: string;
  gallery?: string[];
  platform: string;
  mallLabel: string;
  reviewCount?: number;
  rating?: number;
  soldCount?: number;
  limitQuantity?: number;
  shippingNote?: string;
};

export const MOCK_MALLS: MockMall[] = [
  { id: 'm1', platform: 'coupang',     name: '쿠팡',     cashbackRate: 3,   logoUrl: brandLogo('coupang.com'),       tintColor: '#E4002B', wordmark: 'C' },
  { id: 'm2', platform: 'naver',       name: '네이버',   cashbackRate: 2,   logoUrl: brandLogo('naver.com'),         tintColor: '#03C75A', wordmark: 'N' },
  { id: 'm3', platform: '11st',        name: '11번가',   cashbackRate: 4,   logoUrl: brandLogo('11st.co.kr'),        tintColor: '#FF0038', wordmark: '11' },
  { id: 'm4', platform: 'gmarket',     name: 'G마켓',    cashbackRate: 2.5, logoUrl: brandLogo('gmarket.co.kr'),     tintColor: '#36B234', wordmark: 'G' },
  { id: 'm5', platform: 'ssg',         name: 'SSG닷컴',  cashbackRate: 5,   logoUrl: brandLogo('ssg.com'),           tintColor: '#FF514E', wordmark: 'SSG' },
  { id: 'm6', platform: 'lotteon',     name: '롯데ON',   cashbackRate: 2,   logoUrl: brandLogo('lotteon.com'),       tintColor: '#E4153A', wordmark: 'L' },
  { id: 'm7', platform: 'wemakeprice', name: '위메프',   cashbackRate: 3,   logoUrl: brandLogo('wemakeprice.com'),   tintColor: '#EC008C', wordmark: '위메프' },
  { id: 'm8', platform: 'tmon',        name: '티몬',     cashbackRate: 2.5, logoUrl: brandLogo('tmon.co.kr'),        tintColor: '#FF0000', wordmark: '티몬' },
];

/**
 * 카테고리별로 상품명과 이미지가 잘 매칭되도록 큐레이션된 이미지 ID.
 * 실제로 존재하는 Unsplash 공용 사진.
 */
const IMAGE = {
  headphones:   '1505740420928-5e560c06d30e', // over-ear headphones
  earbuds:      '1606220588913-b3aacb4d2f46', // airpods style earbuds
  keyboard:     '1618384887929-16ec33fab9ef', // mechanical keyboard
  mouse:        '1527814050087-3793815479db', // computer mouse
  laptop:       '1496181133206-80ce9b88a853', // macbook
  monitor:      '1527443224154-c4a3942d3acf', // monitor
  smartwatch:   '1523275335684-37898b6baf30', // watch
  smartphone:   '1592750475338-74b7b21085ab', // smartphone
  tablet:       '1544244015-0df4b3ffc6b0',    // tablet
  tv:           '1593359677879-a4bb92f829d1', // tv
  camera:       '1502920917128-1aa500764cbd', // camera
  sneakers:     '1542291026-7eec264c27ff',    // nike sneakers
  basketball:   '1556906781-9a412961c28c',    // basketball shoes
  running:      '1595950653106-6c9ebd614d3a', // running shoes
  tShirt:       '1521572163474-6864f9cf17ab', // t-shirt
  backpack:     '1553062407-98eeb64c6a62',    // backpack
  sunglasses:   '1572635196237-14b3f281503f', // sunglasses
  coffeeBeans:  '1495474472287-4d71bcdd2085',  // coffee beans
  coffeeBag:    '1611162617213-7d7a39e9b1d7', // coffee packaging
  tea:          '1594631252845-29fc4cc8cde9', // tea cups
  honey:        '1587049352846-4a222e784d38', // honey jar
  oranges:      '1557800636-894a64c1696f',    // oranges
  strawberries: '1560806887-1e4cd0b6cbd6',    // strawberries
  meat:         '1588168333986-5078d3ae3976', // raw meat
  seafood:      '1565557623262-b51c2513a641', // seafood
  rice:         '1586201375761-83865001e31c', // rice bowl
  noodles:      '1569718212165-3a8278d5f624', // ramen
  dumpling:     '1563379091339-03b21ab4a4f8', // dumplings
  wine:         '1510812431401-41d2bd2722f3', // wine
  perfume:      '1523293182086-7651a899d37f', // perfume
  cosmetics:    '1522335789203-aaa93c68c8dd', // cosmetics
  moisturizer:  '1556228720-195a672e8a03',    // skincare
  lipstick:     '1586495777744-4413f21062fa', // lipstick
  bedding:      '1522771739844-6a9f6d5f14af', // bedding
  towel:        '1600566752355-35792bedcfea', // towels
  candle:       '1603006939037-d9a5e4dd0c9e', // candles
  book:         '1512820790803-83ca734da794', // books
};

export const MOCK_DEAL_PRODUCTS: MockProduct[] = [
  {
    id: 'd1',
    title: '소니 WH-1000XM5 무선 노이즈캔슬링 헤드폰',
    brand: 'Sony',
    price: 459000,
    originalPrice: 599000,
    discountRate: 23,
    cashbackRate: 3,
    imageUrl: img(IMAGE.headphones),
    platform: 'coupang',
    mallLabel: '쿠팡',
    rating: 4.8,
    reviewCount: 12034,
  },
  {
    id: 'd2',
    title: '애플 에어팟 프로 2세대 USB-C 정품',
    brand: 'Apple',
    price: 289000,
    originalPrice: 359000,
    discountRate: 19,
    cashbackRate: 2,
    imageUrl: img(IMAGE.earbuds),
    platform: '11st',
    mallLabel: '11번가',
    rating: 4.9,
    reviewCount: 8723,
  },
  {
    id: 'd3',
    title: '스타벅스 하우스 블렌드 원두 200g x 3팩',
    brand: 'Starbucks',
    price: 32900,
    originalPrice: 45000,
    discountRate: 27,
    cashbackRate: 5,
    imageUrl: img(IMAGE.coffeeBeans),
    platform: 'ssg',
    mallLabel: 'SSG',
    rating: 4.8,
    reviewCount: 3421,
  },
  {
    id: 'd4',
    title: '나이키 에어맥스 97 트리플 블랙 운동화',
    brand: 'Nike',
    price: 189000,
    originalPrice: 239000,
    discountRate: 21,
    cashbackRate: 2,
    imageUrl: img(IMAGE.sneakers),
    platform: 'naver',
    mallLabel: '네이버',
    rating: 4.6,
    reviewCount: 2104,
  },
  {
    id: 'd5',
    title: 'LG 그램 16인치 2024 Core i7 16GB 512GB',
    brand: 'LG',
    price: 1890000,
    originalPrice: 2290000,
    discountRate: 17,
    cashbackRate: 3,
    imageUrl: img(IMAGE.laptop),
    platform: 'gmarket',
    mallLabel: 'G마켓',
    rating: 4.8,
    reviewCount: 548,
  },
  {
    id: 'd6',
    title: '로지텍 MX Master 3S 무선 마우스',
    brand: 'Logitech',
    price: 139000,
    originalPrice: 179000,
    discountRate: 22,
    cashbackRate: 4,
    imageUrl: img(IMAGE.mouse),
    platform: 'coupang',
    mallLabel: '쿠팡',
    rating: 4.7,
    reviewCount: 1832,
  },
];

export const MOCK_REC_PRODUCTS: MockProduct[] = [
  {
    id: 'r1',
    title: '삼성 오디세이 G7 32인치 4K 게이밍 모니터',
    brand: 'Samsung',
    price: 789000,
    originalPrice: 990000,
    discountRate: 20,
    cashbackRate: 3,
    imageUrl: img(IMAGE.monitor),
    platform: 'coupang',
    mallLabel: '쿠팡',
    rating: 4.6,
    reviewCount: 4521,
  },
  {
    id: 'r2',
    title: 'LG 울트라HD 55인치 4K 스마트TV',
    brand: 'LG',
    price: 748000,
    originalPrice: 890000,
    discountRate: 16,
    cashbackRate: 2.5,
    imageUrl: img(IMAGE.tv),
    platform: 'gmarket',
    mallLabel: 'G마켓',
    rating: 4.8,
    reviewCount: 2109,
  },
  {
    id: 'r3',
    title: '나이키 에어 조던 1 레트로 하이 OG',
    brand: 'Nike',
    price: 229000,
    originalPrice: 299000,
    discountRate: 23,
    cashbackRate: 2,
    imageUrl: img(IMAGE.basketball),
    platform: 'naver',
    mallLabel: '네이버',
    rating: 4.9,
    reviewCount: 3210,
  },
  {
    id: 'r4',
    title: '애플 아이패드 에어 M2 13인치 WiFi 128GB',
    brand: 'Apple',
    price: 1049000,
    originalPrice: 1129000,
    discountRate: 7,
    cashbackRate: 2,
    imageUrl: img(IMAGE.tablet),
    platform: '11st',
    mallLabel: '11번가',
    rating: 4.9,
    reviewCount: 892,
  },
  {
    id: 'r5',
    title: 'CJ 비비고 왕교자 1.4kg x 2봉 대용량',
    brand: 'CJ',
    price: 19900,
    originalPrice: 24900,
    discountRate: 20,
    cashbackRate: 5,
    imageUrl: img(IMAGE.dumpling),
    platform: 'ssg',
    mallLabel: 'SSG',
    rating: 4.7,
    reviewCount: 15403,
  },
  {
    id: 'r6',
    title: '키크론 Q1 Pro 무선 기계식 키보드',
    brand: 'Keychron',
    price: 299000,
    originalPrice: 369000,
    discountRate: 19,
    cashbackRate: 3,
    imageUrl: img(IMAGE.keyboard),
    platform: 'coupang',
    mallLabel: '쿠팡',
    rating: 4.8,
    reviewCount: 2876,
  },
];

export const MOCK_MARKET_FEATURED: MockProduct[] = [
  {
    id: 'mf1',
    title: '제주 한라봉 3kg 당도보장 산지직송',
    brand: '제주농장',
    price: 19900,
    originalPrice: 29900,
    discountRate: 33,
    cashbackRate: 5,
    imageUrl: img(IMAGE.oranges),
    platform: 'doublewin',
    mallLabel: '더블윈',
    rating: 4.8,
    reviewCount: 421,
    soldCount: 843,
    limitQuantity: 1000,
    shippingNote: '무료배송 · 내일 도착',
  },
  {
    id: 'mf2',
    title: '프리미엄 한우 등심 500g 1++ 등급 선물세트',
    brand: '한우마을',
    price: 79000,
    originalPrice: 120000,
    discountRate: 34,
    cashbackRate: 5,
    imageUrl: img(IMAGE.meat),
    platform: 'doublewin',
    mallLabel: '더블윈',
    rating: 4.9,
    reviewCount: 189,
    soldCount: 412,
    limitQuantity: 500,
    shippingNote: '냉장배송 · 1-2일 소요',
  },
  {
    id: 'mf3',
    title: '유기농 딸기 500g x 2팩 논산 생산자직송',
    brand: '딸기농장',
    price: 24900,
    originalPrice: 39900,
    discountRate: 37,
    cashbackRate: 7,
    imageUrl: img(IMAGE.strawberries),
    platform: 'doublewin',
    mallLabel: '더블윈',
    rating: 4.7,
    reviewCount: 1023,
    soldCount: 678,
    limitQuantity: 800,
    shippingNote: '새벽배송 가능',
  },
  {
    id: 'mf4',
    title: '지리산 토종꿀 500g 국내산 천연 벌꿀',
    brand: '지리산양봉',
    price: 34900,
    originalPrice: 49900,
    discountRate: 30,
    cashbackRate: 5,
    imageUrl: img(IMAGE.honey),
    platform: 'doublewin',
    mallLabel: '더블윈',
    rating: 4.6,
    reviewCount: 312,
    soldCount: 156,
    limitQuantity: 300,
  },
];

export const MOCK_MARKET_FLASH: MockProduct[] = [
  {
    id: 'mfl1',
    title: '전남 완도 활전복 1kg 10미 당일배송',
    price: 29900,
    originalPrice: 45000,
    discountRate: 33,
    cashbackRate: 6,
    imageUrl: img(IMAGE.seafood),
    platform: 'doublewin',
    mallLabel: '더블윈',
    soldCount: 487,
    limitQuantity: 500,
  },
  {
    id: 'mfl2',
    title: '하동 녹차 프리미엄 티백 100개입',
    price: 19900,
    originalPrice: 32000,
    discountRate: 38,
    cashbackRate: 7,
    imageUrl: img(IMAGE.tea),
    platform: 'doublewin',
    mallLabel: '더블윈',
    soldCount: 892,
    limitQuantity: 1000,
  },
  {
    id: 'mfl3',
    title: '강원 햅쌀 20kg 2024년 햇곡 산지직송',
    price: 59000,
    originalPrice: 89000,
    discountRate: 34,
    cashbackRate: 5,
    imageUrl: img(IMAGE.rice),
    platform: 'doublewin',
    mallLabel: '더블윈',
    soldCount: 234,
    limitQuantity: 300,
  },
  {
    id: 'mfl4',
    title: '진라면 매운맛 20봉 x 2박스 벌크팩',
    price: 25900,
    originalPrice: 38000,
    discountRate: 32,
    cashbackRate: 4,
    imageUrl: img(IMAGE.noodles),
    platform: 'doublewin',
    mallLabel: '더블윈',
    soldCount: 667,
    limitQuantity: 700,
  },
];

export function findProductById(id: string): MockProduct | undefined {
  return [
    ...MOCK_DEAL_PRODUCTS,
    ...MOCK_REC_PRODUCTS,
    ...MOCK_MARKET_FEATURED,
    ...MOCK_MARKET_FLASH,
  ].find((p) => p.id === id);
}

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
