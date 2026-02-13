'use client';

import { useCreative } from '@/context/CreativeContext';
import { useState, useEffect } from 'react';

export default function EditorPage() {
  const { currentProject, updateProjectContent } = useCreative();
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (currentProject) {
      setContent(currentProject.content);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    setWordCount(content.trim().split(/\s+/).filter(w => w).length);
    setCharCount(content.length);
  }, [content]);

  const handleSave = () => {
    updateProjectContent(content);
    setIsSaved(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  if (!currentProject) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg mb-4">
            ⚠️ 먼저 프로젝트를 선택해주세요
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            대시보드로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              ✍️ 텍스트 에디터
            </h1>
            <p className="text-gray-600">{currentProject.title}</p>
          </div>
          <button
            onClick={handleSave}
            className={`py-2 px-6 rounded-lg font-bold transition-colors ${
              isSaved
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSaved ? '✓ 저장됨' : '💾 저장'}
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="bg-blue-50 border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">단어 수</p>
            <p className="text-2xl font-bold text-blue-600">{wordCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">문자 수</p>
            <p className="text-2xl font-bold text-blue-600">{charCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">추정 읽기 시간</p>
            <p className="text-2xl font-bold text-blue-600">
              {Math.ceil(wordCount / 200)}분
            </p>
          </div>
        </div>
      </div>

      {/* 에디터 */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full">
          <textarea
            value={content}
            onChange={handleContentChange}
            className="w-full h-full p-6 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono text-gray-800"
            placeholder="당신의 이야기를 여기에 작성하세요..."
          />
        </div>
      </div>

      {/* 저장 알림 */}
      {!isSaved && (
        <div className="bg-yellow-50 border-t-2 border-yellow-400 p-4 text-yellow-800">
          <p className="max-w-6xl mx-auto">
            ⚠️ 저장되지 않은 변경사항이 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
