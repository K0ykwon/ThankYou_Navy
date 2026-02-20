'use client';

import { useCreative } from '@/context/CreativeContext';
import { Character, CharacterItem } from '@/types';
import { useState } from 'react';
import Link from 'next/link';
import { extractSetting } from '@/lib/somniApi';

export default function CharactersPage() {
  const {
    currentProject,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    updateProject,
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

  // 캐릭터 추출
  const [extracting, setExtracting] = useState(false);
  const [extractEpisodeId, setExtractEpisodeId] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!currentProject) return;
    const episodes = currentProject.episodes || [];
    const rawText = extractEpisodeId
      ? (episodes.find(e => e.id === extractEpisodeId)?.content || '')
      : (currentProject.worldSetting || '');
    if (!rawText.trim()) {
      alert('선택한 내용이 비어있습니다. 텍스트 에디터에서 먼저 내용을 작성해주세요.');
      return;
    }
    setExtracting(true);
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
      const res = await extractSetting(rawText, existing_settings);
      const setting = res?.setting_data;
      if (!setting) {
        alert('추출된 설정 데이터가 없습니다.');
      } else {
        await updateProject(currentProject.id, { settingData: setting });
        alert(`캐릭터 추출 완료 — ${setting.characters?.length ?? 0}명 추출됨.`);
      }
    } catch (e: any) {
      alert('추출 실패: ' + (e.message || e));
    } finally {
      setExtracting(false);
    }
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

  // Merge: full Character objects take priority; CharacterItem stubs fill in extras from settingData
  const displayChars: Character[] = (() => {
    const full = currentProject.characters;
    const setting = currentProject.settingData?.characters || [];
    const seen = new Set(full.map(c => c.name));
    const extras: Character[] = setting
      .filter((sc: CharacterItem) => !seen.has(sc.name))
      .map((sc: CharacterItem, idx: number) => ({
        id: `${sc.name}-${idx}`,
        name: sc.name,
        role: sc.role || '',
        description: sc.description || '',
        appearance: (sc.traits || []).join(', '),
        personality: '',
        backstory: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    return [...full, ...extras];
  })();

  const inputClass = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';
  const labelClass = 'block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm';

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              캐릭터 관리
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{currentProject.title}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 회차 선택 드롭다운 */}
            {(currentProject.episodes || []).length > 0 && (
              <select
                value={extractEpisodeId || ''}
                onChange={(e) => setExtractEpisodeId(e.target.value || null)}
                className="text-sm px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">세계관 전체</option>
                {currentProject.episodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.chapterNumber ? `${ep.chapterNumber}화` : ''} {ep.title}
                  </option>
                ))}
              </select>
            )}
            {/* 캐릭터 추출 버튼 */}
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-sm disabled:opacity-60"
            >
              {extracting ? '추출 중...' : '✨ 캐릭터 자동 추출'}
            </button>
            {/* 수동 추가 버튼 */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-sm"
            >
              + 새 캐릭터 추가
            </button>
          </div>
        </div>

        {/* 추출 안내 메시지 */}
        {!currentProject.worldSetting && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              💡 자동 추출을 사용하려면 먼저 <strong>텍스트 에디터</strong>에 내용을 입력하고 저장하세요.
            </p>
          </div>
        )}

        {/* 폼 */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-8 border-l-4 border-blue-600">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingId ? '캐릭터 수정' : '새 캐릭터 생성'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={labelClass}>이름 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass}
                    placeholder="캐릭터의 이름"
                  />
                </div>

                <div>
                  <label className={labelClass}>역할</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={inputClass}
                    placeholder="예: 주인공, 조력자, 악역"
                  />
                </div>

                <div>
                  <label className={labelClass}>짧은 설명</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={inputClass}
                    placeholder="캐릭터를 한 줄로 설명"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>외모/특징</label>
                  <textarea
                    value={formData.appearance}
                    onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                    className={inputClass}
                    placeholder="키, 피부색, 특이한 특징 등..."
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>성격/특성</label>
                  <textarea
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    className={inputClass}
                    placeholder="성격, 습관, 취미, 성향 등..."
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>배경 스토리</label>
                  <textarea
                    value={formData.backstory}
                    onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                    className={inputClass}
                    placeholder="과거, 동기, 갈등 등..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
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

        {/* 캐릭터 목록 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
            캐릭터 ({displayChars.length})
          </h2>

          {displayChars.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-gray-600 dark:text-gray-400 text-lg">아직 캐릭터가 없습니다.</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                직접 추가하거나 <strong>캐릭터 자동 추출</strong>을 사용해보세요!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayChars.map((character) => (
                <div
                  key={character.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {character.name}
                      </h3>
                      {character.role && (
                        <p className="text-green-600 dark:text-green-400 font-semibold text-sm mt-0.5">
                          {character.role}
                        </p>
                      )}
                      {character.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {character.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {character.appearance && (
                    <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">외모</p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{character.appearance}</p>
                    </div>
                  )}

                  {character.personality && (
                    <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">성격</p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{character.personality}</p>
                    </div>
                  )}

                  {character.backstory && (
                    <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">배경</p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">{character.backstory}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(character as Character)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm('캐릭터를 삭제하시겠습니까?')) return;
                        deleteCharacter(character.id);
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
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
