'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CreativeProject,
  Character,
  SceneEvent,
  Timeline,
} from '@/types';

interface CreativeContextType {
  currentProject: CreativeProject | null;
  projects: CreativeProject[];
  createProject: (title: string, description: string) => void;
  updateProject: (id: string, updates: Partial<CreativeProject>) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  addSceneEvent: (event: SceneEvent) => void;
  updateSceneEvent: (id: string, updates: Partial<SceneEvent>) => void;
  deleteSceneEvent: (id: string) => void;
  updateProjectContent: (content: string) => void;
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

  const createProject = useCallback(
    (title: string, description: string) => {
      const newProject: CreativeProject = {
        id: Date.now().toString(),
        title,
        description,
        content: '',
        characters: [],
        timeline: {
          id: Date.now().toString(),
          projectId: Date.now().toString(),
          events: [],
          totalDuration: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProjects([...projects, newProject]);
      setCurrentProject(newProject);
    },
    [projects]
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<CreativeProject>) => {
      const updatedProjects = projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      );
      setProjects(updatedProjects);
      if (currentProject?.id === id) {
        setCurrentProject({
          ...currentProject,
          ...updates,
          updatedAt: new Date(),
        });
      }
    },
    [projects, currentProject]
  );

  const deleteProject = useCallback(
    (id: string) => {
      const filtered = projects.filter((p) => p.id !== id);
      setProjects(filtered);
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    },
    [projects, currentProject]
  );

  const selectProject = useCallback((id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setCurrentProject(project);
    }
  }, [projects]);

  const addCharacter = useCallback(
    (character: Character) => {
      if (!currentProject) return;
      const updated = {
        ...currentProject,
        characters: [...currentProject.characters, character],
        updatedAt: new Date(),
      };
      updateProject(currentProject.id, updated);
    },
    [currentProject, updateProject]
  );

  const updateCharacter = useCallback(
    (id: string, updates: Partial<Character>) => {
      if (!currentProject) return;
      const updated = {
        ...currentProject,
        characters: currentProject.characters.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
        updatedAt: new Date(),
      };
      updateProject(currentProject.id, updated);
    },
    [currentProject, updateProject]
  );

  const deleteCharacter = useCallback(
    (id: string) => {
      if (!currentProject) return;
      const updated = {
        ...currentProject,
        characters: currentProject.characters.filter((c) => c.id !== id),
        updatedAt: new Date(),
      };
      updateProject(currentProject.id, updated);
    },
    [currentProject, updateProject]
  );

  const addSceneEvent = useCallback(
    (event: SceneEvent) => {
      if (!currentProject) return;
      const timeline = {
        ...currentProject.timeline,
        events: [...currentProject.timeline.events, event],
      };
      const updated = {
        ...currentProject,
        timeline,
        updatedAt: new Date(),
      };
      updateProject(currentProject.id, updated);
    },
    [currentProject, updateProject]
  );

  const updateSceneEvent = useCallback(
    (id: string, updates: Partial<SceneEvent>) => {
      if (!currentProject) return;
      const timeline = {
        ...currentProject.timeline,
        events: currentProject.timeline.events.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      };
      const updated = {
        ...currentProject,
        timeline,
        updatedAt: new Date(),
      };
      updateProject(currentProject.id, updated);
    },
    [currentProject, updateProject]
  );

  const deleteSceneEvent = useCallback(
    (id: string) => {
      if (!currentProject) return;
      const timeline = {
        ...currentProject.timeline,
        events: currentProject.timeline.events.filter((e) => e.id !== id),
      };
      const updated = {
        ...currentProject,
        timeline,
        updatedAt: new Date(),
      };
      updateProject(currentProject.id, updated);
    },
    [currentProject, updateProject]
  );

  const updateProjectContent = useCallback(
    (content: string) => {
      if (!currentProject) return;
      updateProject(currentProject.id, { content });
    },
    [currentProject, updateProject]
  );

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
    updateProjectContent,
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
