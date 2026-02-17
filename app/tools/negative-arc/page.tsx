'use client';

import React, { useState } from 'react';
import { useCreative } from '@/context/CreativeContext';

interface NegativeArcPoint {
  id: string;
  phase: string;
  description: string;
  emotionalLow: number; // 1-10 scale
}

export default function NegativeArcPage() {
  const { currentProject, updateProjectField: updateField } = useCreative();
  const updateProjectField = updateField;
  const [newPoint, setNewPoint] = useState<Partial<NegativeArcPoint>>({
    phase: '',
    description: '',
    emotionalLow: 5,
  });

  if (!currentProject) {
    return (
      <div className="flex-1 p-8">
        <p className="text-gray-600 dark:text-gray-400">프로젝트를 선택해주세요.</p>
      </div>
    );
  }

  const negativeArc = currentProject.negativeArc || [];

  const handleAddPoint = () => {
    if (newPoint.phase?.trim() && newPoint.description?.trim()) {
      const point: NegativeArcPoint = {
        id: Date.now().toString(),
        phase: newPoint.phase,
        description: newPoint.description,
        emotionalLow: newPoint.emotionalLow || 5,
      };
      const updatedArc = [...negativeArc, point];
      updateProjectField('negativeArc', updatedArc);
      setNewPoint({ phase: '', description: '', emotionalLow: 5 });
    }
  };

  const handleDeletePoint = (id: string) => {
    const updatedArc = negativeArc.filter((point: NegativeArcPoint) => point.id !== id);
    updateProjectField('negativeArc', updatedArc);
  };

  return (
    <div className="flex-1 p-8 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          📉 Negative Arc (부정적 호)
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          캐릭터의 실패, 좌절, 내적 갈등의 과정을 추적하세요.
        </p>

        {/* 새로운 포인트 추가 */}
        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">새로운 포인트</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                단계
              </label>
              <input
                type="text"
                value={newPoint.phase || ''}
                onChange={(e) => setNewPoint({ ...newPoint, phase: e.target.value })}
                placeholder="예: 첫 실패, 점점 깊어지는 절망"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                감정 저점 (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={newPoint.emotionalLow || 5}
                onChange={(e) => setNewPoint({ ...newPoint, emotionalLow: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                현재: {newPoint.emotionalLow || 5}/10
              </p>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={newPoint.description || ''}
              onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
              placeholder="이 단계에서의 사건과 감정을 설명하세요..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleAddPoint}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
          >
            포인트 추가
          </button>
        </div>

        {/* Negative Arc 리스트 */}
        <div className="space-y-4">
          {negativeArc.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">아직 포인트가 없습니다.</p>
          ) : (
            negativeArc.map((point: NegativeArcPoint, index: number) => (
              <div
                key={point.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg border-l-4 border-red-600 dark:border-red-500 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {index + 1}단계
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {point.phase}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDeletePoint(point.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm rounded transition-colors"
                  >
                    삭제
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{point.description}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${(point.emotionalLow / 10) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  감정 저점: {point.emotionalLow}/10
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
