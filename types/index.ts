// 창작 도구 타입 정의

// ==================== 파일/폴더 시스템 ====================
export type ElementType = 'folder' | 'file';

export interface FolderElement {
  id: string;
  type: 'folder';
  name: string;
  children: ProjectElement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FileElement {
  id: string;
  type: 'file';
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectElement = FolderElement | FileElement;

// ==================== 캐릭터 ====================
export interface Character {
  id: string;
  name: string;
  age?: number;
  role: string;
  description: string;
  appearance: string;
  personality: string;
  backstory: string;
  goals?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 씬/장면 ====================
export interface SceneEvent {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  characterIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 타임라인 ====================
export interface Timeline {
  id: string;
  projectId: string;
  events: SceneEvent[];
  totalDuration: number;
}

// ==================== 에피소드 ====================
export interface Episode {
  id: string;
  title: string;
  summary?: string;
  chapterNumber?: number;
  scenes?: SceneEvent[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 네거티브 아크 (부정적 호) ====================
export interface NegativeArcPoint {
  id: string;
  phase: string;
  description: string;
  emotionalLow: number; // 1-10 scale
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== 소설/프로젝트 ====================
export interface CreativeProject {
  id: string;
  title: string;
  description: string;
  genre?: string;
  author?: string;
  fileTree: ProjectElement[];
  characters: Character[];
  episodes: Episode[];
  timeline: Timeline;
  negativeArc?: NegativeArcPoint[];
  worldSetting?: string;
  mindMap?: MindMapNode[];
  todos?: TodoItem[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Todo ====================
export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 마인드맵 ====================
export interface MindMapNode {
  id: string;
  title: string;
  description?: string;
  children?: MindMapNode[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 테마 & 설정 ====================
export type FontFamily = 'sans' | 'serif' | 'mono';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type ThemeMode = 'light' | 'dark';

export interface UserSettings {
  id: string;
  userId: string;
  fontSize: FontSize;
  fontFamily: FontFamily;
  themeMode: ThemeMode;
  autoSave: boolean;
  autoSaveInterval: number; // ms
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 프로젝트 목록 아이템 ====================
export interface ProjectListItem {
  id: string;
  title: string;
  description: string;
  author?: string;
  genre?: string;
  characterCount: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}
