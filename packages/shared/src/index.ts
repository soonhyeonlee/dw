// ==========================================
// DoubleWin 공유 타입 정의
// ==========================================

// 사용자 역할
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// 제휴 플랫폼
export enum Platform {
  COUPANG = 'coupang',
  NAVER = 'naver',
  ELEVENTH_ST = '11st',
}

// 사용자
export interface User {
  id: string;
  email: string;
  nickname: string;
  phone?: string;
  profileImage?: string;
  cashbackBalance: number; // 현재 적립금
  totalEarned: number; // 총 적립 금액
  totalWithdrawn: number; // 총 출금 금액
  createdAt: Date;
}

// 상품
export interface Product {
  id: string;
  platform: Platform;
  externalId: string; // 외부 플랫폼 상품 ID
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl: string;
  productUrl: string; // 원본 상품 URL
  affiliateUrl: string; // 제휴 링크
  category: string;
  cashbackRate: number; // 캐시백 비율 (%)
  cashbackAmount: number; // 예상 캐시백 금액
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 클릭 추적
export interface ClickLog {
  id: string;
  userId: string;
  productId: string;
  platform: Platform;
  affiliateUrl: string;
  clickedAt: Date;
  purchaseConfirmed: boolean;
}

// 캐시백 상태
export enum CashbackStatus {
  PENDING = 'pending', // 구매 확인 대기
  CONFIRMED = 'confirmed', // 구매 확정
  PAID = 'paid', // 사용자에게 지급 완료
  CANCELLED = 'cancelled', // 주문 취소
}

// 캐시백 내역
export interface CashbackTransaction {
  id: string;
  userId: string;
  productId: string;
  platform: Platform;
  orderAmount: number; // 주문 금액
  commissionAmount: number; // 플랫폼으로부터 받은 수수료
  cashbackAmount: number; // 사용자에게 지급할 캐시백
  status: CashbackStatus;
  confirmedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
}

// 출금 상태
export enum WithdrawalStatus {
  REQUESTED = 'requested',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

// 출금 요청
export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: WithdrawalStatus;
  processedAt?: Date;
  createdAt: Date;
}

// 앱 설정 (관리자 설정 가능)
export interface AppSettings {
  minWithdrawalAmount: number; // 최소 출금 금액
  defaultCashbackRate: number; // 기본 캐시백 비율 (%)
  platformRates: Record<Platform, number>; // 플랫폼별 캐시백 비율
  maintenanceMode: boolean;
}

// API 응답
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
