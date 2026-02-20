'use client';

import { useCreative } from '@/context/CreativeContext';
import { SceneEvent } from '@/types';
import { useState } from 'react';
import Link from 'next/link';
import { extractTimeline, checkConsistency } from '@/lib/somniApi';
import { supabase } from '@/lib/db';

export default function StoryboardPage() {
  const {
    currentProject,
    addSceneEvent,
    updateSceneEvent,
    deleteSceneEvent,
  } = useCreative();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<SceneEvent, 'id'>>({
    title: '',
    description: '',
    timestamp: 0,
    characterIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('씬 제목을 입력해주세요');
      return;
    }

    if (editingId) {
      updateSceneEvent(editingId, formData);
      setEditingId(null);
    } else {
      const newEvent: SceneEvent = {
        id: Date.now().toString(),
        ...formData,
      };
      addSceneEvent(newEvent);
    }

    setFormData({
      title: '',
      description: '',
      timestamp: 0,
      characterIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setShowForm(false);
  };

  const handleEdit = (event: SceneEvent) => {
    setFormData({
      title: event.title,
      description: event.description,
      timestamp: event.timestamp,
      characterIds: event.characterIds,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      timestamp: 0,
      characterIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const [runningAuto, setRunningAuto] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);

  const handleAutoExtract = async () => {
    if (!currentProject) return;
    const raw = currentProject.worldSetting || '';
    if (!raw.trim()) return alert('프로젝트의 텍스트(World Setting)가 비어있습니다. 먼저 내용을 입력하세요.');
    setRunningAuto(true);
    try {
      const res = await extractTimeline(raw, currentProject.settingData || null);
      const timeline = res?.timeline || [];
      if (!Array.isArray(timeline) || timeline.length === 0) {
        alert('추출된 씬이 없습니다.');
      } else {
        for (let i = 0; i < timeline.length; i++) {
          const it = timeline[i];
          const title = it.summary || it.chapter_or_chunk || `씬 ${i + 1}`;
          const description = it.summary || it.description || '';
          const timestamp = Math.round(it.earliest_minutes ?? it.timestamp_minutes ?? 0);
          const charNames = Array.isArray(it.characters) ? it.characters : [];
          const characterIds: string[] = (currentProject.characters || []).filter(c => charNames.includes(c.name)).map(c => c.id);

          const event: SceneEvent = {
            id: Date.now().toString() + '-' + i + '-' + Math.random().toString(36).slice(2,6),
            title: String(title),
            description: String(description || ''),
            timestamp: Number.isFinite(timestamp) ? timestamp : 0,
            characterIds,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          try {
            await addSceneEvent(event);
          } catch (err) {
            console.warn('Failed to add extracted scene event', err);
          }
        }
        alert('자동 씬 추출이 완료되어 스토리보드에 추가되었습니다.');
      }

      try {
        const cons = await checkConsistency(raw, currentProject.settingData || null);
        setLastReport(cons);
        try {
          await supabase.from('projects').update({ consistency_report: cons, setting_data: currentProject.settingData }).eq('id', currentProject.id);
        } catch (err) {
          console.warn('Supabase projects.update consistency_report failed', err);
        }
        alert('일관성 검사 완료 — 리포트가 저장되었습니다.');
      } catch (err) {
        console.warn('Consistency check failed', err);
      }
    } catch (err: any) {
      console.error('Auto extract/timeline failed', err);
      alert('자동 추출 중 오류가 발생했습니다: ' + (err?.message || err));
    } finally {
      setRunningAuto(false);
    }
  };

  const toggleCharacter = (characterId: string) => {
    setFormData({
      ...formData,
      characterIds: formData.characterIds.includes(characterId)
        ? formData.characterIds.filter((id) => id !== characterId)
        : [...formData.characterIds, characterId],
    });
  };

  const eventsAll = currentProject.timeline.events || [];
  const sortedEvents = eventsAll
    .filter((e): e is SceneEvent => (e as any).timestamp !== undefined)
    .sort((a, b) => a.timestamp - b.timestamp);

  const inputClass = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';
  const labelClass = 'block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm';

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              스토리보드
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{currentProject.title}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-sm"
            >
              + 새 씬 추가
            </button>
            <button
              onClick={handleAutoExtract}
              disabled={runningAuto}
              className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-sm disabled:opacity-60"
            >
              {runningAuto ? '추출 중...' : '자동 씬 추출 · 일관성 검사'}
            </button>
          </div>
        </div>

        {/* 씬 추가/수정 폼 */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-8 border-l-4 border-purple-600">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingId ? '씬 수정' : '새 씬 생성'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>씬 제목 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={inputClass}
                    placeholder="예: 첫 만남, 결승전 등..."
                  />
                </div>

                <div>
                  <label className={labelClass}>시간대 (분)</label>
                  <input
                    type="number"
                    value={formData.timestamp}
                    onChange={(e) => setFormData({ ...formData, timestamp: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                    placeholder="이 씬이 언제 일어나는지"
                  />
                </div>

                <div>
                  <label className={labelClass}>씬 설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={inputClass}
                    placeholder="이 씬에서 어떤 일이 일어나는지 설명하세요..."
                    rows={4}
                  />
                </div>

                {currentProject.characters.length > 0 && (
                  <div>
                    <label className={labelClass}>등장 캐릭터</label>
                    <div className="grid grid-cols-2 gap-2">
                      {currentProject.characters.map((char) => (
                        <label
                          key={char.id}
                          className="flex items-center gap-2 p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.characterIds.includes(char.id)}
                            onChange={() => toggleCharacter(char.id)}
                            className="w-4 h-4 rounded accent-purple-600"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{char.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  {editingId ? '수정' : '생성'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 일관성 검사 리포트 */}
        {lastReport && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">일관성 검사 결과</h3>
              <span className={`text-lg font-bold ${lastReport.score >= 0.8 ? 'text-green-500' : lastReport.score >= 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>
                {Math.round((lastReport.score ?? 0) * 100)}점
              </span>
            </div>
            <div className="p-5 space-y-4">
              {lastReport.report?.character_checks?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">캐릭터 일관성</p>
                  <div className="flex flex-wrap gap-2">
                    {lastReport.report.character_checks.map((c: any) => (
                      <div key={c.name} className={`px-3 py-1.5 rounded-lg text-sm border ${c.passed ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'}`}>
                        <span className="font-medium">{c.name}</span>
                        <span className="ml-1">{c.passed ? '✓' : '✗'}</span>
                        {c.issues?.length > 0 && (
                          <ul className="mt-1 text-xs list-disc list-inside">
                            {c.issues.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {lastReport.report?.world_checks && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">세계관 일관성</p>
                  <div className={`px-3 py-2 rounded-lg text-sm border ${lastReport.report.world_checks.passed ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'}`}>
                    {lastReport.report.world_checks.passed ? '✓ 이상 없음' : '✗ 문제 있음'}
                    {lastReport.report.world_checks.issues?.map((issue: string, i: number) => (
                      <p key={i} className="text-xs mt-0.5">• {issue}</p>
                    ))}
                  </div>
                </div>
              )}
              {lastReport.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">권고사항</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-0.5">
                    {lastReport.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 씬 목록 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
            타임라인 ({sortedEvents.length}개 씬)
          </h2>

          {sortedEvents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-gray-600 dark:text-gray-400 text-lg">아직 씬이 없습니다.</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">새 씬을 추가해서 스토리를 만들어보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEvents.map((event, index) => {
                const eventCharacters = currentProject.characters.filter(
                  (c) => event.characterIds.includes(c.id)
                );

                return (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-800 border-l-4 border-purple-500 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full text-purple-600 dark:text-purple-400 font-bold flex-shrink-0 text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {event.title}
                            </h3>
                            <p className="text-purple-600 dark:text-purple-400 font-medium text-sm mt-0.5">
                              ⏱ {event.timestamp}분
                            </p>
                          </div>
                        </div>
                      </div>

                      {event.description && (
                        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{event.description}</p>
                        </div>
                      )}

                      {eventCharacters.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">등장 캐릭터</p>
                          <div className="flex flex-wrap gap-2">
                            {eventCharacters.map((char) => (
                              <span
                                key={char.id}
                                className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium"
                              >
                                {char.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => deleteSceneEvent(event.id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
