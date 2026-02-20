'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCreative } from '@/context/CreativeContext';

// SVG Icon Components
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" style={{ color: '#C4935A' }} viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" style={{ color: '#DBBF8E' }} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

interface TreeNodeProps {
  id: string;
  name: string;
  type: 'folder' | 'file';
  depth: number;
  children?: any[];
  parentId?: string;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

function TreeNode({
  id,
  name,
  type,
  depth,
  children,
  parentId,
  onRename,
  onDelete,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(name);

  const handleRename = () => {
    if (newName.trim() && onRename) {
      onRename(id, newName);
      setIsRenaming(false);
    }
  };

  const paddingLeft = depth * 16 + 12;

  return (
    <div>
      <div
        className="group flex items-center py-1.5 cursor-pointer rounded transition-colors"
        style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '8px', color: '#D4B896' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(196,147,90,0.15)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {/* Expand/collapse chevron for folders */}
        <button
          onClick={() => type === 'folder' && setIsExpanded(!isExpanded)}
          className={`mr-1 w-4 flex-shrink-0 flex items-center justify-center ${type !== 'folder' || !children?.length ? 'invisible' : ''}`}
          style={{ color: '#9A6B42' }}
        >
          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </button>

        {/* File/Folder icon */}
        <span className="mr-2">
          {type === 'folder' ? <FolderIcon /> : <FileIcon />}
        </span>

        {isRenaming ? (
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            style={{ backgroundColor: '#4A2C17', color: '#F0DFC5', borderColor: '#5C3A1A' }}
            className="px-2 py-0.5 rounded flex-1 text-sm outline-none border"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-sm truncate"
            style={{ color: '#E0C8A8' }}
            onDoubleClick={() => setIsRenaming(true)}
          >
            {name}
          </span>
        )}

        {/* Action buttons - visible on hover */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}
            className="p-1 rounded transition-colors"
            style={{ color: '#9A6B42' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(196,147,90,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="이름 바꾸기"
          >
            <PencilIcon />
          </button>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(id); }}
              className="p-1 rounded transition-colors"
              style={{ color: '#9A6B42' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(180,50,30,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="삭제"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {isExpanded && type === 'folder' && children && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              {...child}
              depth={depth + 1}
              parentId={id}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  children?: React.ReactNode;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ children, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { currentProject } = useCreative();
  const pathname = usePathname();

  const [isHovered, setIsHovered] = useState(false);
  const isVisible = isHovered || mobileOpen;

  if (!currentProject) {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/main', label: '메인', icon: '🏠' },
    { href: '/editor', label: '텍스트 에디터', icon: '✍️' },
    { href: '/characters', label: '캐릭터 관리', icon: '👥' },
    { href: '/storyboard', label: '스토리보드', icon: '🎬' },
  ];

  const specialTools = [
    { label: 'Todo', href: '/tools/todo', icon: '✅' },
    { label: 'Timeline', href: '/tools/timeline', icon: '📅' },
    { label: 'Mindmap', href: '/tools/mindmap', icon: '🗺️' },
    { label: 'Negative Arc', href: '/tools/negative-arc', icon: '📉' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* 모바일 백드롭 오버레이 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'rgba(21,10,3,0.6)' }}
          onClick={onMobileClose}
        />
      )}

      {/* 데스크톱 전용 마우스 트리거 영역 */}
      <div
        className="fixed left-0 top-16 w-2 h-[calc(100vh-4rem)] z-[60] hidden md:block"
        onMouseEnter={() => setIsHovered(true)}
      />

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ background: 'linear-gradient(to bottom, #1E0F05, #2F1A0A)', borderColor: '#4A2C17' }}
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 shadow-2xl overflow-y-auto flex flex-col z-50 transition-transform duration-300 ease-in-out border-r
          ${isVisible ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Project Info */}
        <div className="p-4 sticky top-0 z-10 flex items-start justify-between gap-2" style={{ backgroundColor: '#1E0F05', borderBottom: '1px solid #4A2C17' }}>
          <div className="min-w-0">
            <h2 className="font-bold text-base mb-0.5 truncate" style={{ color: '#F0DFC5' }}>{currentProject.title}</h2>
            <p className="text-xs line-clamp-2" style={{ color: '#9A6B42' }}>{currentProject.description}</p>
          </div>
          {/* 모바일 전용 닫기 버튼 */}
          <button
            onClick={onMobileClose}
            className="md:hidden flex-shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
            style={{ color: '#9A6B42' }}
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="px-3 py-4" style={{ borderBottom: '1px solid #4A2C17' }}>
          <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider px-1" style={{ color: '#7A4E28' }}>메뉴</h3>
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                style={pathname === item.href
                  ? { backgroundColor: '#8B5A2B', color: '#F0DFC5' }
                  : { color: '#D4B896' }
                }
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:opacity-80"
                onMouseEnter={e => { if (pathname !== item.href) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(196,147,90,0.15)'; }}
                onMouseLeave={e => { if (pathname !== item.href) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Special Tools */}
        <div className="px-3 py-4" style={{ borderBottom: '1px solid #4A2C17' }}>
          <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider px-1" style={{ color: '#7A4E28' }}>특수 도구</h3>
          <div className="space-y-0.5">
            {specialTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                onClick={onMobileClose}
                style={pathname === tool.href
                  ? { backgroundColor: '#8B5A2B', color: '#F0DFC5' }
                  : { color: '#C4935A' }
                }
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                onMouseEnter={e => { if (pathname !== tool.href) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(196,147,90,0.15)'; }}
                onMouseLeave={e => { if (pathname !== tool.href) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <span className="text-sm leading-none">{tool.icon}</span>
                <span className="text-sm">{tool.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-xs mt-auto" style={{ borderTop: '1px solid #4A2C17', color: '#7A4E28' }}>
          Creative Studio 2026
        </div>
      </aside>

      {/* Content area (데스크톱 전용 padding 조정) */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out hidden md:block
          ${isHovered ? 'pl-64' : 'pl-0'}
        `}
      >
        {children}
      </main>
    </div>
  );
}