'use client';

import { useCreative } from '@/context/CreativeContext';
import { useState, useEffect } from 'react';
import { extractSetting } from '@/lib/somniApi';
import Link from 'next/link';

export default function EditorPage() {
  const { currentProject, updateProject } = useCreative();
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
