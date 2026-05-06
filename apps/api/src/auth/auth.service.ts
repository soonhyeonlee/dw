import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MemberType } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
