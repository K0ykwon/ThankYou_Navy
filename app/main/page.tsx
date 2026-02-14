'use client';

import { useRouter } from 'next/navigation';
import { useCreative } from '@/context/CreativeContext';
import { useEffect } from 'react';

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {currentProject.title}
        </h1>
        <p className="text-gray-600">{currentProject.description}</p>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm mb-1">Characters</p>
          <p className="text-3xl font-bold text-blue-600">{currentProject.characters.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <p className="text-gray-600 text-sm mb-1">Episodes</p>
          <p className="text-3xl font-bold text-green-600">{currentProject.episodes.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
          <p className="text-gray-600 text-sm mb-1">Scene Events</p>
          <p className="text-3xl font-bold text-purple-600">{currentProject.timeline.events.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-600">
          <p className="text-gray-600 text-sm mb-1">Todo</p>
          <p className="text-3xl font-bold text-orange-600">{currentProject.todos?.length || 0}</p>
        </div>
      </div>

      {/* Project Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Info */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Project Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Title:</strong> {currentProject.title}</p>
            <p><strong>Description:</strong> {currentProject.description}</p>
            {currentProject.genre && <p><strong>Genre:</strong> {currentProject.genre}</p>}
            {currentProject.author && <p><strong>Author:</strong> {currentProject.author}</p>}
            <p><strong>Created:</strong> {new Date(currentProject.createdAt).toLocaleDateString('en-US')}</p>
            <p><strong>Updated:</strong> {new Date(currentProject.updatedAt).toLocaleDateString('en-US')}</p>
          </div>
        </div>

        {/* World Setting */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">World Setting</h2>
          <p className="text-gray-600">
            {currentProject.worldSetting || 'No world setting yet.'}
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors">
            Edit
          </button>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-2">Quick Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>- Manage characters, storyboard, and settings from the left sidebar</li>
          <li>- Use Create Folder and Create File buttons to organize your project</li>
          <li>- Access Special Tools like Todo, Timeline, and Mind Map</li>
          <li>- Adjust font size and theme in Settings (top right corner)</li>
        </ul>
      </div>
    </div>
  );
}
