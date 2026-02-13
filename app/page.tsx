'use client';

import { useState } from 'react';
import { useCreative } from '@/context/CreativeContext';
import Link from 'next/link';

export default function Dashboard() {
  const { projects, currentProject, createProject, selectProject, deleteProject, addEpisode, updateEpisode, deleteEpisode } = useCreative();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [showNewEpisodeForm, setShowNewEpisodeForm] = useState(false);
  const [episodeForm, setEpisodeForm] = useState({ title: '', summary: '' });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      createProject(formData.title, formData.description);
      setFormData({ title: '', description: '' });
      setShowNewProjectForm(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 대시보드</h1>
          <p className="text-gray-600">당신의 창작 프로젝트를 관리하세요</p>
        </div>

        {/* 새 프로젝트 생성 버튼 */}
        <div className="mb-8">
          <button
            onClick={() => setShowNewProjectForm(!showNewProjectForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            + 새 프로젝트 만들기
          </button>
        </div>

        {/* 새 프로젝트 폼 */}
        {showNewProjectForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="예: 마이 판타지 소설"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  생성
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProjectForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 현재 선택된 프로젝트 정보 */}
        {currentProject && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded-lg">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">
              현재 프로젝트: {currentProject.title}
            </h2>
            <p className="text-blue-800 mb-4">{currentProject.description}</p>
            <div className="flex gap-4">
              <Link
                href="/editor"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                ✍️ 텍스트 에디터
              </Link>
              <Link
                href="/characters"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                👥 캐릭터 관리
              </Link>
              <Link
                href="/storyboard"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                🎬 스토리보드
              </Link>
            </div>

            {/* 회차 관리 섹션 */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-900">회차 관리</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewEpisodeForm(!showNewEpisodeForm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg"
                  >
                    + 새 회차 추가
                  </button>
                </div>
              </div>

              {showNewEpisodeForm && (
                <div className="bg-white p-4 rounded-lg mt-4">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">회차 제목</label>
                    <input
                      value={episodeForm.title}
                      onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">요약</label>
                    <textarea
                      value={episodeForm.summary}
                      onChange={(e) => setEpisodeForm({ ...episodeForm, summary: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!episodeForm.title.trim()) return;
                        const newEpisode = {
                          id: Date.now().toString(),
                          title: episodeForm.title,
                          summary: episodeForm.summary,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        };
                        addEpisode(newEpisode as any);
                        setEpisodeForm({ title: '', summary: '' });
                        setShowNewEpisodeForm(false);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      추가
                    </button>
                    <button
                      onClick={() => setShowNewEpisodeForm(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentProject.episodes && currentProject.episodes.length === 0 && (
                  <div className="text-sm text-gray-600">회차가 없습니다. 새 회차를 추가해보세요.</div>
                )}
                {currentProject.episodes && currentProject.episodes.map((ep) => (
                  <div key={ep.id} className="bg-white p-3 rounded shadow-sm flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{ep.title}</div>
                      {ep.summary && <div className="text-sm text-gray-600">{ep.summary}</div>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteEpisode(ep.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1 rounded"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 프로젝트 목록 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📁 내 프로젝트
          </h2>
          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-600 text-lg">
                아직 프로젝트가 없습니다.
              </p>
              <p className="text-gray-500">
                새 프로젝트를 만들어서 시작해보세요!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer ${
                    currentProject?.id === project.id
                      ? 'border-2 border-blue-500 bg-blue-50'
                      : 'border border-gray-200'
                  }`}
                  onClick={() => selectProject(project.id)}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="text-sm text-gray-500 mb-4">
                    <p>📝 캐릭터: {project.characters.length}</p>
                    <p>🎬 씬: {project.timeline.events.length}</p>
                    <p>
                      ⏰{' '}
                      {project.updatedAt.toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
