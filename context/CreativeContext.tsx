'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CreativeProject,
  Character,
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

        // Supabase에 저장 (기본 정보만)
        const { data, error } = await supabase
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
          ])
          .select()
          .single();

        if (error) {
          console.error('Failed to create project:', error.message);
          // 로컬에만 저장 (오프라인 모드)
          setProjects((prev) => [...prev, newProject]);
          setCurrentProject(newProject);
          return;
        }

        // 로컬 상태 업데이트
        setProjects((prev) => [...prev, newProject]);
        setCurrentProject(newProject);
      } catch (err) {
        console.error('Error creating project:', err);
      }
    },
    []
  );

  const updateProject = useCallback(
    async (id: string, updates: Partial<CreativeProject>) => {
      try {
        // Supabase에 업데이트 (실제 DB 컬럼만)
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

        const { error } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('Failed to update project:', error.message);
        }

        // 로컬 상태 업데이트
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          )
        );
        setCurrentProject((prev) => {
          if (prev?.id === id) {
            return { ...prev, ...updates, updatedAt: new Date() };
          }
          return prev;
        });
      } catch (err) {
        console.error('Error updating project:', err);
      }
    },
    []
  );

  const deleteProject = useCallback(async (id: string) => {
    try {
      // Supabase에서 삭제
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete project:', error.message);
      }

      // 로컬 상태 업데이트
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setCurrentProject((prev) => (prev?.id === id ? null : prev));
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  }, []);

  const selectProject = useCallback((id: string) => {
    setCurrentProject((prev) => {
      const project = projects.find((p) => p.id === id);
      return project || prev;
    });
  }, [projects]);

  // ==================== 캐릭터 관리 ====================
  const addCharacter = useCallback(
    async (character: Character) => {
      try {
        if (!currentProject) return;

        // Supabase에 저장
        const { error } = await supabase
          .from('characters')
          .insert([
            {
              id: character.id,
              project_id: currentProject.id,
              name: character.name,
              age: character.age || null,
              role: character.role,
              description: character.description,
              appearance: character.appearance,
              personality: character.personality,
              backstory: character.backstory,
              goals: character.goals || null,
              image_url: character.imageUrl || null,
              created_at: character.createdAt.toISOString(),
              updated_at: character.updatedAt.toISOString(),
            },
          ]);

        if (error) {
          console.error('Failed to add character:', error.message);
        }

        // 로컬 상태 업데이트
        setCurrentProject((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            characters: [...prev.characters, character],
            updatedAt: new Date(),
          };
        });
      } catch (err) {
        console.error('Error adding character:', err);
      }
    },
    [currentProject]
  );

  const updateCharacter = useCallback(async (id: string, updates: Partial<Character>) => {
    try {
      // Supabase에 업데이트
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('characters')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Failed to update character:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.error('Error updating character:', err);
    }
  }, []);

  const deleteCharacter = useCallback(async (id: string) => {
    try {
      // Supabase에서 삭제
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete character:', error.message);
      }

      // 로컬 상태 업데이트
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          characters: prev.characters.filter((c) => c.id !== id),
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      console.error('Error deleting character:', err);
    }
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
      const { error } = await supabase
        .from('episodes')
        .insert([
          {
            id: episode.id,
            project_id: currentProject.id,
            title: episode.title,
            summary: episode.summary || null,
            chapter_number: episode.chapterNumber || null,
            scenes: episode.scenes || [],
            created_at: episode.createdAt.toISOString(),
            updated_at: episode.updatedAt.toISOString(),
          },
        ]);

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
      // Supabase에 업데이트
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('episodes')
        .update(updateData)
        .eq('id', id);

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
