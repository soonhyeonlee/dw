import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '더블윈 관리자',
  description: 'DoubleWin Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
