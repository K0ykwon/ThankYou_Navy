'use client';

import { useCreative } from '@/context/CreativeContext';
import { useState, useEffect } from 'react';
import { extractSetting, extractTimeline, checkConsistency } from '@/lib/somniApi';
import Link from 'next/link';
import { supabase } from '@/lib/db';

export default function EditorPage() {
  const { currentProject, updateProject, addSceneEvent } = useCreative();
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setContent(currentProject.worldSetting || '');
    }
  }, [currentProject?.id]);

  useEffect(() => {
    setWordCount(content.trim().split(/\s+/).filter(w => w).length);
    setCharCount(content.length);
  }, [content]);

  const handleSave = () => {
    if (currentProject) {
      updateProject(currentProject.id, { worldSetting: content });
    }
    setIsSaved(true);
  };

  const [runningTimeline, setRunningTimeline] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);

  const handleAutoTimeline = async () => {
    if (!currentProject) return;
    if (!content.trim()) return alert('원문을 입력하세요.');
    setRunningTimeline(true);
    try {
      const res = await extractTimeline(content.trim(), currentProject.settingData || null);
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

          const event = {
            id: Date.now().toString() + '-' + i + '-' + Math.random().toString(36).slice(2,6),
            title: String(title),
            description: String(description || ''),
            timestamp: Number.isFinite(timestamp) ? timestamp : 0,
            characterIds,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          try {
            await addSceneEvent(event as any);
          } catch (err) {
            console.warn('addSceneEvent failed', err);
          }
        }
        alert('타임라인 추출 완료 — 씬이 스토리보드에 추가되었습니다.');
      }

      try {
        const cons = await checkConsistency(content.trim(), currentProject.settingData || null);
        setLastReport(cons);
        try {
          await supabase.from('projects').update({ consistency_report: cons, setting_data: currentProject.settingData }).eq('id', currentProject.id);
        } catch (err) {
          console.warn('Supabase projects.update consistency_report failed', err);
        }
        alert('일관성 검사 완료 — 리포트 저장 완료.');
      } catch (err) {
        console.warn('checkConsistency failed', err);
      }
    } catch (err: any) {
      console.error('extractTimeline failed', err);
      alert('타임라인 추출 중 오류가 발생했습니다: ' + (err?.message || err));
    } finally {
      setRunningTimeline(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Text Editor
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{currentProject.title}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className={`py-2 px-6 rounded-lg font-bold transition-colors ${
                isSaved
                  ? 'bg-green-600 dark:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
              }`}
            >
              {isSaved ? '✓ Saved' : 'Save'}
            </button>

            <button
              onClick={async () => {
                if (!content.trim() || !currentProject) return alert('원문을 입력하고 프로젝트를 선택하세요');
                setRunning(true);
                try {
                  const existing_settings = currentProject.settingData || {
                    characters: (currentProject.characters || []).map((c: any) => ({
                      name: c.name,
                      aliases: [],
                      description: c.description || null,
                      traits: c.appearance ? c.appearance.split(/[,;]\s*/) : [],
                      relationships: {},
                      role: c.role || null,
                    })),
                    relations: [],
                    name_mapping: {},
                  };

                  const res = await extractSetting(content.trim(), existing_settings);
                  const setting = res?.setting_data;
                  if (!setting) {
                    alert('설정 데이터가 반환되지 않았습니다.');
                  } else {
                    try {
                      await updateProject(currentProject.id, { settingData: setting });
                    } catch (err) {
                      console.warn('projects.update setting_data failed', err);
                    }
                    alert('설정 추출 완료 — 프로젝트에 저장했습니다.');
                  }
                } catch (e: any) {
                  alert('추출 실패: ' + (e.message || e));
                } finally {
                  setRunning(false);
                }
              }}
              disabled={running}
              className="py-2 px-4 rounded-lg font-bold bg-purple-600 hover:bg-purple-700 text-white"
            >
              {running ? '추출 중...' : '캐릭터 추출'}
            </button>

            <button
              onClick={handleAutoTimeline}
              disabled={runningTimeline}
              className="py-2 px-4 rounded-lg font-bold bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {runningTimeline ? '추출·검사 중...' : '자동 씬 추출'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-blue-50 dark:bg-blue-900 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Word Count</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{wordCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Character Count</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{charCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Read Time (min)</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{""}
              {Math.ceil(wordCount / 200)}
            </p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full">
          <textarea
            value={content}
            onChange={handleContentChange}
            className="w-full h-full p-6 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono text-gray-800 dark:text-white dark:bg-gray-900"
            placeholder="Write your story here..."
          />
        </div>
      </div>

      {lastReport && (
        <div className="p-6 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">일관성 검사 결과</h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 max-h-64 overflow-auto whitespace-pre-wrap">{JSON.stringify(lastReport, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Unsaved Alert */}
      {!isSaved && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border-t-2 border-yellow-400 dark:border-yellow-700 p-4 text-yellow-800 dark:text-yellow-200">
          <p className="max-w-6xl mx-auto">
            Unsaved changes
          </p>
        </div>
      )}
    </div>
  );
}
