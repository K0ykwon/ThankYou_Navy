'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCreative } from '@/context/CreativeContext';

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

  const paddingLeft = depth * 16;

  return (
    <div>
      <div
        className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer rounded transition-colors"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {type === 'folder' && children && children.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-1 text-gray-400 hover:text-white"
          >
            {isExpanded ? 'v' : '>'}
          </button>
        )}
        {type === 'folder' && (!children || children.length === 0) && (
          <span className="mr-1 text-gray-400 w-4"></span>
        )}

        <span className="mr-2">
          {type === 'folder' ? '[F]' : '[f]'}
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
            className="bg-gray-600 text-white px-2 py-1 rounded flex-1"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-gray-100 text-sm"
            onDoubleClick={() => setIsRenaming(true)}
          >
            {name}
          </span>
        )}

        <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsRenaming(true)}
            className="p-1 hover:bg-gray-600 rounded text-xs"
            title="Rename"
          >
            R
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="p-1 hover:bg-red-600 rounded text-xs"
              title="Delete"
            >
              X
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

export default function Sidebar() {
  const {
    currentProject,
    createFolder,
    createFile,
    renameElement,
    deleteFileOrFolder,
  } = useCreative();

  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  if (!currentProject) {
    return null;
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(selectedParentId, newFolderName);
      setNewFolderName('');
      setShowNewFolderInput(false);
      setSelectedParentId(null);
    }
  };

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      createFile(selectedParentId, newFileName);
      setNewFileName('');
      setShowNewFileInput(false);
      setSelectedParentId(null);
    }
  };

  const specialTools = [
    { label: 'Todo', href: '/tools/todo' },
    { label: 'Timeline', href: '/tools/timeline' },
    { label: 'Mindmap', href: '/tools/mindmap' },
    { label: 'Negative Arc', href: '/tools/negative-arc' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-gray-100 h-screen overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="font-bold text-lg text-white mb-1">{currentProject.title}</h2>
        <p className="text-xs text-gray-400">{currentProject.description}</p>
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase">Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => setShowNewFolderInput(!showNewFolderInput)}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            [+] New Folder
          </button>
          <button
            onClick={() => setShowNewFileInput(!showNewFileInput)}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            [+] New File
          </button>
        </div>

        {/* Folder Creation Input */}
        {showNewFolderInput && (
          <div className="mt-3 space-y-2">
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateFolder}
                className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                }}
                className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* File Creation Input */}
        {showNewFileInput && (
          <div className="mt-3 space-y-2">
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File name"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:border-green-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateFile}
                className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewFileInput(false);
                  setNewFileName('');
                }}
                className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Core Elements - Navigation Tree */}
      <div className="flex-1 p-4 border-b border-gray-700 overflow-y-auto">
        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase">Core Elements</h3>

        {/* Storyboard, Characters, World Setting */}
        <div className="space-y-1">
          <NavTreeItem label="Storyboard" href="/app/storyboard" />
          <NavTreeItem label="Characters" href="/app/characters" />
          <NavTreeItem label="World Setting" href="/app/worldsetting" />
        </div>

        {/* File Tree */}
        {currentProject.fileTree && currentProject.fileTree.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-xs font-bold text-gray-400 mb-2">Files and Folders</h4>
            <div className="space-y-1">
              {currentProject.fileTree.map((element) => (
                <TreeNode
                  key={element.id}
                  {...element}
                  depth={0}
                  onRename={(id, newName) => renameElement(id, newName, null)}
                  onDelete={(id) => deleteFileOrFolder(id, null)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Special Tools */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase">Special Tools</h3>
        <div className="space-y-2">
          {specialTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="block px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded text-sm transition-colors flex items-center gap-2"
            >
              <span>{tool.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        <p>Creative Studio 2026</p>
        <Link href="/" className="text-blue-400 hover:text-blue-300 mt-2 block">
          Back to Projects
        </Link>
      </div>
    </div>
  );
}

function NavTreeItem({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-100 hover:bg-gray-700 rounded transition-colors"
    >
      <span>{label}</span>
    </Link>
  );
}
