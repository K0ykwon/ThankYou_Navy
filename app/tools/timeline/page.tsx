'use client';

import React, { useState } from 'react';
import { useCreative } from '@/context/CreativeContext';
import type { TimelineEvent } from '@/types';

export default function TimelinePage() {
  const { currentProject, updateProjectField: updateField } = useCreative();
  const updateProjectField = updateField;
  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
    year: new Date().getFullYear(),
    title: '',
    description: '',
  });

  if (!currentProject) {
    return (
      <div className="flex-1 p-8">
        <p className="text-gray-600 dark:text-gray-400">프로젝트를 선택해주세요.</p>
      </div>
    );
  }

  const timelineAll = currentProject.timeline?.events || [];
  const timeline = timelineAll.filter((e): e is TimelineEvent => (e as any).year !== undefined);

  const handleAddEvent = () => {
    if (newEvent.title?.trim()) {
      const event: TimelineEvent = {
        id: Date.now().toString(),
        year: newEvent.year || new Date().getFullYear(),
        title: newEvent.title,
        description: newEvent.description || '',
      };
      const updatedTimelineEvents = [...timeline, event].sort((a, b) => a.year - b.year);
      const updatedTimeline = { ...currentProject.timeline, events: updatedTimelineEvents };
      updateProjectField('timeline', updatedTimeline);
      setNewEvent({ year: new Date().getFullYear(), title: '', description: '' });
    }
  };

  const handleDeleteEvent = (id: string) => {
    const updatedTimelineEvents = timeline.filter((event: TimelineEvent) => event.id !== id);
    const updatedTimeline = { ...currentProject.timeline, events: updatedTimelineEvents };
    updateProjectField('timeline', updatedTimeline);
  };

  return (
    <div className="flex-1 p-8 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">📅 Timeline</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">스토리의 시간순 이벤트를 관리하세요.</p>

        {/* 새로운 이벤트 추가 */}
        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">새로운 이벤트</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                연도
              </label>
              <input
                type="number"
                value={newEvent.year || ''}
                onChange={(e) => setNewEvent({ ...newEvent, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                제목
              </label>
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
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={newEvent.description || ''}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="이벤트 설명"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleAddEvent}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
          >
            이벤트 추가
          </button>
        </div>

        {/* Timeline 리스트 */}
        <div className="space-y-4">
          {timeline.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">아직 이벤트가 없습니다.</p>
          ) : (
            timeline.map((event: TimelineEvent, index: number) => (
              <div
                key={event.id}
                className="flex gap-4 pb-4 border-l-4 border-blue-500 pl-4"
              >
                <div className="flex-1">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {event.year}
                        </h3>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {event.title}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">{event.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm rounded transition-colors"
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
