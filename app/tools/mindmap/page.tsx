'use client';

import React, { useState } from 'react';
import { useCreative } from '@/context/CreativeContext';

interface MindmapNode {
  id: string;
  text: string;
  children: MindmapNode[];
}

export default function MindmapPage() {
  const { currentProject, updateProjectField: updateField } = useCreative();
  const updateProjectField = updateField;
  const [newNodeText, setNewNodeText] = useState('');

  if (!currentProject) {
    return (
      <div className="flex-1 p-8">
        <p className="text-gray-600 dark:text-gray-400">프로젝트를 선택해주세요.</p>
      </div>
    );
  }

  const mindmap = (currentProject.mindmap || {
    id: '1',
    text: '프로젝트',
    children: [],
  }) as MindmapNode;

  const handleAddNode = () => {
    if (newNodeText.trim()) {
      const newNode: MindmapNode = {
        id: Date.now().toString(),
        text: newNodeText,
        children: [],
      };
      const updatedMindmap = {
        ...mindmap,
        children: [...(mindmap.children || []), newNode],
      };
      updateProjectField('mindmap', updatedMindmap);
      setNewNodeText('');
    }
  };

  const MindmapNodeComponent = ({ node, level = 0 }: { node: MindmapNode; level?: number }) => {
    const handleDeleteNode = (id: string) => {
      const deleteNodeRecursive = (n: MindmapNode): MindmapNode => {
        return {
          ...n,
          children: n.children
            .filter((child) => child.id !== id)
            .map((child) => deleteNodeRecursive(child)),
        };
      };
      const updatedMindmap = deleteNodeRecursive(mindmap);
      updateProjectField('mindmap', updatedMindmap);
    };

    return (
      <div className="mb-4">
        <div
          className={`inline-block px-4 py-3 rounded-lg border-2 transition-all ${
            level === 0
              ? 'bg-blue-600 dark:bg-blue-700 border-blue-800 dark:border-blue-900 text-white font-bold'
              : 'bg-blue-50 dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-gray-900 dark:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>{node.text}</span>
            {level > 0 && (
              <button
                onClick={() => handleDeleteNode(node.id)}
                className="text-sm px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                X
              </button>
            )}
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="ml-8 mt-4 border-l-2 border-blue-300 dark:border-blue-700 pl-4">
            {node.children.map((child) => (
              <MindmapNodeComponent key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 p-8 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">🧠 Mindmap</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">스토리의 개념과 아이디어를 정리하세요.</p>

        {/* 새로운 노드 추가 */}
        <div className="mb-8 flex gap-3">
          <input
            type="text"
            value={newNodeText}
            onChange={(e) => setNewNodeText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddNode()}
            placeholder="새로운 아이디어를 입력하세요..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
          />
          <button
            onClick={handleAddNode}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
          >
            추가
          </button>
        </div>

        {/* Mindmap 표시 */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
          <MindmapNodeComponent node={mindmap} />
          {mindmap.children.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">아직 아이디어가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
