import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class WithdrawalRequestDto {
  @IsNumber({}, { message: '출금 금액은 숫자여야 합니다' })
  @Min(1, { message: '출금 금액은 1원 이상이어야 합니다' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: '은행명을 입력해주세요' })
  bankName: string;

  @IsString()
  @IsNotEmpty({ message: '계좌번호를 입력해주세요' })
  accountNumber: string;

  @IsString()
  @IsNotEmpty({ message: '예금주를 입력해주세요' })
  accountHolder: string;
}
