'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, clearToken } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/dashboard/products', label: '상품 관리', icon: '🛍️' },
  { href: '/dashboard/withdrawals', label: '출금 관리', icon: '💸' },
  { href: '/dashboard/cashback', label: '캐시백 관리', icon: '💰' },
  { href: '/dashboard/users', label: '유저 관리', icon: '👥' },
  { href: '/dashboard/llm', label: 'LLM 채팅', icon: '🤖' },
  { href: '/dashboard/settings', label: '설정', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>더블윈 Admin</div>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : {}),
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          로그아웃
        </button>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: '240px',
    background: '#1a1a2e',
    color: '#fff',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
  },
  logo: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#ff6b35',
    marginBottom: '32px',
    paddingLeft: '8px',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#9ca3af',
    transition: 'all 0.15s',
  },
  navItemActive: {
    background: 'rgba(255,107,53,0.15)',
    color: '#ff6b35',
    fontWeight: 600,
  },
  logoutBtn: {
    padding: '12px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.08)',
    color: '#9ca3af',
    fontSize: '14px',
  },
  main: {
    flex: 1,
    marginLeft: '240px',
    padding: '32px',
  },
};
