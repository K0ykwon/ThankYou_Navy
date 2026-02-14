'use client';

import React, { useEffect, useState } from 'react';
import { useCreative } from '@/context/CreativeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const fontSizeMap: { [key: string]: number } = {
  sm: 12,
  base: 16,
  lg: 18,
  xl: 20,
};

const fontFamilyMap: { [key: string]: string } = {
  sans: 'sans-serif',
  serif: 'serif',
  mono: 'monospace',
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { userSettings, setFontSize, setFontFamily, setThemeMode } = useCreative();
  const [mounted, setMounted] = useState(false);
  const [fontSizeValue, setFontSizeValue] = useState(16);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (userSettings) {
      setFontSizeValue(fontSizeMap[userSettings.fontSize]);
    }
  }, [userSettings?.fontSize]);

  if (!mounted || !userSettings) {
    return null;
  }

  const handleFontSizeChange = (value: number) => {
    setFontSizeValue(value);
    const sizeKey = Object.keys(fontSizeMap).find(
      (key) => fontSizeMap[key] === value
    );
    if (sizeKey) {
      setFontSize(sizeKey as 'sm' | 'base' | 'lg' | 'xl');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">⚙️ 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none transition-colors"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 space-y-6">
          {/* 폰트 크기 - Range Slider */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              📝 글자 크기 ({fontSizeValue}px)
            </label>
            <input
              type="range"
              min="12"
              max="24"
              step="2"
              value={fontSizeValue}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>작음 12px</span>
              <span>기본 16px</span>
              <span>큼 20px</span>
              <span>매우 큼 24px</span>
            </div>
            <div
              className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-gray-600"
              style={{ fontSize: `${fontSizeValue}px` }}
            >
              이 크기로 텍스트가 표시됩니다.
            </div>
          </div>

          {/* 폰트 선택 - Combobox */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              🔤 폰트 종류
            </label>
            <select
              value={userSettings.fontFamily}
              onChange={(e) => setFontFamily(e.target.value as 'sans' | 'serif' | 'mono')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900"
            >
              <option value="sans">Sans Serif (산세리프)</option>
              <option value="serif">Serif (세리프)</option>
              <option value="mono">Monospace (고정폭)</option>
            </select>
            <div
              className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 text-gray-600"
              style={{ fontFamily: fontFamilyMap[userSettings.fontFamily] }}
            >
              이 폰트로 텍스트가 표시됩니다.
            </div>
          </div>

          {/* 테마 모드 - Toggle Buttons */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              🎨 테마
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setThemeMode('light')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  userSettings.themeMode === 'light'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ☀️ 라이트 모드
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  userSettings.themeMode === 'dark'
                    ? 'bg-gray-800 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🌙 다크 모드
              </button>
            </div>
          </div>

          {/* 현재 설정 요약 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2 text-sm">현재 설정</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>📝 글자 크기: {fontSizeValue}px</li>
              <li>
                🔤 폰트:{' '}
                {
                  ['Sans Serif (산세리프)', 'Serif (세리프)', 'Monospace (고정폭)'][
                    ['sans', 'serif', 'mono'].indexOf(userSettings.fontFamily)
                  ]
                }
              </li>
              <li>
                🎨 테마: {userSettings.themeMode === 'light' ? '라이트 모드' : '다크 모드'}
              </li>
              <li>💾 자동 저장: {userSettings.autoSave ? '활성화' : '비활성화'}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
