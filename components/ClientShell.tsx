'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SettingsModal from '@/components/SettingsModal';
import FloatingChat from '@/components/FloatingChat';
import { useCreative } from '@/context/CreativeContext';

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentProject, userSettings } = useCreative();
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  
  // 프로젝트 페이지인지 확인 (/, /main, /editor 등)
  const isProjectPage = ['/', '/main', '/editor', '/characters', '/storyboard', '/settings'].includes(pathname);

  // 설정값을 CSS에 적용합니다
  useEffect(() => {
    if (typeof window !== 'undefined' && userSettings) {
      const root = document.documentElement;
      const body = document.body;
      
      // 1. 폰트 크기 적용
      const fontSizeMap: { [key: string]: string } = {
        sm: '12px',
        base: '16px',
        lg: '18px',
        xl: '20px',
      };
      const fontSize = fontSizeMap[userSettings.fontSize] || '16px';
      root.style.setProperty('--font-size-base', fontSize);
      root.style.fontSize = fontSize;

      // 2. 폰트 종류 적용
      const fontFamilyMap: { [key: string]: string } = {
        sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        serif: 'ui-serif, Georgia, serif',
        mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      };
      const fontFamily = fontFamilyMap[userSettings.fontFamily] || 'sans-serif';
      root.style.setProperty('--font-family-body', fontFamily);
      root.style.fontFamily = fontFamily;
      body.style.fontFamily = fontFamily;

      // 3. 테마 적용 (다크 모드)
      if (userSettings.themeMode === 'dark') {
        root.classList.add('dark');
        body.style.backgroundColor = '#0a0a0a';
        body.style.color = '#ededed';
      } else {
        root.classList.remove('dark');
        body.style.backgroundColor = '#ffffff';
        body.style.color = '#171717';
      }
    }
  }, [userSettings]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Global Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-3 px-6 shadow-lg">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-3xl">🎨</span>
            <div>
              <h1 className="text-2xl font-bold">창작 스튜디오</h1>
              <p className="text-xs text-blue-200">창작 보조 도구</p>
            </div>
          </Link>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded transition-colors text-sm font-medium"
          >
            설정
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 gap-0"> 
        {currentProject && <Sidebar />}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Floating AI Chat */}
      <FloatingChat />
    </div>
  );
}
