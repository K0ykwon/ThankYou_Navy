'use client';

import { useRouter } from 'next/navigation';
import { useCreative } from '@/context/CreativeContext';
import { useEffect } from 'react';
import Link from 'next/link';

export default function MainDashboard() {
  const { currentProject } = useCreative();
  const router = useRouter();

  useEffect(() => {
    if (!currentProject) {
      router.push('/');
    }
  }, [currentProject, router]);

  if (!currentProject) {
    return null;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C1505' }}>
            {currentProject.title}
          </h1>
          <p style={{ color: '#9A6B42' }}>{currentProject.description}</p>
        </div>
        {/* <Link href="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded transition-colors">
          ← 프로젝트 목록
        </Link> */}
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-lg shadow-md border-l-4" style={{ backgroundColor: '#F5EAD3', borderLeftColor: '#8B5A2B' }}>
          <p className="text-sm mb-1" style={{ color: '#9A6B42' }}>Characters</p>
          <p className="text-3xl font-bold" style={{ color: '#8B5A2B' }}>{currentProject.characters.length}</p>
        </div>
        <div className="p-6 rounded-lg shadow-md border-l-4" style={{ backgroundColor: '#F5EAD3', borderLeftColor: '#5A8A3A' }}>
          <p className="text-sm mb-1" style={{ color: '#9A6B42' }}>Episodes</p>
          <p className="text-3xl font-bold" style={{ color: '#5A8A3A' }}>{currentProject.episodes.length}</p>
        </div>
        <div className="p-6 rounded-lg shadow-md border-l-4" style={{ backgroundColor: '#F5EAD3', borderLeftColor: '#7A4A8A' }}>
          <p className="text-sm mb-1" style={{ color: '#9A6B42' }}>Scene Events</p>
          <p className="text-3xl font-bold" style={{ color: '#7A4A8A' }}>{currentProject.timeline.events.length}</p>
        </div>
        <div className="p-6 rounded-lg shadow-md border-l-4" style={{ backgroundColor: '#F5EAD3', borderLeftColor: '#C4602A' }}>
          <p className="text-sm mb-1" style={{ color: '#9A6B42' }}>Todo</p>
          <p className="text-3xl font-bold" style={{ color: '#C4602A' }}>{currentProject.todos?.length || 0}</p>
        </div>
      </div>

      {/* Project Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Info */}
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: '#F5EAD3', border: '1px solid #DBBF8E' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2C1505' }}>Project Information</h2>
          <div className="space-y-2 text-sm" style={{ color: '#614023' }}>
            <p><strong>Title:</strong> {currentProject.title}</p>
            <p><strong>Description:</strong> {currentProject.description}</p>
            {currentProject.genre && <p><strong>Genre:</strong> {currentProject.genre}</p>}
            {currentProject.author && <p><strong>Author:</strong> {currentProject.author}</p>}
            <p><strong>Created:</strong> {new Date(currentProject.createdAt).toLocaleDateString('en-US')}</p>
            <p><strong>Updated:</strong> {new Date(currentProject.updatedAt).toLocaleDateString('en-US')}</p>
          </div>
        </div>

        {/* World Setting */}
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: '#F5EAD3', border: '1px solid #DBBF8E' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2C1505' }}>World Setting</h2>
          <p style={{ color: '#9A6B42' }}>
            {currentProject.worldSetting || 'No world setting yet.'}
          </p>
          <button
            style={{ backgroundColor: '#8B5A2B', color: '#FBF4E8' }}
            className="mt-4 px-4 py-2 rounded text-sm font-medium transition-colors hover:opacity-80"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 border-l-4 p-6 rounded-lg" style={{ backgroundColor: '#FFF3E0', borderLeftColor: '#C4935A' }}>
        <h3 className="font-bold mb-2" style={{ color: '#3D1F0A' }}>Quick Tips</h3>
        <ul className="text-sm space-y-1" style={{ color: '#614023' }}>
          <li>- Manage characters, storyboard, and settings from the left sidebar</li>
          <li>- Use Create Folder and Create File buttons to organize your project</li>
          <li>- Access Special Tools like Todo, Timeline, and Mind Map</li>
          <li>- Adjust font size and theme in Settings (top right corner)</li>
        </ul>
      </div>
    </div>
  );
}
