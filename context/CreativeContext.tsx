'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
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
      return defaultSettings;
    }
  );

  // ==================== 프로젝트 기본 관리 ====================
  const createProject = useCallback(
    (title: string, description: string, genre?: string, author?: string) => {
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
      setProjects((prev) => [...prev, newProject]);
      setCurrentProject(newProject);
    },
    []
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<CreativeProject>) => {
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
    },
    []
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setCurrentProject((prev) => (prev?.id === id ? null : prev));
  }, []);

  const selectProject = useCallback((id: string) => {
    setCurrentProject((prev) => {
      const project = projects.find((p) => p.id === id);
      return project || prev;
    });
  }, [projects]);

  // ==================== 캐릭터 관리 ====================
  const addCharacter = useCallback(
    (character: Character) => {
      setCurrentProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          characters: [...prev.characters, character],
          updatedAt: new Date(),
        };
      });
    },
    []
  );

  const updateCharacter = useCallback((id: string, updates: Partial<Character>) => {
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
  }, []);

  const deleteCharacter = useCallback((id: string) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        characters: prev.characters.filter((c) => c.id !== id),
        updatedAt: new Date(),
      };
    });
  }, []);

  // ==================== 씬/장면 관리 ====================
  const addSceneEvent = useCallback((event: SceneEvent) => {
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
  }, []);

  const updateSceneEvent = useCallback((id: string, updates: Partial<SceneEvent>) => {
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
  }, []);

  const deleteSceneEvent = useCallback((id: string) => {
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
  }, []);

  // ==================== 에피소드 관리 ====================
  const addEpisode = useCallback((episode: import('@/types').Episode) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: [...prev.episodes, episode],
        updatedAt: new Date(),
      };
    });
  }, []);

  const updateEpisode = useCallback((id: string, updates: Partial<import('@/types').Episode>) => {
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
  }, []);

  const deleteEpisode = useCallback((id: string) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: prev.episodes.filter((e) => e.id !== id),
        updatedAt: new Date(),
      };
    });
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
  const addTodo = useCallback((todo: TodoItem) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        todos: [...(prev.todos || []), todo],
        updatedAt: new Date(),
      };
    });
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
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
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        todos: (prev.todos || []).filter((t) => t.id !== id),
        updatedAt: new Date(),
      };
    });
  }, []);

  // ==================== 마인드맵 관리 ====================
  const addMindMapNode = useCallback((node: MindMapNode) => {
    setCurrentProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mindMap: [...(prev.mindMap || []), node],
        updatedAt: new Date(),
      };
    });
  }, []);

  const updateMindMapNode = useCallback((id: string, updates: Partial<MindMapNode>) => {
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
  }, []);

  const deleteMindMapNode = useCallback((id: string) => {
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
