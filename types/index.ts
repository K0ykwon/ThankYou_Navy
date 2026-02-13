// 창작 도구 타입 정의

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  content: string;
}

export interface SceneEvent {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  characterIds: string[];
}

export interface Timeline {
  id: string;
  projectId: string;
  events: SceneEvent[];
  totalDuration: number;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  appearance: string;
  personality: string;
  backstory: string;
  imageUrl?: string;
}

export interface CreativeProject {
  id: string;
  title: string;
  description: string;
  content: string;
  characters: Character[];
  episodes: Episode[];
  timeline: Timeline;
  createdAt: Date;
  updatedAt: Date;
}

export interface Episode {
  id: string;
  title: string;
  summary?: string;
  chapterNumber?: number;
  scenes?: SceneEvent[];
  createdAt: Date;
  updatedAt: Date;
}
