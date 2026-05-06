import { IsNumber, IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber({}, { message: '최소 출금액은 숫자여야 합니다' })
  minWithdrawalAmount?: number;

  @IsOptional()
  @IsNumber({}, { message: '캐시백 비율은 숫자여야 합니다' })
  defaultCashbackRate?: number;

  @IsOptional()
  @IsObject({ message: '플랫폼 비율은 객체여야 합니다' })
  platformRates?: Record<string, number>;

  @IsOptional()
  @IsBoolean({ message: '점검 모드는 true/false여야 합니다' })
  maintenanceMode?: boolean;
}
