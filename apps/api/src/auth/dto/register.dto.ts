import { IsEmail, IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { MemberType } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다' })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  password: string;

  @IsString()
  @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다' })
  @MaxLength(20, { message: '닉네임은 20자 이하여야 합니다' })
  nickname: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(MemberType, { message: '회원 유형이 올바르지 않습니다' })
  memberType?: MemberType;

  // 상위 회원 ID (파트너→협회, 일반→파트너)
  @IsOptional()
  @IsString()
  parentId?: string;

  // === 협회 전용 ===
  @IsOptional()
  @IsString()
  associationName?: string;

  @IsOptional()
  @IsString()
  businessNumber?: string;

  // === 파트너 전용 ===
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessCategory?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;
}
