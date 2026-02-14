'use client';

import { useCreative } from '@/context/CreativeContext';
import { useState, useEffect } from 'react';

export default function EditorPage() {
  const { currentProject, updateProject } = useCreative();
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (currentProject) {
      setContent(currentProject.worldSetting || '');
    }
  }, [currentProject?.id]);

  useEffect(() => {
    setWordCount(content.trim().split(/\s+/).filter(w => w).length);
    setCharCount(content.length);
  }, [content]);

  const handleSave = () => {
    if (currentProject) {
      updateProject(currentProject.id, { worldSetting: content });
    }
    setIsSaved(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  if (!currentProject) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg mb-4">
            Select a project first
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            Back to start
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Text Editor
            </h1>
            <p className="text-gray-600">{currentProject.title}</p>
          </div>
          <button
            onClick={handleSave}
            className={`py-2 px-6 rounded-lg font-bold transition-colors ${
              isSaved
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-blue-50 border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Word Count</p>
            <p className="text-2xl font-bold text-blue-600">{wordCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Character Count</p>
            <p className="text-2xl font-bold text-blue-600">{charCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Read Time (min)</p>
            <p className="text-2xl font-bold text-blue-600">
              {Math.ceil(wordCount / 200)}
            </p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full">
          <textarea
            value={content}
            onChange={handleContentChange}
            className="w-full h-full p-6 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono text-gray-800"
            placeholder="Write your story here..."
          />
        </div>
      </div>

      {/* Unsaved Alert */}
      {!isSaved && (
        <div className="bg-yellow-50 border-t-2 border-yellow-400 p-4 text-yellow-800">
          <p className="max-w-6xl mx-auto">
            Unsaved changes
          </p>
        </div>
      )}
    </div>
  );
}
