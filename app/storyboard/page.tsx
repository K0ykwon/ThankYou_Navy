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
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg mb-4">
            프로젝트를 먼저 선택하세요
          </p>
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
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
      // timeline 추출
      const res = await extractTimeline(raw, currentProject.settingData || null);
      const timeline = res?.timeline || res?.timeline || [];
      if (!Array.isArray(timeline) || timeline.length === 0) {
        alert('추출된 씬이 없습니다.');
      } else {
        // 각 타임라인 항목을 SceneEvent로 변환하여 추가
        for (let i = 0; i < timeline.length; i++) {
          const it = timeline[i];
          const title = it.summary || it.chapter_or_chunk || `씬 ${i + 1}`;
          const description = it.summary || it.description || '';
          const timestamp = Math.round(it.earliest_minutes ?? it.timestamp_minutes ?? 0);
          // map character names -> local character ids
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

          // addSceneEvent will persist and update local timeline
          try {
            await addSceneEvent(event);
          } catch (err) {
            console.warn('Failed to add extracted scene event', err);
          }
        }
        alert('자동 씬 추출이 완료되어 스토리보드에 추가되었습니다.');
      }

      // 일관성 검사 실행 및 저장
      try {
        const cons = await checkConsistency(raw, currentProject.settingData || null);
        setLastReport(cons);
        // 저장 시도: projects.consistency_report 컬럼에 저장
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

  const eventsAll = currentProject.timeline.events || [];
  const sortedEvents = eventsAll
    .filter((e): e is SceneEvent => (e as any).timestamp !== undefined)
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎬 스토리보드
            </h1>
            <p className="text-gray-600">{currentProject.title}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              + 새 씬 추가
            </button>
            <button
              onClick={handleAutoExtract}
              disabled={runningAuto}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {runningAuto ? '추출 중...' : '자동 씬 추출 · 일관성 검사'}
            </button>
          </div>
        </div>

        {/* 폼 */}
        {showForm && (
          <div className="bg-white p-8 rounded-lg shadow-md mb-8 border-l-4 border-purple-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? '씬 수정' : '새 씬 생성'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* 제목 */}
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    씬 제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="예: 첫 만남, 결승전 등..."
                  />
                </div>

                {/* 타임스탠프 */}
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    시간대 (분)
                  </label>
                  <input
                    type="number"
                    value={formData.timestamp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        timestamp: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="이 씬이 언제 일어나는지"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    씬 설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="이 씬에서 어떤 일이 일어나는지 설명하세요..."
                    rows={4}
                  />
                </div>

                {/* 등장 캐릭터 */}
                {currentProject.characters.length > 0 && (
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">
                      등장 캐릭터
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {currentProject.characters.map((char) => (
                        <label
                          key={char.id}
                          className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-purple-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.characterIds.includes(char.id)}
                            onChange={() => toggleCharacter(char.id)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-gray-700">{char.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  {editingId ? '수정' : '생성'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 타임라인 */}
        {lastReport && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-yellow-200">
            <h3 className="font-bold text-lg text-gray-800 mb-2">최근 일관성 검사 결과</h3>
            <pre className="text-sm text-gray-700 max-h-48 overflow-auto whitespace-pre-wrap">{JSON.stringify(lastReport, null, 2)}</pre>
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            타임라인 ({sortedEvents.length}개 씬)
          </h2>

          {sortedEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-600 text-lg">아직 씬이 없습니다.</p>
              <p className="text-gray-500">새 씬을 추가해서 스토리를 만들어보세요!</p>
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
                    className="bg-white border-l-4 border-purple-500 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full text-purple-600 font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              {event.title}
                            </h3>
                            <p className="text-purple-600 font-semibold text-sm mt-1">
                              ⏱️ {event.timestamp}분
                            </p>
                          </div>
                        </div>
                      </div>

                      {event.description && (
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <p className="text-gray-600">{event.description}</p>
                        </div>
                      )}

                      {eventCharacters.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-bold text-gray-700 mb-2">
                            등장 캐릭터
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {eventCharacters.map((char) => (
                              <span
                                key={char.id}
                                className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
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
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => deleteSceneEvent(event.id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
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
