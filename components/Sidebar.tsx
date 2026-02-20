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
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
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
        className="group flex items-center py-1.5 hover:bg-gray-700/60 cursor-pointer rounded transition-colors text-gray-200"
        style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '8px' }}
      >
        {/* Expand/collapse chevron for folders */}
        <button
          onClick={() => type === 'folder' && setIsExpanded(!isExpanded)}
          className={`mr-1 text-gray-500 hover:text-gray-300 w-4 flex-shrink-0 flex items-center justify-center ${type !== 'folder' || !children?.length ? 'invisible' : ''}`}
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
            className="bg-gray-600 text-white px-2 py-0.5 rounded flex-1 text-sm outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-gray-100 text-sm truncate"
            onDoubleClick={() => setIsRenaming(true)}
          >
            {name}
          </span>
        )}

        {/* Action buttons - visible on hover */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}
            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
            title="이름 바꾸기"
          >
            <PencilIcon />
          </button>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(id); }}
              className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
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

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const { currentProject } = useCreative();
  const pathname = usePathname();

  const [isHovered, setIsHovered] = useState(false);

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
      {/* Mouse trigger zone */}
      <div
        className="fixed left-0 top-16 w-2 h-[calc(100vh-4rem)] z-[60]"
        onMouseEnter={() => setIsHovered(true)}
      />

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-18 h-[calc(100vh-4rem)] w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl overflow-y-auto flex flex-col z-50 transition-transform duration-300 ease-in-out border-r border-gray-700
          ${isHovered ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Project Info */}
        <div className="p-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h2 className="font-bold text-base text-white mb-0.5 truncate">{currentProject.title}</h2>
          <p className="text-xs text-gray-400 line-clamp-2">{currentProject.description}</p>
        </div>

        {/* Navigation */}
        <div className="px-3 py-4 border-b border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider px-1">메뉴</h3>
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Special Tools */}
        <div className="px-3 py-4 border-b border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider px-1">특수 도구</h3>
          <div className="space-y-0.5">
            {specialTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === tool.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-100'
                }`}
              >
                <span className="text-sm leading-none">{tool.icon}</span>
                <span className="text-sm">{tool.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500 mt-auto">
          Creative Studio 2026
        </div>
      </aside>

      {/* Content area */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out pt-16
          ${isHovered ? 'pl-64' : 'pl-0'}
        `}
      >
        {children}
      </main>
    </div>
  );
}