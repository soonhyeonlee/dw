/**
 * 더미 데이터 시드: 일반 사용자, 찜, 클릭로그, 캐시백 내역, 출금요청, 학원리뷰, 쿠폰다운로드, 번개장터 주문
 * 실제 API가 없는 개발/테스트 단계에서 UI를 풍부하게 테스트하기 위함
 *
 * 사용: npm run seed:dummy
 */
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const weighted = <T>(items: { value: T; weight: number }[]): T => {
  const total = items.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    if ((r -= it.weight) < 0) return it.value;
  }
  return items[0].value;
};

const NAMES = ['김민지','이서연','박지후','정하은','최도윤','윤서준','임유나','강준호','오지우','홍예린','신하윤','배시우','문채원','백시현','류서아','조은우','송지민','한소율','장태민','남가은'];
const BANKS = ['국민은행','신한은행','우리은행','하나은행','카카오뱅크','토스뱅크','농협은행'];
const PLATFORMS = ['coupang','naver','11st'];
const REJECTION_REASONS = ['계좌정보 불일치','본인 인증 실패','부정 거래 의심','서류 미비'];
const REVIEW_TEMPLATES = [
  '아이가 정말 좋아해요. 선생님도 친절하시고 시설도 깨끗합니다.',
  '가격도 합리적이고 수업 퀄리티가 좋아요. 추천합니다.',
  '처음에는 걱정했는데 한 달 다녀보니 실력이 많이 늘었어요.',
  '주차가 조금 불편하지만 수업이 좋아서 계속 다니고 있어요.',
  '선생님이 꼼꼼하게 봐주셔서 만족해요.',
  '시간표가 유연해서 좋아요. 부모 입장에서 편합니다.',
  '체험수업 후 바로 등록했습니다. 실망 없어요.',
  '동네에서 평이 제일 좋아서 왔는데 역시네요.',
  '수업 분위기가 좋고 아이도 재밌어해요.',
  '커리큘럼이 탄탄합니다. 실력 향상이 눈에 보여요.',
];
const ADDRESSES = [
  '서울 강남구 역삼동 123-4',
  '서울 마포구 상수동 55-1',
  '경기 성남시 분당구 정자동 8-3',
  '부산 해운대구 우동 1433',
  '인천 남동구 구월동 1234',
];

