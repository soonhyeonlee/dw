/**
 * 시드 스크립트: 관리자 계정 + 데모 상품 데이터
 * 사용법: npx ts-node -r tsconfig-paths/register src/seed.ts
 */
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

const DEMO_PRODUCTS = [
  // 쿠팡
  { platform: 'coupang', externalId: 'cp-001', title: '나이키 에어맥스 270 남성 러닝화 블랙/화이트', price: 89000, originalPrice: 159000, imageUrl: 'https://via.placeholder.com/300x300/E4002B/FFFFFF?text=Nike+Air+Max', productUrl: 'https://www.coupang.com', affiliateUrl: 'https://www.coupang.com', category: '패션', cashbackRate: 3, cashbackAmount: 2670, rating: 4.7, reviewCount: 3241 },
  { platform: 'coupang', externalId: 'cp-002', title: '다이슨 에어랩 멀티스타일러 컴플리트', price: 598000, originalPrice: 699000, imageUrl: 'https://via.placeholder.com/300x300/E4002B/FFFFFF?text=Dyson+Airwrap', productUrl: 'https://www.coupang.com', affiliateUrl: 'https://www.coupang.com', category: '뷰티', cashbackRate: 3, cashbackAmount: 17940, rating: 4.8, reviewCount: 5621 },
  { platform: 'coupang', externalId: 'cp-003', title: '삼성 갤럭시 S25 울트라 256GB', price: 1349000, originalPrice: 1569000, imageUrl: 'https://via.placeholder.com/300x300/E4002B/FFFFFF?text=Galaxy+S25', productUrl: 'https://www.coupang.com', affiliateUrl: 'https://www.coupang.com', category: '전자제품', cashbackRate: 2, cashbackAmount: 26980, rating: 4.9, reviewCount: 8432 },
  { platform: 'coupang', externalId: 'cp-004', title: '곰곰 무항생제 신선한 대란 30구', price: 7980, originalPrice: 9900, imageUrl: 'https://via.placeholder.com/300x300/E4002B/FFFFFF?text=Eggs+30', productUrl: 'https://www.coupang.com', affiliateUrl: 'https://www.coupang.com', category: '식품', cashbackRate: 4, cashbackAmount: 319, rating: 4.6, reviewCount: 12543 },
  { platform: 'coupang', externalId: 'cp-005', title: '아디다스 울트라부스트 22 여성 운동화', price: 109000, originalPrice: 189000, imageUrl: 'https://via.placeholder.com/300x300/E4002B/FFFFFF?text=Adidas+Ultra', productUrl: 'https://www.coupang.com', affiliateUrl: 'https://www.coupang.com', category: '패션', cashbackRate: 3, cashbackAmount: 3270, rating: 4.5, reviewCount: 2187 },
  // 네이버
  { platform: 'naver', externalId: 'nv-001', title: '애플 에어팟 프로 2세대 USB-C 타입', price: 298000, originalPrice: 359000, imageUrl: 'https://via.placeholder.com/300x300/03C75A/FFFFFF?text=AirPods+Pro', productUrl: 'https://shopping.naver.com', affiliateUrl: 'https://shopping.naver.com', category: '전자제품', cashbackRate: 2, cashbackAmount: 5960, rating: 4.8, reviewCount: 15230 },
  { platform: 'naver', externalId: 'nv-002', title: '닥터지 레드 블레미쉬 클리어 수딩 크림', price: 15900, originalPrice: 24000, imageUrl: 'https://via.placeholder.com/300x300/03C75A/FFFFFF?text=Dr.G+Cream', productUrl: 'https://shopping.naver.com', affiliateUrl: 'https://shopping.naver.com', category: '뷰티', cashbackRate: 5, cashbackAmount: 795, rating: 4.4, reviewCount: 8765 },
  { platform: 'naver', externalId: 'nv-003', title: 'LG 그램 17인치 노트북 2025 인텔 코어 Ultra', price: 1899000, originalPrice: 2190000, imageUrl: 'https://via.placeholder.com/300x300/03C75A/FFFFFF?text=LG+Gram+17', productUrl: 'https://shopping.naver.com', affiliateUrl: 'https://shopping.naver.com', category: '전자제품', cashbackRate: 1.5, cashbackAmount: 28485, rating: 4.7, reviewCount: 1243 },
  { platform: 'naver', externalId: 'nv-004', title: '일리 캡슐 커피머신 Y3.3 화이트', price: 89000, originalPrice: 129000, imageUrl: 'https://via.placeholder.com/300x300/03C75A/FFFFFF?text=illy+Y3.3', productUrl: 'https://shopping.naver.com', affiliateUrl: 'https://shopping.naver.com', category: '생활용품', cashbackRate: 3, cashbackAmount: 2670, rating: 4.3, reviewCount: 3421 },
  { platform: 'naver', externalId: 'nv-005', title: '뉴발란스 530 남여공용 스니커즈 실버', price: 119000, originalPrice: 139000, imageUrl: 'https://via.placeholder.com/300x300/03C75A/FFFFFF?text=NB+530', productUrl: 'https://shopping.naver.com', affiliateUrl: 'https://shopping.naver.com', category: '패션', cashbackRate: 2.5, cashbackAmount: 2975, rating: 4.6, reviewCount: 6543 },
  // 11번가
  { platform: '11st', externalId: '11-001', title: '삼성 갤럭시 버즈3 프로 무선 이어폰', price: 249000, originalPrice: 329000, imageUrl: 'https://via.placeholder.com/300x300/FF0038/FFFFFF?text=Galaxy+Buds3', productUrl: 'https://www.11st.co.kr', affiliateUrl: 'https://www.11st.co.kr', category: '전자제품', cashbackRate: 2.5, cashbackAmount: 6225, rating: 4.6, reviewCount: 4532 },
  { platform: '11st', externalId: '11-002', title: '필립스 소닉케어 다이아몬드클린 전동칫솔', price: 159000, originalPrice: 199000, imageUrl: 'https://via.placeholder.com/300x300/FF0038/FFFFFF?text=Philips+Sonic', productUrl: 'https://www.11st.co.kr', affiliateUrl: 'https://www.11st.co.kr', category: '생활용품', cashbackRate: 3, cashbackAmount: 4770, rating: 4.5, reviewCount: 2876 },
  { platform: '11st', externalId: '11-003', title: '애플 아이패드 에어 M3 11인치 128GB', price: 899000, originalPrice: 999000, imageUrl: 'https://via.placeholder.com/300x300/FF0038/FFFFFF?text=iPad+Air+M3', productUrl: 'https://www.11st.co.kr', affiliateUrl: 'https://www.11st.co.kr', category: '전자제품', cashbackRate: 1.5, cashbackAmount: 13485, rating: 4.9, reviewCount: 7654 },
  { platform: '11st', externalId: '11-004', title: '비비고 왕교자 만두 1.05kg x 3봉', price: 18900, originalPrice: 24000, imageUrl: 'https://via.placeholder.com/300x300/FF0038/FFFFFF?text=Bibigo+Mandu', productUrl: 'https://www.11st.co.kr', affiliateUrl: 'https://www.11st.co.kr', category: '식품', cashbackRate: 5, cashbackAmount: 945, rating: 4.7, reviewCount: 21543 },
  { platform: '11st', externalId: '11-005', title: '샤오미 로봇청소기 S20 Pro 물걸레', price: 399000, originalPrice: 499000, imageUrl: 'https://via.placeholder.com/300x300/FF0038/FFFFFF?text=Xiaomi+S20', productUrl: 'https://www.11st.co.kr', affiliateUrl: 'https://www.11st.co.kr', category: '생활용품', cashbackRate: 2, cashbackAmount: 7980, rating: 4.4, reviewCount: 3456 },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const dataSource = app.get(DataSource);

  // 1. 관리자 계정
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@doublewin.co.kr';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

  const existing = await usersService.findByEmail(adminEmail);
  if (existing) {
    console.log(`관리자 계정이 이미 존재합니다: ${adminEmail}`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await usersService.create({
      email: adminEmail,
      password: hashedPassword,
      nickname: '관리자',
      role: 'admin',
    });
    console.log(`관리자 계정 생성 완료: ${adminEmail}`);
  }

  // 2. 데모 협회/파트너 계정
  const demoAssociations = [
    { email: 'assoc1@doublewin.co.kr', nickname: '한국소상공인협회', associationName: '한국소상공인협회', businessNumber: '123-45-67890' },
    { email: 'assoc2@doublewin.co.kr', nickname: '전국학원총연합회', associationName: '전국학원총연합회', businessNumber: '234-56-78901' },
    { email: 'assoc3@doublewin.co.kr', nickname: '대한체육회 지역지부', associationName: '대한체육회 지역지부', businessNumber: '345-67-89012' },
  ];

  const assocIds: string[] = [];
  for (const assoc of demoAssociations) {
    const existingAssoc = await usersService.findByEmail(assoc.email);
    if (existingAssoc) {
      assocIds.push(existingAssoc.id);
      console.log(`협회 계정 이미 존재: ${assoc.associationName}`);
    } else {
      const hashedPw = await bcrypt.hash('demo1234', 10);
      const created = await usersService.create({
        ...assoc,
        password: hashedPw,
        memberType: 'association' as any,
      });
      assocIds.push(created.id);
      console.log(`협회 계정 생성: ${assoc.associationName}`);
    }
  }

  const demoPartners = [
    { email: 'partner1@doublewin.co.kr', nickname: '김관장', businessName: '김관장 태권도', businessCategory: '학원', parentIdx: 1 },
    { email: 'partner2@doublewin.co.kr', nickname: '스마트영어', businessName: '스마트 영어학원', businessCategory: '학원', parentIdx: 1 },
    { email: 'partner3@doublewin.co.kr', nickname: '동네빵집', businessName: '동네빵집 성수점', businessCategory: '소상공인', parentIdx: 0 },
    { email: 'partner4@doublewin.co.kr', nickname: '피트니스24', businessName: '피트니스 24 강남', businessCategory: '체육', parentIdx: 2 },
  ];

  for (const partner of demoPartners) {
    const existingPartner = await usersService.findByEmail(partner.email);
    if (existingPartner) {
      console.log(`파트너 계정 이미 존재: ${partner.businessName}`);
    } else {
      const hashedPw = await bcrypt.hash('demo1234', 10);
      const { parentIdx, ...partnerData } = partner;
      await usersService.create({
        ...partnerData,
        password: hashedPw,
        memberType: 'partner' as any,
        parentId: assocIds[parentIdx],
      });
      console.log(`파트너 계정 생성: ${partner.businessName}`);
    }
  }

  // 3. 데모 상품 데이터
  const productRepo = dataSource.getRepository('Product');
  const existingCount = await productRepo.count();

  if (existingCount > 0) {
    console.log(`상품 데이터가 이미 존재합니다 (${existingCount}개)`);
  } else {
    for (const product of DEMO_PRODUCTS) {
      const discountRate = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

      await productRepo.save({
        ...product,
        discountRate,
        isActive: true,
      });
    }
    console.log(`데모 상품 ${DEMO_PRODUCTS.length}개 생성 완료`);
  }

  // 4. 쇼핑몰 데이터
  const mallRepo = dataSource.getRepository('Mall');
  const mallCount = await mallRepo.count();
  if (mallCount === 0) {
    const mallData = [
      { platform: 'coupang', name: '쿠팡', color: '#E4002B', baseUrl: 'https://www.coupang.com', cashbackRate: 3, sortOrder: 0, appScheme: 'coupang://', appPackage: 'com.coupang.mobile', description: '로켓배송, 로켓프레시 등 다양한 상품', cashbackNote: '구매 확정 후 30일 이내 적립' },
      { platform: 'naver', name: '네이버 쇼핑', color: '#03C75A', baseUrl: 'https://shopping.naver.com', cashbackRate: 2, sortOrder: 1, appScheme: 'navershopping://', appPackage: 'com.nhn.android.search', description: '네이버 쇼핑 최저가 비교', cashbackNote: '구매 확정 후 30일 이내 적립' },
      { platform: '11st', name: '11번가', color: '#FF0038', baseUrl: 'https://www.11st.co.kr', cashbackRate: 2.5, sortOrder: 2, appScheme: '11st://', appPackage: 'com.elevenst', description: '아마존 글로벌 스토어 직구 가능', cashbackNote: '구매 확정 후 45일 이내 적립' },
      { platform: 'gmarket', name: 'G마켓', color: '#36B234', baseUrl: 'https://www.gmarket.co.kr', cashbackRate: 2, sortOrder: 3, description: '스마일배송, 빅스마일데이 할인' },
      { platform: 'ssg', name: 'SSG.COM', color: '#FF514E', baseUrl: 'https://www.ssg.com', cashbackRate: 1.5, sortOrder: 4, description: '신세계, 이마트 통합 쇼핑몰' },
      { platform: 'lotteon', name: '롯데ON', color: '#E60012', baseUrl: 'https://www.lotteon.com', cashbackRate: 2, sortOrder: 5, description: '롯데백화점, 롯데마트 통합몰' },
      { platform: 'wemakeprice', name: '위메프', color: '#FF4F84', baseUrl: 'https://www.wemakeprice.com', cashbackRate: 3, sortOrder: 6, description: '특가, 투데이특가 인기' },
      { platform: 'tmon', name: '티몬', color: '#FF6900', baseUrl: 'https://www.tmon.co.kr', cashbackRate: 2.5, sortOrder: 7, description: '타임커머스 전문' },
    ];

    for (const mall of mallData) {
      await mallRepo.save(mall);
    }
    console.log(`쇼핑몰 ${mallData.length}개 생성 완료`);
  }

  // 5. 홈 블록 데이터
  const blockRepo = dataSource.getRepository('HomeBlock');
  const blockCount = await blockRepo.count();
  if (blockCount === 0) {
    const blocksData = [
      {
        blockType: 'mall_grid',
        title: '쇼핑몰 바로가기',
        subtitle: '경유하면 캐시백!',
        sortOrder: 0,
        config: { maxItems: 8 },
      },
      {
        blockType: 'topic_products',
        title: '🔥 오늘의 인기 상품',
        sortOrder: 1,
        config: { maxItems: 6 },
      },
      {
        blockType: 'mall_products',
        title: '쿠팡 인기 상품',
        sortOrder: 2,
        config: { platform: 'coupang', maxItems: 4 },
      },
      {
        blockType: 'banner',
        title: '🌸 봄맞이 패션 특가',
        subtitle: '최대 70% 할인 + 추가 캐시백',
        sortOrder: 3,
        config: { bannerColor: '#331466', linkUrl: '/category/fashion', linkType: 'internal' },
      },
      {
        blockType: 'mall_products',
        title: '네이버 쇼핑 인기',
        sortOrder: 4,
        config: { platform: 'naver', maxItems: 4 },
      },
    ];

    for (const block of blocksData) {
      await blockRepo.save(block);
    }
    console.log(`홈 블록 ${blocksData.length}개 생성 완료`);
  }

  // 6. 번개장터 데이터
  const marketProductRepo = dataSource.getRepository('MarketProduct');
  const exhibitionRepo = dataSource.getRepository('Exhibition');
  const marketCount = await marketProductRepo.count();

  // 번개장터 직접판매 카탈로그는 실제 아이홈마켓 상품을 ihome-sync 가 채운다.
  // 더미 상품은 명시적으로 SEED_DUMMY_MARKET=true 일 때만(로컬 데모용) 생성.
  if (marketCount === 0 && process.env.SEED_DUMMY_MARKET === 'true') {
    // 기획전 생성
    const ex1 = await exhibitionRepo.save({
      title: '제주 산지직송 특가',
      subtitle: '제주도 프리미엄 먹거리',
      bannerColor: '#6633CC',
      category: '식품',
      sortOrder: 0,
    });

    const ex2 = await exhibitionRepo.save({
      title: '봄맞이 건강식품전',
      subtitle: '봄 활력 충전!',
      bannerColor: '#33AA66',
      category: '건강식품',
      sortOrder: 1,
    });

    // 배너 블록 상품
    await marketProductRepo.save([
      { title: '제주 천연 꿀 산지직송 프리미엄 야생화꿀 500g', price: 29900, originalPrice: 49000, category: '식품', origin: '제주도', producer: '제주양봉농원', deliveryInfo: '제주 출발 2~3일 소요', freeDelivery: true, stockQuantity: 500, soldCount: 1234, rating: 4.8, reviewCount: 326, blockType: 'banner', sortOrder: 0, exhibitionId: ex1.id },
    ]);

    // 2단 블록 상품
    await marketProductRepo.save([
      { title: '한우 등심 1++ 300g', price: 39900, originalPrice: 59000, category: '식품', origin: '강원도 횡성', producer: '횡성한우농장', freeDelivery: true, stockQuantity: 200, soldCount: 156, rating: 4.9, reviewCount: 89, blockType: 'two_col', sortOrder: 0 },
      { title: '전남 유기농 쌀 10kg', price: 32000, originalPrice: 45000, category: '식품', origin: '전라남도 해남', producer: '해남농협', freeDelivery: true, stockQuantity: 300, soldCount: 243, rating: 4.7, reviewCount: 178, blockType: 'two_col', sortOrder: 1 },
      { title: '제주 감귤 5kg 선물세트', price: 24900, originalPrice: 35000, category: '식품', origin: '제주도 서귀포', producer: '서귀포감귤농원', freeDelivery: true, stockQuantity: 150, soldCount: 312, rating: 4.6, reviewCount: 201, blockType: 'two_col', sortOrder: 2, exhibitionId: ex1.id },
      { title: '강원도 산나물 세트', price: 18500, originalPrice: 28000, category: '식품', origin: '강원도 평창', producer: '평창산나물', freeDelivery: false, stockQuantity: 100, soldCount: 87, rating: 4.5, reviewCount: 43, blockType: 'two_col', sortOrder: 3 },
    ]);

    // 3단 슬라이드 (한정 수량)
    await marketProductRepo.save([
      { title: '프리미엄 올리브유 500ml', price: 15900, originalPrice: 25000, category: '식품', origin: '스페인', producer: '올리브팜', stockQuantity: 50, limitQuantity: 100, soldCount: 78, rating: 4.7, reviewCount: 56, blockType: 'three_slide', sortOrder: 0, saleEndAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      { title: '유기농 블루베리 냉동 1kg', price: 22000, originalPrice: 32000, category: '건강식품', origin: '캐나다', producer: '베리팜', stockQuantity: 120, limitQuantity: 200, soldCount: 90, rating: 4.8, reviewCount: 112, blockType: 'three_slide', sortOrder: 1, saleEndAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), exhibitionId: ex2.id },
      { title: '수제 천연비누 3개 세트', price: 12500, originalPrice: 20000, category: '생활용품', origin: '국내', producer: '솝팩토리', stockQuantity: 8, limitQuantity: 100, soldCount: 92, rating: 4.9, reviewCount: 67, blockType: 'three_slide', sortOrder: 2, saleEndAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
    ]);

    // 일반 상품 추가
    await marketProductRepo.save([
      { title: '경북 사과 3kg 가정용', price: 19800, originalPrice: 28000, category: '식품', origin: '경북 영주', producer: '경북과수농원', freeDelivery: true, stockQuantity: 200, soldCount: 445, rating: 4.6, reviewCount: 234, sortOrder: 10 },
      { title: '제주 흑돼지 삼겹살 500g', price: 28500, originalPrice: 38000, category: '식품', origin: '제주도', producer: '제주목장직거래', freeDelivery: true, stockQuantity: 80, soldCount: 167, rating: 4.8, reviewCount: 98, sortOrder: 11, exhibitionId: ex1.id },
    ]);

    console.log('번개장터 기획전 2개 + 상품 10개 생성 완료');
  }

  // 7. 우리 지역 데이터
  const academyRepo = dataSource.getRepository('Academy');
  const couponRepo = dataSource.getRepository('Coupon');
  const academyCount = await academyRepo.count();

  if (academyCount === 0) {
    await academyRepo.save([
      { name: '김관장 태권도', category: '태권도', address: '서울 강남구 역삼동 123-4', region: '서울 강남구', phone: '02-1234-5678', rating: 4.8, reviewCount: 128, viewCount: 2340, momViewCount: 890, heartCount: 234, photos: ['https://via.placeholder.com/400x300'] },
      { name: '스마트 영어학원', category: '영어', address: '서울 강남구 대치동 456-7', region: '서울 강남구', phone: '02-2345-6789', rating: 4.6, reviewCount: 95, viewCount: 1820, momViewCount: 650, heartCount: 178, photos: [] },
      { name: '예은 피아노 학원', category: '피아노', address: '서울 서초구 반포동 789-1', region: '서울 서초구', phone: '02-3456-7890', rating: 4.9, reviewCount: 67, viewCount: 980, momViewCount: 420, heartCount: 156, photos: [] },
      { name: '코드아카데미', category: '코딩', address: '서울 강남구 삼성동 111-2', region: '서울 강남구', phone: '02-4567-8901', rating: 4.7, reviewCount: 43, viewCount: 750, momViewCount: 310, heartCount: 89, photos: [] },
      { name: '수학의 정석 학원', category: '수학', address: '서울 강남구 대치동 222-3', region: '서울 강남구', phone: '02-5678-9012', rating: 4.5, reviewCount: 156, viewCount: 3100, momViewCount: 1200, heartCount: 345, photos: [] },
    ]);

    const now = new Date();
    const expiry1 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const expiry2 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 파트너 계정 가져오기
    const partnerUser1 = await usersService.findByEmail('partner1@doublewin.co.kr');
    const partnerUser2 = await usersService.findByEmail('partner2@doublewin.co.kr');
    const fallbackPartnerId = partnerUser1?.id || partnerUser2?.id || adminEmail;

    await couponRepo.save([
      { title: '태권도 1개월 무료 체험', couponType: '이용권', value: '무료', totalQuantity: 50, remainingQuantity: 45, serialNumber: 'CP-TKD-001', partnerName: '김관장 태권도', category: '태권도', startAt: now, expireAt: expiry1, partnerId: partnerUser1?.id || fallbackPartnerId },
      { title: '영어 레벨테스트 무료', couponType: '무료체험', value: '무료', totalQuantity: 30, remainingQuantity: 20, serialNumber: 'CP-ENG-001', partnerName: '스마트 영어학원', category: '영어', startAt: now, expireAt: expiry2, partnerId: partnerUser2?.id || fallbackPartnerId },
      { title: '피아노 수업료 20% 할인', couponType: '할인권', value: '20%', totalQuantity: 40, remainingQuantity: 30, serialNumber: 'CP-PNO-001', partnerName: '예은 피아노 학원', category: '피아노', startAt: now, expireAt: expiry1, partnerId: partnerUser1?.id || fallbackPartnerId },
      { title: '코딩 입문반 50,000원 할인', couponType: '할인권', value: '50,000원', totalQuantity: 20, remainingQuantity: 12, serialNumber: 'CP-CODE-001', partnerName: '코드아카데미', category: '코딩', startAt: now, expireAt: expiry2, partnerId: partnerUser2?.id || fallbackPartnerId },
    ]);

    console.log('우리 지역: 학원 5개 + 쿠폰 4개 생성 완료');
  }

  // 8. 앱 설정 초기화
  const settingsRepo = dataSource.getRepository('AppSettings');
  const settingsCount = await settingsRepo.count();
  if (settingsCount === 0) {
    await settingsRepo.save({
      id: 1,
      minWithdrawalAmount: 5000,
      defaultCashbackRate: 50,
      platformRates: { coupang: 60, naver: 50, '11st': 55 },
      maintenanceMode: false,
    });
    console.log('앱 설정 초기화 완료');
  }

  await app.close();
}

seed().catch((err) => {
  console.error('시드 실패:', err);
  process.exit(1);
});
