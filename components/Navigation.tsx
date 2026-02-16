'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/main', label: '메인', icon: '🏠' },
    { href: '/editor', label: '텍스트 에디터', icon: '✍️' },
    { href: '/characters', label: '캐릭터 관리', icon: '👥' },
    { href: '/storyboard', label: '스토리보드', icon: '🎬' },
    { href: '/settings', label: '설정', icon: '⚙️' },
  ];

  return (
    <nav className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-lg overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-bold">📚 네비게이션</h2>
      </div>

      <div className="mt-4 space-y-2 px-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'text-blue-100 hover:bg-blue-700 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="absolute bottom-6 left-4 right-4 border-t border-blue-700 pt-6">
        <Link href="/" className="text-xs text-blue-300 hover:text-blue-100 transition-colors">
          ← 프로젝트 목록
        </Link>
      </div>
    </nav>
  );
}
