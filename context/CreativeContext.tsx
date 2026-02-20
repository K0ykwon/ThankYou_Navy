'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CreativeProject,
  Character,
  CharacterItem,
  SettingData,
  SceneEvent,
  Timeline,
  UserSettings,
  TodoItem,
  MindMapNode,
  ProjectElement,
  FolderElement,
  FileElement,
  FontFamily,
  FontSize,
  ThemeMode,
} from '@/types';
import { supabase } from '@/lib/db';

interface CreativeContextType {
  // 프로젝트 기본 관리
  currentProject: CreativeProject | null;
  projects: CreativeProject[];
  createProject: (title: string, description: string, genre?: string, author?: string) => void;
  updateProject: (id: string, updates: Partial<CreativeProject>) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string) => void;

  // 캐릭터 관리
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;

  // 씬/장면 관리
  addSceneEvent: (event: SceneEvent) => void;
  updateSceneEvent: (id: string, updates: Partial<SceneEvent>) => void;
  deleteSceneEvent: (id: string) => void;

  // 에피소드 관리
  addEpisode: (episode: import('@/types').Episode) => void;
  updateEpisode: (id: string, updates: Partial<import('@/types').Episode>) => void;
  deleteEpisode: (id: string) => void;

  // 폴더/파일 관리
  createFolder: (parentId: string | null, folderName: string) => void;
  createFile: (parentId: string | null, fileName: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  deleteFileOrFolder: (elementId: string, parentId: string | null) => void;
  renameElement: (elementId: string, newName: string, parentId: string | null) => void;

  // Todo 관리
  addTodo: (todo: TodoItem) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;

  // 마인드맵 관리
  addMindMapNode: (node: MindMapNode) => void;
  updateMindMapNode: (id: string, updates: Partial<MindMapNode>) => void;
  deleteMindMapNode: (id: string) => void;

  // 프로젝트 필드 범용 업데이트
  updateProjectField: (fieldName: string, value: any) => void;

  // sync setting_data.characters -> characters table and reload
  syncSettingDataToDB: (projectId: string, settingData?: SettingData | null) => Promise<void>;

  // 설정 관리
  userSettings: UserSettings | null;
  updateUserSettings: (updates: Partial<UserSettings>) => void;
  setFontSize: (size: FontSize) => void;
  setFontFamily: (family: FontFamily) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const CreativeContext = createContext<CreativeContextType | undefined>(
  undefined
);

export function CreativeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [currentProject, setCurrentProject] = useState<CreativeProject | null>(
    null
  );
  const hasRestoredProject = React.useRef(false);
  // 순차 호출 간 최신 상태를 동기적으로 추적 (React state는 비동기이므로 ref로 보완)
  const latestProjectRef = React.useRef<CreativeProject | null>(null);
  latestProjectRef.current = currentProject;
  const [userSettings, setUserSettingsState] = useState<UserSettings | null>(
    () => {
      const defaultSettings: UserSettings = {
        id: 'default',
        userId: 'user-1',
        fontSize: 'base',
        fontFamily: 'sans',
        themeMode: 'light',
        autoSave: true,
        autoSaveInterval: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // localStorage에서 저장된 설정을 로드합니다
      if (typeof window !== 'undefined') {
        const savedSettings = localStorage.getItem('creativeStudioSettings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            return {
              ...defaultSettings,
              ...parsed,
              createdAt: new Date(parsed.createdAt),
              updatedAt: new Date(parsed.updatedAt),
            };
          } catch (err) {
            console.error('Failed to parse settings from localStorage:', err);
          }
        }
      }
      return defaultSettings;
    }
  );

  // 설정이 변경될 때마다 localStorage에 저장합니다
  useEffect(() => {
    if (userSettings && typeof window !== 'undefined') {
      localStorage.setItem('creativeStudioSettings', JSON.stringify(userSettings));
    }
  }, [userSettings]);

  // ==================== 초기화: Supabase에서 프로젝트 로드 ====================
  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Supabase가 설정되어 있으면 DB에서 로드
        if (supabase) {
          const { data, error } = await supabase
            .from('projects')
            .select('*');

          if (error) {
            console.warn('⚠️ Supabase에서 프로젝트 로드 실패:', error.message);
            loadProjectsFromCache();
          } else if (data && data.length > 0) {
            // localStorage 캐시 로드 (DB에 컬럼이 없는 필드의 fallback용)
            const cachedRaw = typeof window !== 'undefined'
              ? localStorage.getItem('creativeStudioProjects') : null;
            const cachedList: any[] = cachedRaw ? (() => { try { return JSON.parse(cachedRaw); } catch { return []; } })() : [];
            const getCached = (id: string) => cachedList.find((c: any) => c.id === id) || null;

            const loadedProjects: CreativeProject[] = data.map((p: any) => {
              // DB 컬럼이 없으면 localStorage 캐시에서 보충 (world_setting, setting_data 등)
              const cached = getCached(p.id);
              const settingData = p.setting_data ?? cached?.settingData ?? null;
              const worldSetting = p.world_setting ?? cached?.worldSetting ?? undefined;
              const consistencyReport = p.consistency_report ?? cached?.consistencyReport ?? null;

              const charSource = settingData?.characters || [];
              const characters = charSource.map((c: any, idx: number) => ({
                id: c.id || (c.name || ('char-' + idx)) + '-' + idx,
                name: c.name || '',
                role: c.role || '',
                description: c.description || null,
                appearance: c.appearance || (Array.isArray(c.traits) ? c.traits.join(', ') : (c.traits || '').toString()),
                personality: c.personality || '',
                backstory: c.backstory || '',
                createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
                updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
              }));

              return {
                id: p.id,
                title: p.title,
                description: p.description,
                genre: p.genre || undefined,
                author: p.author || undefined,
                fileTree: p.file_tree || [],
                characters,
                settingData,
                episodes: p.episodes || [],
                timeline: p.timeline || { id: p.id, projectId: p.id, events: [], totalDuration: 0 },
                todos: p.todos || [],
                mindMap: p.mindmap || [],
                worldSetting,
                consistencyReport,
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at),
              };
            });

            setProjects(loadedProjects);
            if (typeof window !== 'undefined') {
              localStorage.setItem('creativeStudioProjects', JSON.stringify(loadedProjects));
            }
            console.log('✅ Supabase에서 프로젝트 로드 완료:', loadedProjects.length, '개');
          }
        } else {
          // Supabase가 없으면 localStorage에서 로드
          loadProjectsFromCache();
        }
      } catch (err) {
        console.warn('프로젝트 로드 중 오류:', err);
        loadProjectsFromCache();
      }
    };

    const loadProjectsFromCache = () => {
      if (typeof window !== 'undefined') {
        const cachedProjects = localStorage.getItem('creativeStudioProjects');
        if (cachedProjects) {
          try {
            const parsed = JSON.parse(cachedProjects);
            setProjects(parsed);
            console.log('✅ localStorage에서 프로젝트 로드 완료:', parsed.length, '개');
          } catch (err) {
            console.error('localStorage 프로젝트 파싱 실패:', err);
          }
        }
      }
    };

    // 페이지 로드 시 한 번만 실행
    loadProjects();
  }, []);


  // ==================== 프로젝트 기본 관리 ====================
  const createProject = useCallback(
    async (title: string, description: string, genre?: string, author?: string) => {
      try {
        const id = Date.now().toString();
        const newProject: CreativeProject = {
          id,
          title,
          description,
          genre,
          author,
          fileTree: [],
          characters: [],
          settingData: null,
          episodes: [],
          timeline: {
            id,
            projectId: id,
            events: [],
            totalDuration: 0,
          },
          todos: [],
          mindMap: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Supabase에 저장 (Supabase가 설정된 경우만)
        if (supabase) {
          const { error } = await supabase
            .from('projects')
            .insert([
              {
                id,
                title,
                description,
                genre: genre || null,
                author: author || null,
                file_tree: newProject.fileTree,
                timeline: newProject.timeline,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);

          if (error) {
            console.warn('⚠️ Supabase 생성 실패 (로컬에만 저장됨):', error.message);
          } else {
            console.log('✅ Supabase에 프로젝트 저장 완료');
          }
        } else {
          console.warn('⚠️ Supabase가 설정되지 않음. 로컬에만 저장됩니다.');
        }

        // 로컬 상태 업데이트 및 캐시 저장
        setProjects((prev) => {
          const updated = [...prev, newProject];
          if (typeof window !== 'undefined') {
            localStorage.setItem('creativeStudioProjects', JSON.stringify(updated));
          }
          return updated;
        });
        setCurrentProject(newProject);
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedProjectId', newProject.id);
        }
      } catch (err) {
        console.warn('프로젝트 생성 오류 (로컬에만 저장됨):', err);
        // 에러 발생해도 로컬에는 저장
        const id = Date.now().toString();
        const newProject: CreativeProject = {
          id,
          title,
          description,
          genre,
          author,
          fileTree: [],
          characters: [],
          settingData: null,
          episodes: [],
          timeline: {
            id,
            projectId: id,
            events: [],
            totalDuration: 0,
          },
          todos: [],
          mindMap: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setProjects((prev) => {
          const updated = [...prev, newProject];
          if (typeof window !== 'undefined') {
            localStorage.setItem('creativeStudioProjects', JSON.stringify(updated));
          }
          return updated;
        });
        setCurrentProject(newProject);
      }
    },
    []
  );

  const updateProject = useCallback(
    async (id: string, updates: Partial<CreativeProject>) => {
      try {
        // Supabase에 업데이트 (Supabase가 설정된 경우만)
        if (supabase) {
          const updateData: any = {
            updated_at: new Date().toISOString(),
          };

          // 실제 DB 컬럼에 해당하는 필드만 추가
          if (updates.title !== undefined) updateData.title = updates.title;
          if (updates.description !== undefined) updateData.description = updates.description;
          if (updates.genre !== undefined) updateData.genre = updates.genre;
          if (updates.author !== undefined) updateData.author = updates.author;
          if (updates.fileTree !== undefined) updateData.file_tree = updates.fileTree;
          if (updates.timeline !== undefined) updateData.timeline = updates.timeline;
          if ((updates as any).settingData !== undefined) updateData.setting_data = (updates as any).settingData;
          if (updates.worldSetting !== undefined) updateData.world_setting = updates.worldSetting;
          if (updates.consistencyReport !== undefined) updateData.consistency_report = updates.consistencyReport;

          const { error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', id);

          if (error) {
            console.warn('⚠️ Supabase 업데이트 실패:', error.message);
          } else {
            console.log('✅ Supabase에서 프로젝트 업데이트 완료');
          }
        }

        // 로컬 상태 업데이트 및 캐시 저장
        setProjects((prevProjects) => {
          const updated = prevProjects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          );
          if (typeof window !== 'undefined') {
            localStorage.setItem('creativeStudioProjects', JSON.stringify(updated));
          }
          return updated;
        });
        setCurrentProject((prev) => {
          if (prev?.id === id) {
            return { ...prev, ...updates, updatedAt: new Date() };
          }
          return prev;
        });
      } catch (err) {
        console.warn('프로젝트 업데이트 오류:', err);
        // 에러 발생해도 로컬에는 업데이트
        setProjects((prevProjects) => {
          const updated = prevProjects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          );
          if (typeof window !== 'undefined') {
            localStorage.setItem('creativeStudioProjects', JSON.stringify(updated));
          }
          return updated;
        });
        setCurrentProject((prev) => {
          if (prev?.id === id) {
            return { ...prev, ...updates, updatedAt: new Date() };
          }
          return prev;
        });
      }
    },
    []
  );

  const deleteProject = useCallback(async (id: string) => {
    try {
      // Supabase에서 삭제 (Supabase가 설정된 경우만)
      if (supabase) {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('⚠️ Supabase 삭제 실패 (로컬에만 반영됨):', error.message);
        } else {
          console.log('✅ Supabase에서 프로젝트 삭제 완료');
        }
      }

      // 로컬 상태 업데이트 및 캐시 저장
      setProjects((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('creativeStudioProjects', JSON.stringify(updated));
        }
        return updated;
      });
      setCurrentProject((prev) => (prev?.id === id ? null : prev));
      if (typeof window !== 'undefined' && localStorage.getItem('selectedProjectId') === id) {
        localStorage.removeItem('selectedProjectId');
      }
    } catch (err) {
      console.warn('프로젝트 삭제 오류:', err);
      // 에러 발생해도 로컬에서는 삭제
      setProjects((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('creativeStudioProjects', JSON.stringify(updated));
        }
        return updated;
      });
      setCurrentProject((prev) => (prev?.id === id ? null : prev));
    }
  }, []);

  const selectProject = useCallback(async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedProjectId', id);
    }
    setCurrentProject(project);

    // DB에서 scene_events와 episodes를 실제로 로드
    if (supabase) {
      try {
        // scene_events 로드
        const { data: events, error: evError } = await supabase
          .from('scene_events')
          .select('*')
          .eq('project_id', id)
          .order('timestamp', { ascending: true });

        if (!evError && events && events.length > 0) {
          const sceneEvents: SceneEvent[] = events.map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description || '',
            timestamp: e.timestamp || 0,
            characterIds: e.character_ids || [],
            createdAt: new Date(e.created_at),
            updatedAt: new Date(e.updated_at),
          }));
          setCurrentProject((prev) => {
            if (!prev || prev.id !== id) return prev;
            return {
              ...prev,
              timeline: { ...prev.timeline, events: sceneEvents },
            };
          });
        }

        // episodes 로드
        const { data: eps, error: epError } = await supabase
          .from('episodes')
          .select('*')
          .eq('project_id', id)
          .order('chapter_number', { ascending: true });

        if (!epError && eps && eps.length > 0) {
          const episodes: import('@/types').Episode[] = eps.map((e: any) => ({
            id: e.id,
            title: e.title,
            content: e.content || undefined,
            summary: e.summary || undefined,
            chapterNumber: e.chapter_number || undefined,
            scenes: e.scenes || [],
            createdAt: new Date(e.created_at),
            updatedAt: new Date(e.updated_at),
          }));
          setCurrentProject((prev) => {
            if (!prev || prev.id !== id) return prev;
            return { ...prev, episodes };
          });
        }
      } catch (err) {
        console.warn('DB에서 프로젝트 데이터 로드 실패:', err);
      }
    }
  }, [projects]);

  // 프로젝트 목록 로드 후 마지막 선택 프로젝트 자동 복원
  useEffect(() => {
    if (projects.length > 0 && !currentProject && !hasRestoredProject.current) {
      hasRestoredProject.current = true;
      if (typeof window !== 'undefined') {
        const savedId = localStorage.getItem('selectedProjectId');
        if (savedId && projects.find((p) => p.id === savedId)) {
          selectProject(savedId);
        }
      }
    }
  }, [projects, selectProject, currentProject]);

  // ==================== 캐릭터 관리 ====================
  // latestProjectRef를 사용해 연속 호출 시 race condition 방지
  // (React state는 비동기이므로 ref로 최신 상태를 동기적으로 추적)

  const applyCharacterUpdate = (updated: CreativeProject) => {
    latestProjectRef.current = updated; // 동기 업데이트 → 다음 호출이 즉시 최신 상태를 읽음
    setCurrentProject(updated);
    setProjects((prev) => {
      const newList = prev.map((p) => (p.id === updated.id ? updated : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem('creativeStudioProjects', JSON.stringify(newList));
      }
      return newList;
    });
  };

  const writeSettingDataToDB = async (projectId: string, settingData: SettingData) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('projects')
      .update({ setting_data: settingData, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    if (error) console.warn('캐릭터 DB 저장 실패:', error.message);
  };

  const addCharacter = useCallback(async (character: Character) => {
    const proj = latestProjectRef.current;
    if (!proj) return;

    const charItem = {
      id: character.id,
      name: character.name,
      aliases: [],
      description: character.description || null,
      traits: character.appearance ? character.appearance.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : [],
      relationships: {},
      role: character.role || null,
      appearance: character.appearance || '',
      personality: character.personality || '',
      backstory: character.backstory || '',
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    };
    const newSetting: SettingData = {
      characters: [...(proj.settingData?.characters || []), charItem],
      relations: proj.settingData?.relations || [],
      name_mapping: { ...(proj.settingData?.name_mapping || {}), [character.name]: [] },
      world: proj.settingData?.world || [],
      plot_threads: proj.settingData?.plot_threads || [],
    };
    const updated: CreativeProject = {
      ...proj,
      characters: [...proj.characters, character],
      settingData: newSetting,
      updatedAt: new Date(),
    };
    applyCharacterUpdate(updated);
    await writeSettingDataToDB(proj.id, newSetting);
  }, []); // 빈 deps — latestProjectRef로 최신 상태 접근

  const updateCharacter = useCallback(async (id: string, updates: Partial<Character>) => {
    const proj = latestProjectRef.current;
    if (!proj) return;

    const updatedLocalChars = proj.characters.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
    );
    const updatedChar = updatedLocalChars.find((c) => c.id === id);
    const settingChars = (proj.settingData?.characters || []).map((sc: any) => {
      const isMatch = sc.id === id || (updatedChar && sc.name === updatedChar.name);
      if (!isMatch) return sc;
      return {
        ...sc,
        name: updates.name ?? sc.name,
        description: updates.description ?? sc.description,
        role: (updates.role ?? sc.role) ?? null,
        traits: updates.appearance ? String(updates.appearance).split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : sc.traits || [],
        appearance: updates.appearance ?? sc.appearance ?? '',
        personality: updates.personality ?? sc.personality ?? '',
        backstory: updates.backstory ?? sc.backstory ?? '',
        updatedAt: new Date(),
      };
    });
    const newSetting: SettingData = {
      characters: settingChars,
      relations: proj.settingData?.relations || [],
      name_mapping: proj.settingData?.name_mapping || {},
      world: proj.settingData?.world || [],
      plot_threads: proj.settingData?.plot_threads || [],
    };
    const updated: CreativeProject = {
      ...proj,
      characters: updatedLocalChars,
      settingData: newSetting,
      updatedAt: new Date(),
    };
    applyCharacterUpdate(updated);
    await writeSettingDataToDB(proj.id, newSetting);
  }, []);

  const deleteCharacter = useCallback(async (id: string) => {
    const proj = latestProjectRef.current;
    if (!proj) return;

    const deletedChar = proj.characters.find((c) => c.id === id);
    const filteredLocal = proj.characters.filter((c) => c.id !== id);
    const filteredSetting = (proj.settingData?.characters || []).filter((sc: any) =>
      sc.id !== id && (!deletedChar || sc.name !== deletedChar.name)
    );
    const newSetting: SettingData = {
      characters: filteredSetting,
      relations: proj.settingData?.relations || [],
      name_mapping: proj.settingData?.name_mapping || {},
      world: proj.settingData?.world || [],
      plot_threads: proj.settingData?.plot_threads || [],
    };
    const updated: CreativeProject = {
      ...proj,
      characters: filteredLocal,
      settingData: newSetting,
      updatedAt: new Date(),
    };
    applyCharacterUpdate(updated);
    await writeSettingDataToDB(proj.id, newSetting);
  }, []);

  // ==================== 씬/장면 관리 ====================
  const addSceneEvent = useCallback(async (event: SceneEvent) => {
    try {
      if (!currentProject) return;

      // Supabase에 저장 (Supabase가 설정된 경우만)
      if (supabase) {
        const { error } = await supabase
          .from('scene_events')
          .insert([
            {
              id: event.id,
              project_id: currentProject.id,
              title: event.title,
              description: event.description,
              timestamp: event.timestamp,
              character_ids: event.characterIds,
              created_at: event.createdAt.toISOString(),
              updated_at: event.updatedAt.toISOString(),
            },
          ]);

        if (error) {
          console.warn('⚠️  Supabase 저장 실패 (로컬에만 저장됨):', error.message);
        }
      }

      // 로컬 상태 업데이트 (Supabase 성공 여부와 관계없이)
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timeline: {
            ...prev.timeline,
            events: [...prev.timeline.events, event],
          },
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.warn('로컬에만 저장됩니다:', err);
      // 로컬 상태는 여전히 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timeline: {
            ...prev.timeline,
            events: [...prev.timeline.events, event],
          },
          updatedAt: new Date(),
        };
      });
    }
  }, [currentProject]);

  const updateSceneEvent = useCallback(async (id: string, updates: Partial<SceneEvent>) => {
    try {
      // Supabase에 업데이트 (Supabase가 설정된 경우만)
      if (supabase) {
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        // 실제 DB 컬럼에 해당하는 필드만 추가
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.timestamp !== undefined) updateData.timestamp = updates.timestamp;
        if (updates.characterIds !== undefined) updateData.character_ids = updates.characterIds;

        const { error } = await supabase
          .from('scene_events')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.warn('⚠️  Supabase 업데이트 실패 (로컬에만 저장됨):', error.message);
        }
      }

      // 로컬 상태 업데이트 (Supabase 성공 여부와 관계없이)
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timeline: {
            ...prev.timeline,
            events: prev.timeline.events.map((e) =>
              e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
            ),
          },
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.warn('로컬에만 저장됩니다:', err);
      // 로컬 상태는 여전히 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timeline: {
            ...prev.timeline,
            events: prev.timeline.events.map((e) =>
              e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
            ),
          },
          updatedAt: new Date(),
        };
      });
    }
  }, []);

  const deleteSceneEvent = useCallback(async (id: string) => {
    try {
      // Supabase에서 삭제 (Supabase가 설정된 경우만)
      if (supabase) {
        const { error } = await supabase
          .from('scene_events')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('⚠️  Supabase 삭제 실패 (로컬에만 반영됨):', error.message);
        }
      }

      // 로컬 상태 업데이트 (Supabase 성공 여부와 관계없이)
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timeline: {
            ...prev.timeline,
            events: prev.timeline.events.filter((e) => e.id !== id),
          },
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.warn('로컬에만 반영됩니다:', err);
      // 로컬 상태는 여전히 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timeline: {
            ...prev.timeline,
            events: prev.timeline.events.filter((e) => e.id !== id),
          },
          updatedAt: new Date(),
        };
      });
    }
  }, []);

  // ==================== 에피소드 관리 ====================
  const addEpisode = useCallback(async (episode: import('@/types').Episode) => {
    try {
      if (!currentProject) return;

      // Supabase에 저장
      const insertData: any = {
        id: episode.id,
        project_id: currentProject.id,
        title: episode.title,
        content: episode.content || null,
        summary: episode.summary || null,
        chapter_number: episode.chapterNumber || null,
        scenes: episode.scenes || [],
        created_at: episode.createdAt.toISOString(),
        updated_at: episode.updatedAt.toISOString(),
      };
      let { error } = await supabase.from('episodes').insert([insertData]);
      // content 컬럼이 없으면 content 제외 후 재시도
      if (error && error.message?.includes('content')) {
        const { content: _c, ...withoutContent } = insertData;
        ({ error } = await supabase.from('episodes').insert([withoutContent]));
      }
      if (error) {
        console.error('Failed to add episode:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          episodes: [...prev.episodes, episode],
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.error('Error adding episode:', err);
    }
  }, [currentProject]);

  const updateEpisode = useCallback(async (id: string, updates: Partial<import('@/types').Episode>) => {
    try {
      // Supabase에 업데이트 (snake_case 컬럼 매핑)
      const updateData: any = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.summary !== undefined) updateData.summary = updates.summary;
      if (updates.chapterNumber !== undefined) updateData.chapter_number = updates.chapterNumber;
      if (updates.scenes !== undefined) updateData.scenes = updates.scenes;

      let { error } = await supabase.from('episodes').update(updateData).eq('id', id);
      // content 컬럼이 없으면 content 제외 후 재시도
      if (error && error.message?.includes('content')) {
        const { content: _c, ...withoutContent } = updateData;
        ({ error } = await supabase.from('episodes').update(withoutContent).eq('id', id));
      }
      if (error) {
        console.error('Failed to update episode:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          episodes: prev.episodes.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
          ),
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.error('Error updating episode:', err);
    }
  }, []);

  const deleteEpisode = useCallback(async (id: string) => {
    try {
      // Supabase에서 삭제
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete episode:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          episodes: prev.episodes.filter((e) => e.id !== id),
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.error('Error deleting episode:', err);
    }
  }, []);

  // ==================== 폴더/파일 관리 ====================
  const createFolder = useCallback((parentId: string | null, folderName: string) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;

      const newFolder: FolderElement = {
        id: Date.now().toString(),
        type: 'folder',
        name: folderName,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let updatedFileTree = [...prev.fileTree];
      if (parentId === null) {
        updatedFileTree.push(newFolder);
      } else {
        const addFolderToTree = (tree: ProjectElement[]): boolean => {
          for (let item of tree) {
            if (item.id === parentId && item.type === 'folder') {
              (item as FolderElement).children.push(newFolder);
              return true;
            }
            if (item.type === 'folder' && addFolderToTree((item as FolderElement).children)) {
              return true;
            }
          }
          return false;
        };
        addFolderToTree(updatedFileTree);
      }

      return { ...prev, fileTree: updatedFileTree, updatedAt: new Date() };
    });
  }, []);

  const createFile = useCallback((parentId: string | null, fileName: string) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;

      const newFile: FileElement = {
        id: Date.now().toString(),
        type: 'file',
        name: fileName,
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let updatedFileTree = [...prev.fileTree];
      if (parentId === null) {
        updatedFileTree.push(newFile);
      } else {
        const addFileToTree = (tree: ProjectElement[]): boolean => {
          for (let item of tree) {
            if (item.id === parentId && item.type === 'folder') {
              (item as FolderElement).children.push(newFile);
              return true;
            }
            if (item.type === 'folder' && addFileToTree((item as FolderElement).children)) {
              return true;
            }
          }
          return false;
        };
        addFileToTree(updatedFileTree);
      }

      return { ...prev, fileTree: updatedFileTree, updatedAt: new Date() };
    });
  }, []);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;

      const updateContentInTree = (tree: ProjectElement[]): boolean => {
        for (let item of tree) {
          if (item.id === fileId && item.type === 'file') {
            (item as FileElement).content = content;
            (item as FileElement).updatedAt = new Date();
            return true;
          }
          if (item.type === 'folder' && updateContentInTree((item as FolderElement).children)) {
            return true;
          }
        }
        return false;
      };

      let updatedFileTree = [...prev.fileTree];
      updateContentInTree(updatedFileTree);
      return { ...prev, fileTree: updatedFileTree, updatedAt: new Date() };
    });
  }, []);

  const deleteFileOrFolder = useCallback((elementId: string, parentId: string | null) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;

      let updatedFileTree = [...prev.fileTree];
      if (parentId === null) {
        updatedFileTree = updatedFileTree.filter((item) => item.id !== elementId);
      } else {
        const deleteFromTree = (tree: ProjectElement[]): boolean => {
          for (let item of tree) {
            if (item.id === parentId && item.type === 'folder') {
              (item as FolderElement).children = (item as FolderElement).children.filter(
                (child) => child.id !== elementId
              );
              return true;
            }
            if (item.type === 'folder' && deleteFromTree((item as FolderElement).children)) {
              return true;
            }
          }
          return false;
        };
        deleteFromTree(updatedFileTree);
      }

      return { ...prev, fileTree: updatedFileTree, updatedAt: new Date() };
    });
  }, []);

  const renameElement = useCallback((elementId: string, newName: string, parentId: string | null) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;

      const renameInTree = (tree: ProjectElement[]): boolean => {
        for (let item of tree) {
          if (item.id === elementId) {
            item.name = newName;
            item.updatedAt = new Date();
            return true;
          }
          if (item.type === 'folder' && renameInTree((item as FolderElement).children)) {
            return true;
          }
        }
        return false;
      };

      let updatedFileTree = [...prev.fileTree];
      renameInTree(updatedFileTree);
      return { ...prev, fileTree: updatedFileTree, updatedAt: new Date() };
    });
  }, []);

  // ==================== Todo 관리 ====================
  const addTodo = useCallback(async (todo: TodoItem) => {
    try {
      if (!currentProject) return;

      // Supabase에 저장
      const { error } = await supabase
        .from('todos')
        .insert([
          {
            id: todo.id,
            project_id: currentProject.id,
            title: todo.title,
            description: todo.description || null,
            completed: todo.completed,
            priority: todo.priority || 'medium',
            due_date: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
            created_at: todo.createdAt.toISOString(),
            updated_at: todo.updatedAt.toISOString(),
          },
        ]);

      if (error) {
        console.error('Failed to add todo:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          todos: [...(prev.todos || []), todo],
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  }, [currentProject]);

  const updateTodo = useCallback(async (id: string, updates: Partial<TodoItem>) => {
    try {
      // Supabase에 업데이트
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Failed to update todo:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          todos: (prev.todos || []).map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    try {
      // Supabase에서 삭제
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete todo:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          todos: (prev.todos || []).filter((t) => t.id !== id),
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  }, []);

  // ==================== 마인드맵 관리 ====================
  const addMindMapNode = useCallback(async (node: MindMapNode) => {
    try {
      if (!currentProject) return;

      // Supabase에 저장
      const { error } = await supabase
        .from('mindmap_nodes')
        .insert([
          {
            id: node.id,
            project_id: currentProject.id,
            title: node.title,
            description: node.description || null,
            children: node.children || [],
            created_at: node.createdAt.toISOString(),
            updated_at: node.updatedAt.toISOString(),
          },
        ]);

      if (error) {
        console.error('Failed to add mindmap node:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          mindMap: [...(prev.mindMap || []), node],
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.error('Error adding mindmap node:', err);
    }
  }, [currentProject]);

  const updateMindMapNode = useCallback(async (id: string, updates: Partial<MindMapNode>) => {
    try {
      // Supabase에 업데이트
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('mindmap_nodes')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Failed to update mindmap node:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;

        const updateNodeInTree = (nodes: MindMapNode[]): boolean => {
          for (let node of nodes) {
            if (node.id === id) {
              Object.assign(node, updates);
              node.updatedAt = new Date();
              return true;
            }
            if (node.children && updateNodeInTree(node.children)) {
              return true;
            }
          }
          return false;
        };

        let updatedMindMap = JSON.parse(JSON.stringify(prev.mindMap || []));
        updateNodeInTree(updatedMindMap);
        return { ...prev, mindMap: updatedMindMap, updatedAt: new Date() };
      });
    } catch (err) {
      console.error('Error updating mindmap node:', err);
    }
  }, []);

  const deleteMindMapNode = useCallback(async (id: string) => {
    try {
      // Supabase에서 삭제
      const { error } = await supabase
        .from('mindmap_nodes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete mindmap node:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;

        const deleteNodeFromTree = (nodes: MindMapNode[]): MindMapNode[] => {
          return nodes
            .filter((node) => node.id !== id)
            .map((node) => ({
              ...node,
              children: node.children ? deleteNodeFromTree(node.children) : undefined,
            }));
        };

        const updatedMindMap = deleteNodeFromTree(prev.mindMap || []);
        return { ...prev, mindMap: updatedMindMap, updatedAt: new Date() };
      });
    } catch (err) {
      console.error('Error deleting mindmap node:', err);
    }
  }, []);

  // ==================== 설정 관리 ====================
  const syncSettingDataToDB = useCallback(async (projectId: string, settingData?: SettingData | null) => {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase가 설정되지 않음');
        return;
      }

      const dataToSync = settingData || currentProject?.settingData;
      if (!dataToSync) {
        console.warn('⚠️ 동기화할 settingData가 없습니다');
        return;
      }

      const { error } = await supabase
        .from('projects')
        .update({ setting_data: dataToSync, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) {
        console.error('Failed to sync setting_data to DB:', error.message);
      } else {
        console.log('✅ settingData synced to DB');
      }
    } catch (err) {
      console.error('Error syncing setting_data:', err);
    }
  }, [currentProject]);

  const updateUserSettings = useCallback((updates: Partial<UserSettings>) => {
    setUserSettingsState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        updatedAt: new Date(),
      };
    });
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    updateUserSettings({ fontSize: size });
  }, [updateUserSettings]);

  const setFontFamily = useCallback((family: FontFamily) => {
    updateUserSettings({ fontFamily: family });
  }, [updateUserSettings]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    updateUserSettings({ themeMode: mode });
  }, [updateUserSettings]);

  // ==================== 프로젝트 필드 범용 업데이트 ====================
  const updateProjectField = useCallback((fieldName: string, value: any) => {
    if (!currentProject) return;

    try {
      // Supabase 업데이트
      if (supabase) {
        supabase
          .from('projects')
          .update({ [fieldName]: value, updated_at: new Date() })
          .eq('id', currentProject.id)
          .then((result) => {
            if (result.error) {
              console.error(`Failed to update ${fieldName}:`, result.error.message);
            }
          });
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [fieldName]: value,
          updatedAt: new Date(),
        };
      });

      // localStorage 업데이트
      const updatedProject = {
        ...currentProject,
        [fieldName]: value,
        updatedAt: new Date(),
      };
      localStorage.setItem(`project_${currentProject.id}`, JSON.stringify(updatedProject));
    } catch (err) {
      console.error(`Error updating ${fieldName}:`, err);
    }
  }, [currentProject]);

  const value: CreativeContextType = {
    currentProject,
    projects,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addSceneEvent,
    updateSceneEvent,
    deleteSceneEvent,
    addEpisode,
    updateEpisode,
    deleteEpisode,
    createFolder,
    createFile,
    updateFileContent,
    deleteFileOrFolder,
    renameElement,
    addTodo,
    updateTodo,
    deleteTodo,
    addMindMapNode,
    updateMindMapNode,
    deleteMindMapNode,
    updateProjectField,
    syncSettingDataToDB,
    userSettings,
    updateUserSettings,
    setFontSize,
    setFontFamily,
    setThemeMode,
  };

  return (
    <CreativeContext.Provider value={value}>
      {children}
    </CreativeContext.Provider>
  );
}

export function useCreative() {
  const context = useContext(CreativeContext);
  if (context === undefined) {
    throw new Error('useCreative must be used within a CreativeProvider');
  }
  return context;
}
