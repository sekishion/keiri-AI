'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'ホーム', emoji: '🏠' },
  { href: '/timeline', label: '取引', emoji: '📋' },
  { href: '/analysis', label: '分析', emoji: '🔮' },
  { href: '/settings', label: '設定', emoji: '⚙️' },
];

export function BottomNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around z-50" style={{ height: '60px', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {tabs.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-[2px] min-w-[60px] relative transition-colors ${active ? 'text-[#1A3A5C]' : 'text-gray-400'}`}
          >
            <span className={`text-[20px] leading-none ${active ? 'grayscale-0' : 'grayscale opacity-60'}`} style={{ filter: active ? 'none' : 'grayscale(1) opacity(0.5)' }}>
              {tab.emoji}
            </span>
            {tab.href === '/timeline' && pendingCount > 0 && (
              <span className="absolute top-0 right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-[16px] h-[16px] flex items-center justify-center">
                {pendingCount}
              </span>
            )}
            <span className={`text-[11px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
