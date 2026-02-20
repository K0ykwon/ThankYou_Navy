'use client';

import { useCreative } from '@/context/CreativeContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EditorPage() {
  const { currentProject, updateProject, updateEpisode, addEpisode } = useCreative();
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // 선택된 회차 ID (null = 세계관 전체)
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

  // 새 회차 추가 인풋
  const [showNewEpisode, setShowNewEpisode] = useState(false);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState('');

  // 선택된 회차 또는 세계관이 바뀌면 콘텐츠 로드
  useEffect(() => {
    if (!currentProject) return;
    if (selectedEpisodeId === null) {
      setContent(currentProject.worldSetting || '');
    } else {
      const ep = currentProject.episodes.find((e) => e.id === selectedEpisodeId);
      setContent(ep?.content || '');
    }
    setIsSaved(true);
  }, [selectedEpisodeId, currentProject?.id]);

  useEffect(() => {
    setWordCount(content.trim().split(/\s+/).filter((w) => w).length);
    setCharCount(content.length);
  }, [content]);

  const handleSave = () => {
    if (!currentProject) return;
    if (selectedEpisodeId === null) {
      updateProject(currentProject.id, { worldSetting: content });
    } else {
      updateEpisode(selectedEpisodeId, { content });
    }
    setIsSaved(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleAddEpisode = () => {
    if (!currentProject || !newEpisodeTitle.trim()) return;
    const chapterNum = (currentProject.episodes?.length || 0) + 1;
    const newEp = {
      id: Date.now().toString(),
      title: newEpisodeTitle.trim(),
      content: '',
      chapterNumber: chapterNum,
      scenes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addEpisode(newEp);
    setNewEpisodeTitle('');
    setShowNewEpisode(false);
    setSelectedEpisodeId(newEp.id);
  };

  if (!currentProject) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            프로젝트를 먼저 선택하세요
          </p>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline">
            프로젝트로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const episodes = currentProject.episodes || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">텍스트 에디터</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              {currentProject.title}
              {selectedEpisodeId
                ? ` › ${episodes.find((e) => e.id === selectedEpisodeId)?.chapterNumber ?? ''}화 ${episodes.find((e) => e.id === selectedEpisodeId)?.title ?? ''}`
                : ' › 세계관 전체'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* 통계 */}
            <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span><span className="font-semibold text-gray-600 dark:text-gray-300">{wordCount.toLocaleString()}</span> 단어</span>
              <span><span className="font-semibold text-gray-600 dark:text-gray-300">{charCount.toLocaleString()}</span> 글자</span>
              <span>약 <span className="font-semibold text-gray-600 dark:text-gray-300">{Math.ceil(wordCount / 200)}</span>분</span>
            </div>

            {/* 미저장 표시 */}
            {!isSaved && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">● 미저장</span>
            )}

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              className={`py-1.5 px-4 rounded-lg font-semibold text-sm transition-colors ${
                isSaved
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
              }`}
            >
              {isSaved ? '✓ 저장됨' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {/* Body: episode sidebar + editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* 회차 목록 사이드바 */}
        <div className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col">
          <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">회차 목록</p>
          </div>

          {/* 스크롤 가능한 목록 */}
          <div className="flex-1 overflow-y-auto">
            {/* 세계관 전체 */}
            <button
              onClick={() => setSelectedEpisodeId(null)}
              className={`w-full text-left px-3 py-2.5 text-sm border-b border-gray-200 dark:border-gray-700 transition-colors ${
                selectedEpisodeId === null
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="block truncate">📖 세계관 전체</span>
            </button>

            {/* 회차 목록 */}
            {episodes.map((ep, idx) => (
              <button
                key={ep.id}
                onClick={() => setSelectedEpisodeId(ep.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 transition-colors ${
                  selectedEpisodeId === ep.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                  {ep.chapterNumber ? `${ep.chapterNumber}화` : `${idx + 1}화`}
                </p>
                <p className="text-sm truncate mt-0.5 leading-snug">{ep.title}</p>
              </button>
            ))}

            {episodes.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-600 px-3 py-3">회차가 없습니다</p>
            )}
          </div>

          {/* 새 회차 추가 */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {showNewEpisode ? (
              <div className="space-y-1.5">
                <input
                  autoFocus
                  type="text"
                  value={newEpisodeTitle}
                  onChange={(e) => setNewEpisodeTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddEpisode();
                    if (e.key === 'Escape') { setShowNewEpisode(false); setNewEpisodeTitle(''); }
                  }}
                  placeholder="제목 입력..."
                  className="w-full text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleAddEpisode}
                    className="flex-1 text-xs py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => { setShowNewEpisode(false); setNewEpisodeTitle(''); }}
                    className="flex-1 text-xs py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewEpisode(true)}
                className="w-full text-xs py-1.5 font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 transition-colors"
              >
                + 새 회차
              </button>
            )}
          </div>
        </div>

        {/* 텍스트 에디터 영역 */}
        <div className="flex-1 p-4 overflow-hidden">
          <textarea
            value={content}
            onChange={handleContentChange}
            className="w-full h-full p-5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-gray-800 dark:text-gray-100 dark:bg-gray-900 leading-relaxed font-mono"
            placeholder={
              selectedEpisodeId === null
                ? '세계관, 배경 설정, 전체 줄거리를 여기에 작성하세요...'
                : '이 회차의 내용을 여기에 작성하세요...'
            }
          />
        </div>
      </div>
    </div>
  );
}
