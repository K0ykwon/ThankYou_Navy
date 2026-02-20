'use client';

import React, { useState } from 'react';
import { useCreative } from '@/context/CreativeContext';
import type { TimelineEvent } from '@/types';
import { extractTimeline } from '@/lib/somniApi';

export default function TimelinePage() {
  const { currentProject, updateProjectField: updateField } = useCreative();
  const updateProjectField = updateField;

  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
    year: new Date().getFullYear(),
    title: '',
    description: '',
    episodeId: undefined,
  });
  const [timelineReport, setTimelineReport] = useState<any>(null);
  const [runningCheck, setRunningCheck] = useState(false);
  // 보기 필터: 'all' | 회차 id | 'none'(세계관)
  const [filterEpisodeId, setFilterEpisodeId] = useState<string>('all');

  const handleTimelineCheck = async () => {
    if (!currentProject) return;
    const rawText = currentProject.worldSetting || '';
    if (!rawText.trim()) {
      alert('세계관/스토리 텍스트가 없습니다. 텍스트 에디터에 내용을 먼저 입력하세요.');
      return;
    }
    setRunningCheck(true);
    try {
      const res = await extractTimeline(rawText, currentProject.settingData || null);
      setTimelineReport(res);
    } catch (e: any) {
      alert('타임라인 일관성 검사 실패: ' + (e.message || e));
    } finally {
      setRunningCheck(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex-1 p-8">
        <p className="text-gray-600 dark:text-gray-400">프로젝트를 선택해주세요.</p>
      </div>
    );
  }

  const episodes = currentProject.episodes || [];
  const timelineAll = currentProject.timeline?.events || [];
  const timeline = timelineAll.filter((e): e is TimelineEvent => (e as any).year !== undefined);

  // 필터링된 이벤트
  const filteredTimeline = (() => {
    if (filterEpisodeId === 'all') return timeline;
    if (filterEpisodeId === 'none') return timeline.filter(e => !e.episodeId);
    return timeline.filter(e => e.episodeId === filterEpisodeId);
  })();
  const sortedTimeline = [...filteredTimeline].sort((a, b) => a.year - b.year);

  // 회차별 이벤트 수 집계 (탭 표시용)
  const countByEpisode = (epId: string | 'all' | 'none') => {
    if (epId === 'all') return timeline.length;
    if (epId === 'none') return timeline.filter(e => !e.episodeId).length;
    return timeline.filter(e => e.episodeId === epId).length;
  };

  const handleAddEvent = () => {
    if (newEvent.title?.trim()) {
      const event: TimelineEvent = {
        id: Date.now().toString(),
        year: newEvent.year || new Date().getFullYear(),
        title: newEvent.title,
        description: newEvent.description || '',
        episodeId: newEvent.episodeId || undefined,
      };
      const updatedTimelineEvents = [...timeline, event].sort((a, b) => a.year - b.year);
      const updatedTimeline = { ...currentProject.timeline, events: updatedTimelineEvents };
      updateProjectField('timeline', updatedTimeline);
      setNewEvent({ year: new Date().getFullYear(), title: '', description: '', episodeId: undefined });
    }
  };

  const handleDeleteEvent = (id: string) => {
    const updatedTimelineEvents = timeline.filter((event: TimelineEvent) => event.id !== id);
    const updatedTimeline = { ...currentProject.timeline, events: updatedTimelineEvents };
    updateProjectField('timeline', updatedTimeline);
  };

  const episodeLabelOf = (epId?: string) => {
    if (!epId) return '세계관 전체';
    const ep = episodes.find(e => e.id === epId);
    if (!ep) return '미분류';
    return `${ep.chapterNumber ? ep.chapterNumber + '화' : ''} ${ep.title}`;
  };

  return (
    <div className="flex-1 p-8 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">📅 Timeline</h1>
          <button
            onClick={handleTimelineCheck}
            disabled={runningCheck}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-60"
          >
            {runningCheck ? '검사 중...' : '🔍 타임라인 일관성 검사'}
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">스토리의 시간순 이벤트를 회차별로 관리하세요.</p>

        {/* 타임라인 일관성 검사 결과 */}
        {timelineReport && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">🔍 타임라인 일관성 검사 결과</h3>
              <button onClick={() => setTimelineReport(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">닫기</button>
            </div>
            <div className="p-5 space-y-4">
              {Array.isArray(timelineReport.timeline) && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  추출된 타임라인 이벤트: <span className="font-bold text-gray-900 dark:text-white">{timelineReport.timeline.length}개</span>
                </p>
              )}
              {timelineReport.timeline_consistency && (() => {
                const tc = timelineReport.timeline_consistency;
                return (
                  <div className="space-y-3">
                    {typeof tc.passed === 'boolean' && (
                      <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${tc.passed ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                        {tc.passed ? '✓ 타임라인 일관성 이상 없음' : '✗ 타임라인 일관성 문제 발견'}
                      </div>
                    )}
                    {Array.isArray(tc.issues) && tc.issues.length > 0 && (
                      <ul className="space-y-1.5">
                        {tc.issues.map((issue: string, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
                            <span className="font-bold flex-shrink-0">{i + 1}.</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {tc.summary && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 px-3 py-2 rounded-lg">{tc.summary}</p>
                    )}
                  </div>
                );
              })()}
              {!timelineReport.timeline_consistency && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  일관성 검사 결과가 없습니다. 설정 데이터(캐릭터 추출)가 필요합니다.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 새 이벤트 추가 폼 */}
        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">새로운 이벤트</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">연도</label>
              <input
                type="number"
                value={newEvent.year || ''}
                onChange={(e) => setNewEvent({ ...newEvent, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">제목</label>
              <input
                type="text"
                value={newEvent.title || ''}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="이벤트 제목"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">설명</label>
            <textarea
              value={newEvent.description || ''}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="이벤트 설명"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          {/* 회차 연결 */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">연결 회차</label>
            <select
              value={newEvent.episodeId || ''}
              onChange={(e) => setNewEvent({ ...newEvent, episodeId: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">세계관 전체 (회차 없음)</option>
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.chapterNumber ? `${ep.chapterNumber}화` : ''} {ep.title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddEvent}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
          >
            이벤트 추가
          </button>
        </div>

        {/* 회차별 필터 탭 */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {[
            { id: 'all', label: `전체 (${countByEpisode('all')})` },
            { id: 'none', label: `세계관 (${countByEpisode('none')})` },
            ...episodes.map(ep => ({
              id: ep.id,
              label: `${ep.chapterNumber ? ep.chapterNumber + '화' : ''} ${ep.title} (${countByEpisode(ep.id)})`.trim(),
            })),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterEpisodeId(tab.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterEpisodeId === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:border-indigo-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timeline 리스트 */}
        <div className="space-y-4">
          {sortedTimeline.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">이 필터에 해당하는 이벤트가 없습니다.</p>
          ) : (
            sortedTimeline.map((event: TimelineEvent) => (
              <div key={event.id} className="flex gap-4 pb-4 border-l-4 border-blue-500 pl-4">
                <div className="flex-1">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {event.year}
                          </h3>
                          {event.episodeId && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                              📖 {episodeLabelOf(event.episodeId)}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{event.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="ml-4 px-3 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm rounded transition-colors flex-shrink-0"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
