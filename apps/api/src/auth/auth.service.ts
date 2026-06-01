import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MemberType } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    nickname: string;
    phone?: string;
    memberType?: MemberType;
    parentId?: string;
    associationName?: string;
    businessNumber?: string;
    businessName?: string;
    businessCategory?: string;
    businessAddress?: string;
  }) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다');
    }

    const memberType = dto.memberType || MemberType.USER;

    // parentId 유효성 검증
    if (dto.parentId) {
      await this.usersService.validateParent(memberType, dto.parentId);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      nickname: dto.nickname,
      phone: dto.phone,
      memberType,
      parentId: dto.parentId,
      associationName: dto.associationName,
      businessNumber: dto.businessNumber,
      businessName: dto.businessName,
      businessCategory: dto.businessCategory,
      businessAddress: dto.businessAddress,
    });

    const token = this._generateToken(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: dto.nickname,
        memberType: user.memberType,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const token = this._generateToken(user.id, user.email);
    const { password: _, ...userData } = user;
    return { user: userData, token };
  }

  async socialLogin(data: {
    provider: string;
    providerId: string;
    email: string;
    nickname: string;
    profileImage?: string;
  }) {
    // 기존 소셜 계정 확인
    let user = await this.usersService.findByProvider(data.provider, data.providerId);

    if (!user) {
      // 같은 이메일의 기존 계정 확인
      const existingByEmail = await this.usersService.findByEmail(data.email);
      if (existingByEmail) {
        // 기존 계정에 소셜 연동
        existingByEmail.provider = data.provider;
        existingByEmail.providerId = data.providerId;
        if (data.profileImage) existingByEmail.profileImage = data.profileImage;
        user = await this.usersService.create(existingByEmail);
      } else {
        // 신규 소셜 가입
        user = await this.usersService.create({
          email: data.email,
          nickname: data.nickname,
          provider: data.provider,
          providerId: data.providerId,
          profileImage: data.profileImage,
        });
      }
    }

    const token = this._generateToken(user.id, user.email);
    const { password: _, ...userData } = user;
    return { user: userData, token };
  }

  /**
   * 아이홈마켓(그누보드) 계정 공유 SSO.
   * 그누보드 측 sso.php 가 IHOME_SYNC_SECRET 으로 HMAC 서명한 신원 정보를
   * 검증한 뒤, socialLogin 페더레이션 흐름을 재사용해 더블윈 계정/JWT 로 매핑한다.
   */
  async ihomeLogin(payload: {
    mbId: string;
    email?: string;
    nickname?: string;
    ts: string | number;
    sig: string;
  }) {
    const secret = this.config.get<string>('IHOME_SYNC_SECRET');
    if (!secret) {
      throw new UnauthorizedException('SSO가 구성되지 않았습니다');
    }
    if (!payload?.mbId || !payload?.sig || payload?.ts == null) {
      throw new UnauthorizedException('잘못된 인증 요청입니다');
    }

    // 1) ts 신선도 (±300s) — 리플레이 방지
    const ts = parseInt(String(payload.ts), 10);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > 300) {
      throw new UnauthorizedException('인증 정보가 만료되었습니다');
    }

    // 2) HMAC 검증 — sso.php 와 동일하게 ASCII 필드 {email, mb_id, ts} 만 서명한다.
    //    (nickname 은 한글 멀티바이트라 PHP/JS 인코딩 차이로 서명이 깨질 수 있어 제외 —
    //     표시용일 뿐 신원·페더레이션 키가 아니므로 미서명 무방. email 은 계정 매칭
    //     키이므로 반드시 서명해 타인 이메일 주입을 차단.)
    const signed: Record<string, string> = {
      email: payload.email ?? '',
      mb_id: payload.mbId,
      ts: String(ts),
    };
    const expected = this._ihomeSign(signed, secret);
    if (!this._safeEqualHex(expected, payload.sig)) {
      throw new UnauthorizedException('인증 서명이 올바르지 않습니다');
    }

    // 3) 페더레이션 — provider='ihomemarket', providerId=mb_id
    //    그누보드 이메일이 없으면 mb_id 기반 합성 이메일로 unique 충돌 회피.
    const email = payload.email?.trim() || `${payload.mbId}@ihomemarket.local`;
    const nickname = payload.nickname?.trim() || payload.mbId;
    return this.socialLogin({
      provider: 'ihomemarket',
      providerId: payload.mbId,
      email,
      nickname,
    });
  }

  /**
   * 네이티브 ID/PW 로그인. 앱이 보낸 아이홈마켓 자격증명을 카페24 verify.php 로
   * 서버-투-서버 검증(요청을 HMAC 서명해 호출자 인증)한 뒤, 돌아온 서명 신원을
   * 기존 ihomeLogin() 으로 재검증·페더레이션해 JWT 를 발급한다. 앱은 아이홈마켓
   * 웹 UI 를 거치지 않는다(소셜 로그인만 웹뷰 사용).
   */
  async ihomePasswordLogin(payload: { mbId: string; password: string }) {
    const secret = this.config.get<string>('IHOME_SYNC_SECRET');
    if (!secret) throw new UnauthorizedException('SSO가 구성되지 않았습니다');
    const mbId = payload?.mbId?.trim();
    const password = payload?.password ?? '';
    if (!mbId || !password) {
      throw new UnauthorizedException('아이디와 비밀번호를 입력해주세요');
    }

    const verifyUrl =
      this.config.get<string>('IHOME_VERIFY_URL') ||
      'https://i-homemarket.co.kr/doublewin/verify.php';

    // 요청 인증 서명 — verify.php 가 {mb_id, ts} 로 동일 검증.
    const ts = String(Math.floor(Date.now() / 1000));
    const reqSig = this._ihomeSign({ mb_id: mbId, ts }, secret);

    let body: any;
    try {
      const resp = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          mb_id: mbId,
          mb_password: password,
          ts,
          sig: reqSig,
        }).toString(),
        signal: AbortSignal.timeout(10000),
      });
      body = await resp.json();
    } catch {
      throw new UnauthorizedException('아이홈마켓 인증 서버에 연결할 수 없습니다');
    }

    if (!body?.ok) {
      // verify.php 가 내려준 사용자용 메시지(틀린 비번/미승인 등)를 그대로 노출.
      throw new UnauthorizedException(body?.err || '로그인에 실패했습니다');
    }

    // 돌아온 서명 신원을 기존 경로로 재검증 + 페더레이션 (단일 진실 소스).
    return this.ihomeLogin({
      mbId: body.mb_id,
      email: body.email,
      nickname: body.nick,
      ts: body.ts,
      sig: body.sig,
    });
  }

  // ihome-sync.service.ts 의 sign() 과 동일 규칙: sig 제외, 키 정렬,
  // URLSearchParams(=PHP http_build_query 기본) 직렬화 후 HMAC-SHA256 hex.
  private _ihomeSign(params: Record<string, string>, secret: string): string {
    const usp = new URLSearchParams();
    Object.keys(params)
      .filter((k) => k !== 'sig')
      .sort()
      .forEach((k) => usp.append(k, params[k]));
    return createHmac('sha256', secret).update(usp.toString()).digest('hex');
  }

  private _safeEqualHex(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
      return false;
    }
    try {
      return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    } catch {
      return false;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user.password) {
      throw new UnauthorizedException('소셜 로그인 계정은 비밀번호를 변경할 수 없습니다');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashed);
  }

  async resetPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // 보안상 존재 여부를 알려주지 않음
      return { message: '해당 이메일로 임시 비밀번호가 발송되었습니다' };
    }

    // 임시 비밀번호 생성
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const hashed = await bcrypt.hash(tempPassword, 10);
    await this.usersService.updatePassword(user.id, hashed);

    // TODO: 실제 이메일 발송 연동
    // await this.emailService.send(email, '임시 비밀번호', tempPassword);
    console.log(`[비밀번호 재설정] ${email} → 임시 비밀번호: ${tempPassword}`);

    return { message: '해당 이메일로 임시 비밀번호가 발송되었습니다' };
  }

  private _generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
