import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('DoubleWin API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_PATH = ':memory:';
    process.env.JWT_SECRET = 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('POST /auth/register - 회원가입 성공', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@doublewin.co.kr', password: 'password123', nickname: '테스터' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('test@doublewin.co.kr');

      authToken = res.body.data.token;
      userId = res.body.data.user.id;
    });

    it('POST /auth/register - 중복 이메일 거부', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@doublewin.co.kr', password: 'password123', nickname: '테스터2' })
        .expect(409);
    });

    it('POST /auth/login - 로그인 성공', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@doublewin.co.kr', password: 'password123' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('POST /auth/login - 잘못된 비밀번호', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@doublewin.co.kr', password: 'wrong' })
        .expect(401);
    });

    it('POST /auth/change-password - 비밀번호 변경', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'password123', newPassword: 'newpass123' })
        .expect(201);

      expect(res.body.success).toBe(true);

      // 새 비밀번호로 로그인
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@doublewin.co.kr', password: 'newpass123' })
        .expect(201);

      authToken = loginRes.body.data.token;
    });

    it('POST /auth/reset-password - 비밀번호 재설정', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ email: 'test@doublewin.co.kr' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('임시 비밀번호');
    });

    it('POST /auth/social - 소셜 로그인 성공', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/social')
        .send({
          provider: 'kakao',
          providerId: '12345',
          email: 'kakao@doublewin.co.kr',
          nickname: '카카오유저',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('kakao@doublewin.co.kr');
    });
  });

  describe('Users', () => {
    it('GET /users/me - 프로필 조회', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@doublewin.co.kr');
    });

    it('GET /users/me - 인증 없이 접근 불가', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });
  });

  describe('Products', () => {
    it('GET /products - 상품 목록 조회', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
    });

    it('GET /products - 키워드 검색', async () => {
      const res = await request(app.getHttpServer())
        .get('/products?keyword=나이키')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('GET /products - 플랫폼 필터', async () => {
      const res = await request(app.getHttpServer())
        .get('/products?platform=coupang')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Settings', () => {
    it('GET /settings - 설정 조회', async () => {
      const res = await request(app.getHttpServer())
        .get('/settings')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('minWithdrawalAmount');
      expect(res.body.data).toHaveProperty('defaultCashbackRate');
    });

    it('PATCH /settings - 일반 유저는 수정 불가', async () => {
      await request(app.getHttpServer())
        .patch('/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ minWithdrawalAmount: 10000 })
        .expect(403);
    });
  });

  describe('Cashback', () => {
    it('GET /cashback/history - 캐시백 내역 조회', async () => {
      const res = await request(app.getHttpServer())
        .get('/cashback/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });

    it('GET /cashback/history - 인증 없이 접근 불가', async () => {
      await request(app.getHttpServer())
        .get('/cashback/history')
        .expect(401);
    });

    it('POST /cashback/webhook/confirm - 유효하지 않은 시크릿', async () => {
      await request(app.getHttpServer())
        .post('/cashback/webhook/confirm')
        .set('x-webhook-secret', 'wrong-secret')
        .send({
          userId,
          platform: 'coupang',
          orderAmount: 50000,
          commissionAmount: 5000,
        })
        .expect(401);
    });
  });

  describe('Withdrawal', () => {
    it('POST /withdrawal/request - 잔액 부족 시 실패', async () => {
      await request(app.getHttpServer())
        .post('/withdrawal/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5000,
          bankName: '신한',
          accountNumber: '110-123-456789',
          accountHolder: '테스터',
        })
        .expect(400);
    });

    it('GET /withdrawal/history - 출금 내역 조회', async () => {
      const res = await request(app.getHttpServer())
        .get('/withdrawal/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });
  });
});
