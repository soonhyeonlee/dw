import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CashbackTransaction } from '../../cashback/entities/cashback-transaction.entity';
import { WithdrawalRequest } from '../../withdrawal/entities/withdrawal-request.entity';

export enum MemberType {
  ASSOCIATION = 'association', // 협회
  PARTNER = 'partner',         // 파트너 (소상공인, 학원 관장 등)
  USER = 'user',               // 일반회원
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'user' })
  role: string; // admin 권한용 (admin | user)

  @Column({ type: 'varchar', default: MemberType.USER })
  memberType: MemberType; // 회원 유형 (association | partner | user)

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  provider: string; // 'local' | 'kakao' | 'naver' | 'google'

  @Column({ nullable: true })
  providerId: string;

  @Column({ nullable: true })
  pushToken: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  profileImage: string;

  // === 3단계 회원체계 관계 ===

  // 상위 회원 (파트너→협회, 일반→파트너)
  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => User, (user) => user.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @OneToMany(() => User, (user) => user.parent)
  children: User[];

  // === 협회 전용 필드 ===

  @Column({ nullable: true })
  associationName: string; // 협회명

  @Column({ nullable: true })
  businessNumber: string; // 사업자등록번호

  @Column({ type: 'boolean', default: true })
  associationActive: boolean; // 협회 활성화 여부 (on/off)

  // === 파트너 전용 필드 ===

  @Column({ nullable: true })
  businessName: string; // 상호명

  @Column({ nullable: true })
  businessCategory: string; // 업종 (학원, 소상공인, 체육 등)

  @Column({ nullable: true })
  businessAddress: string; // 사업장 주소

  // === 캐시백 ===

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashbackBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalEarned: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalWithdrawn: number;

  // === 번개장터 전용 포인트 ===
  // 번개장터(아이홈마켓) 구매로만 적립되고 번개장터에서만 사용 가능.
  // 현금 인출(withdrawal) 대상이 아니며 cashbackBalance 와 완전히 분리된다.
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  marketPointBalance: number;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  accountHolder: string;

  @OneToMany(() => CashbackTransaction, (tx) => tx.user)
  cashbackTransactions: CashbackTransaction[];

  @OneToMany(() => WithdrawalRequest, (w) => w.user)
  withdrawalRequests: WithdrawalRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