async function dummySeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);

  // ==================== 1. 일반 사용자 20명 ====================
  const userRepo = ds.getRepository('User');
  const existingRegularUsers = await userRepo.createQueryBuilder('u')
    .where('u.memberType = :t', { t: 'user' })
    .getCount();

  if (existingRegularUsers < 20) {
    const pw = await bcrypt.hash('test1234', 10);
    const users: any[] = [];
    for (let i = 0; i < 20; i++) {
      const name = NAMES[i];
      const hasAccount = Math.random() > 0.4;
      const balance = rand(0, 3) === 0 ? 0 : rand(500, 50000);
      users.push({
        email: `user${i + 1}@test.doublewin.co.kr`,
        password: pw,
        nickname: name,
        phone: `010-${String(rand(1000, 9999)).padStart(4, '0')}-${String(rand(1000, 9999)).padStart(4, '0')}`,
        memberType: 'user',
        role: 'user',
        cashbackBalance: balance,
        totalEarned: balance + rand(0, 30000),
        totalWithdrawn: rand(0, 2) === 0 ? rand(5000, 20000) : 0,
        ...(hasAccount
          ? {
              bankName: pick(BANKS),
              accountNumber: `${rand(100, 999)}-${String(rand(100000, 999999)).padStart(6, '0')}-${String(rand(10, 99)).padStart(2, '0')}`,
              accountHolder: name,
            }
          : {}),
      });
    }
    await userRepo.save(users);
    console.log(`✓ 일반 사용자 ${users.length}명 생성`);
  } else {
    console.log(`✓ 일반 사용자 이미 ${existingRegularUsers}명 존재`);
  }

  // 공용 레퍼런스 로드
  const allUsers = await userRepo.createQueryBuilder('u').where('u.memberType = :t', { t: 'user' }).getMany();
  const products = await ds.getRepository('Product').find();
  const malls = await ds.getRepository('Mall').find();
  const academies = await ds.getRepository('Academy').find();
  const couponList = await ds.getRepository('Coupon').find();
  const marketProducts = await ds.getRepository('MarketProduct').find();

  console.log(`  (유저 ${allUsers.length}, 상품 ${products.length}, 몰 ${malls.length}, 학원 ${academies.length}, 쿠폰 ${couponList.length}, 번개상품 ${marketProducts.length})`);

  // ==================== 2. 찜 (상품) ====================
  const wishlistRepo = ds.getRepository('Wishlist');
  if (await wishlistRepo.count() === 0) {
    const seen = new Set<string>();
    const rows: any[] = [];
    for (const u of allUsers) {
      const count = rand(1, 5);
      for (const p of shuffle(products).slice(0, count)) {
        const key = `${u.id}-${p.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ userId: u.id, productId: p.id, createdAt: daysAgo(rand(0, 30)) });
      }
    }
    await wishlistRepo.save(rows);
    console.log(`✓ 상품 찜 ${rows.length}개 생성`);
  }

  // ==================== 3. 찜 (쇼핑몰) ====================
  const mallWishRepo = ds.getRepository('MallWishlist');
  if (await mallWishRepo.count() === 0) {
    const seen = new Set<string>();
    const rows: any[] = [];
    for (const u of allUsers) {
      const count = rand(1, 3);
      for (const m of shuffle(malls).slice(0, count)) {
        const key = `${u.id}-${m.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ userId: u.id, mallId: m.id, createdAt: daysAgo(rand(0, 30)) });
      }
    }
    await mallWishRepo.save(rows);
    console.log(`✓ 쇼핑몰 찜 ${rows.length}개 생성`);
  }

  // ==================== 4. 클릭 로그 ====================
  const clickRepo = ds.getRepository('ClickLog');
  if (await clickRepo.count() === 0) {
    const rows: any[] = [];
    for (let i = 0; i < 200; i++) {
      const u = pick(allUsers);
      const p = pick(products);
      rows.push({
        userId: u.id,
        productId: p.id,
        platform: p.platform,
        affiliateUrl: p.affiliateUrl,
        purchaseConfirmed: Math.random() < 0.35, // 35% 구매확정
        clickedAt: daysAgo(rand(0, 60)),
      });
    }
    await clickRepo.save(rows);
    console.log(`✓ 클릭 로그 ${rows.length}개 생성`);
  }

  // ==================== 5. 캐시백 트랜잭션 ====================
  const cashRepo = ds.getRepository('CashbackTransaction');
  if (await cashRepo.count() === 0) {
    const rows: any[] = [];
    for (let i = 0; i < 120; i++) {
      const u = pick(allUsers);
      const p = pick(products);
      const orderAmount = rand(10000, 300000);
      const cashbackRate = Number(p.cashbackRate) || 2;
      const commission = Math.round(orderAmount * cashbackRate / 100);
      const cashback = Math.round(commission * 0.5);
      const status = weighted<string>([
        { value: 'pending', weight: 25 },
        { value: 'confirmed', weight: 30 },
        { value: 'paid', weight: 30 },
        { value: 'cancelled', weight: 15 },
      ]);
      const createdAt = daysAgo(rand(0, 90));
      rows.push({
        userId: u.id,
        productId: p.id,
        platform: p.platform,
        orderAmount,
        commissionAmount: commission,
        cashbackAmount: cashback,
        status,
        confirmedAt: ['confirmed', 'paid'].includes(status) ? new Date(createdAt.getTime() + 15 * 86400000) : null,
        paidAt: status === 'paid' ? new Date(createdAt.getTime() + 30 * 86400000) : null,
        createdAt,
      });
    }
    await cashRepo.save(rows);
    console.log(`✓ 캐시백 내역 ${rows.length}개 생성`);
  }

  // ==================== 6. 출금 요청 ====================
  const wdRepo = ds.getRepository('WithdrawalRequest');
  if (await wdRepo.count() === 0) {
    const withAccount = allUsers.filter((u: any) => u.bankName);
    const rows: any[] = [];
    for (let i = 0; i < 20; i++) {
      const u: any = pick(withAccount);
      const status = weighted<string>([
        { value: 'requested', weight: 30 },
        { value: 'processing', weight: 10 },
        { value: 'completed', weight: 45 },
        { value: 'rejected', weight: 15 },
      ]);
      const createdAt = daysAgo(rand(0, 60));
      rows.push({
        userId: u.id,
        amount: rand(5, 30) * 1000,
        bankName: u.bankName,
        accountNumber: u.accountNumber,
        accountHolder: u.accountHolder,
        status,
        processedAt: ['completed', 'rejected'].includes(status) ? new Date(createdAt.getTime() + rand(1, 5) * 86400000) : null,
        rejectionReason: status === 'rejected' ? pick(REJECTION_REASONS) : null,
        createdAt,
      });
    }
    await wdRepo.save(rows);
    console.log(`✓ 출금 요청 ${rows.length}개 생성`);
  }

  // ==================== 7. 학원 리뷰 ====================
  const reviewRepo = ds.getRepository('AcademyReview');
  if (await reviewRepo.count() === 0) {
    const rows: any[] = [];
    for (const a of academies) {
      const n = rand(3, 8);
      for (let i = 0; i < n; i++) {
        const u = pick(allUsers);
        rows.push({
          academyId: a.id,
          userId: u.id,
          rating: weighted<number>([
            { value: 5, weight: 55 }, { value: 4, weight: 30 }, { value: 3, weight: 10 }, { value: 2, weight: 3 }, { value: 1, weight: 2 },
          ]),
          content: pick(REVIEW_TEMPLATES),
          photos: Math.random() < 0.2 ? ['https://via.placeholder.com/400x300'] : null,
          isMomCafe: Math.random() < 0.35,
          createdAt: daysAgo(rand(0, 180)),
        });
      }
    }
    await reviewRepo.save(rows);
    console.log(`✓ 학원 리뷰 ${rows.length}개 생성`);
  }

  // ==================== 8. 쿠폰 다운로드 (UserCoupon) ====================
  const userCouponRepo = ds.getRepository('UserCoupon');
  if (await userCouponRepo.count() === 0) {
    const seen = new Set<string>();
    const rows: any[] = [];
    for (const c of couponList) {
      const downloadCount = rand(5, 15);
      for (const u of shuffle(allUsers).slice(0, downloadCount)) {
        const key = `${u.id}-${c.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const isUsed = Math.random() < 0.3;
        const downloadedAt = daysAgo(rand(0, 30));
        rows.push({
          userId: u.id,
          couponId: c.id,
          isUsed,
          usedAt: isUsed ? new Date(downloadedAt.getTime() + rand(1, 10) * 86400000) : null,
          downloadedAt,
        });
      }
    }
    await userCouponRepo.save(rows);
    console.log(`✓ 쿠폰 다운로드 ${rows.length}개 생성`);
  }

  // ==================== 9. 번개장터 주문 ====================
  const orderRepo = ds.getRepository('MarketOrder');
  if (await orderRepo.count() === 0) {
    const rows: any[] = [];
    for (let i = 0; i < 25; i++) {
      const u: any = pick(allUsers);
      const mp: any = pick(marketProducts);
      const quantity = rand(1, 3);
      const status = weighted<string>([
        { value: 'pending', weight: 10 },
        { value: 'paid', weight: 15 },
        { value: 'shipping', weight: 20 },
        { value: 'delivered', weight: 45 },
        { value: 'cancelled', weight: 7 },
        { value: 'refunded', weight: 3 },
      ]);
      const createdAt = daysAgo(rand(0, 45));
      rows.push({
        userId: u.id,
        productId: mp.id,
        quantity,
        totalPrice: Number(mp.price) * quantity,
        status,
        recipientName: u.nickname,
        recipientPhone: u.phone || `010-${rand(1000, 9999)}-${rand(1000, 9999)}`,
        address: pick(ADDRESSES),
        addressDetail: `${rand(1, 30)}층 ${rand(101, 999)}호`,
        zipCode: String(rand(10000, 99999)),
        deliveryMemo: Math.random() < 0.4 ? '경비실에 맡겨주세요' : null,
        trackingNumber: ['shipping', 'delivered'].includes(status) ? String(rand(100000000000, 999999999999)) : null,
        createdAt,
      });
    }
    await orderRepo.save(rows);
    console.log(`✓ 번개장터 주문 ${rows.length}개 생성`);
  }

  // ==================== 10. 사용자 잔액 재계산 ====================
  console.log('사용자 잔액 재계산 중...');
  for (const u of allUsers) {
    const earnedRow = await cashRepo.createQueryBuilder('c')
      .select('COALESCE(SUM(c.cashbackAmount), 0)', 'sum')
      .where('c.userId = :uid', { uid: u.id })
      .andWhere("c.status IN ('confirmed','paid')")
      .getRawOne();
    const withdrawnRow = await wdRepo.createQueryBuilder('w')
      .select('COALESCE(SUM(w.amount), 0)', 'sum')
      .where('w.userId = :uid', { uid: u.id })
      .andWhere("w.status = 'completed'")
      .getRawOne();
    const totalEarned = Number(earnedRow?.sum || 0);
    const totalWithdrawn = Number(withdrawnRow?.sum || 0);
    const balance = Math.max(0, totalEarned - totalWithdrawn);
    await userRepo.update(u.id, { totalEarned, totalWithdrawn, cashbackBalance: balance });
  }
  console.log('✓ 사용자 잔액 재계산 완료');

  await app.close();
  console.log('\n더미 시드 완료');
}

dummySeed().catch((err) => {
  console.error('더미 시드 실패:', err);
  process.exit(1);
});
