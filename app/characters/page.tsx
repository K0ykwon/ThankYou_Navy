'use client';

import { useCreative } from '@/context/CreativeContext';
import { Character, CharacterItem } from '@/types';
import { useState } from 'react';
import Link from 'next/link';

export default function CharactersPage() {
  const {
    currentProject,
    addCharacter,
    updateCharacter,
    deleteCharacter,
  } = useCreative();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Character, 'id'>>({
    name: '',
    role: '',
    description: '',
    appearance: '',
    personality: '',
    backstory: '',
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

    if (!formData.name.trim()) {
      alert('이름을 입력해주세요');
      return;
    }

    if (editingId) {
      updateCharacter(editingId, formData);
      setEditingId(null);
    } else {
      const newCharacter: Character = {
        id: Date.now().toString(),
        ...formData,
      };
      addCharacter(newCharacter);
    }

    setFormData({
      name: '',
      role: '',
      description: '',
      appearance: '',
      personality: '',
      backstory: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setShowForm(false);
  };

  const handleEdit = (character: Character) => {
    setFormData({
      name: character.name,
      role: character.role,
      description: character.description,
      appearance: character.appearance,
      personality: character.personality,
      backstory: character.backstory,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    });
    setEditingId(character.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      role: '',
      description: '',
      appearance: '',
      personality: '',
      backstory: '',
      createdAt: new Date(),
      updatedAt: new Date(),
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

  const displayChars = currentProject.settingData?.characters
    ? currentProject.settingData.characters.map((c: CharacterItem, idx: number) => ({
        id: `${c.name}-${idx}`,
        name: c.name,
        role: c.role || '',
        description: c.description || '',
        appearance: (c.traits || []).join(', '),
        personality: '',
        backstory: '',
      }))
    : currentProject.characters;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              👥 캐릭터 관리
            </h1>
            <p className="text-gray-600">{currentProject.title}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            + 새 캐릭터 추가
          </button>
        </div>

        {/* 폼 */}
        {showForm && (
          <div className="bg-white p-8 rounded-lg shadow-md mb-8 border-l-4 border-blue-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? '캐릭터 수정' : '새 캐릭터 생성'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 이름 */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-bold mb-2">
                    이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="캐릭터의 이름"
                  />
                </div>

                {/* 역할 */}
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    역할
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="예: 주인공, 조력자, 악役"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    짧은 설명
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="캐릭터를 한 줄로 설명"
                  />
                </div>

                {/* 외모 */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-bold mb-2">
                    외모/특징
                  </label>
                  <textarea
                    value={formData.appearance}
                    onChange={(e) =>
                      setFormData({ ...formData, appearance: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="키, 피부색, 특이한 특징 등..."
                    rows={3}
                  />
                </div>

                {/* 성격 */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-bold mb-2">
                    성격/특성
                  </label>
                  <textarea
                    value={formData.personality}
                    onChange={(e) =>
                      setFormData({ ...formData, personality: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="성격, 습관, 취미, 성향 등..."
                    rows={3}
                  />
                </div>

                {/* 배경 스토리 */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-bold mb-2">
                    배경 스토리
                  </label>
                  <textarea
                    value={formData.backstory}
                    onChange={(e) =>
                      setFormData({ ...formData, backstory: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="과거, 동기, 갈등 등..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
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

        {/* 캐릭터 목록 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
              캐릭터 ({displayChars.length})
            </h2>

          {displayChars.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-600 text-lg">아직 캐릭터가 없습니다.</p>
              <p className="text-gray-500">캐릭터를 추가해서 시작해보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayChars.map((character) => (
                <div
                  key={character.id}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {character.name}
                      </h3>
                      {character.role && (
                        <p className="text-green-600 font-semibold">
                          {character.role}
                        </p>
                      )}
                      {character.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {character.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {character.appearance && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-sm font-bold text-gray-700 mb-1">
                        외모
                      </p>
                      <p className="text-gray-600 text-sm">
                        {character.appearance}
                      </p>
                    </div>
                  )}

                  {character.personality && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-sm font-bold text-gray-700 mb-1">
                        성격
                      </p>
                      <p className="text-gray-600 text-sm">
                        {character.personality}
                      </p>
                    </div>
                  )}

                  {character.backstory && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-sm font-bold text-gray-700 mb-1">
                        배경
                      </p>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {character.backstory}
                      </p>
                    </div>
                  )}

                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => handleEdit(character as Character)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm('캐릭터를 삭제하시겠습니까?')) return;
                          deleteCharacter(character.id);
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
