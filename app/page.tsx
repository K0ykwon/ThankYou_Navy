'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCreative } from '@/context/CreativeContext';
import { useRouter } from 'next/navigation';

export default function StartPage() {
  const { projects, createProject, deleteProject, selectProject } = useCreative();
  const router = useRouter();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    author: '',
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      createProject(formData.title, formData.description, formData.genre, formData.author);
      setFormData({ title: '', description: '', genre: '', author: '' });
      setShowNewProjectForm(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    sessionStorage.setItem('selectedProjectId', projectId);
    router.push('/main');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Creative Studio</h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">Start your creative journey</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* New Project Section */}
        <div className="mb-12">
          {!showNewProjectForm ? (
            <button
              onClick={() => setShowNewProjectForm(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              + New Project
            </button>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-blue-200 dark:border-blue-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Project</h2>
              <form onSubmit={handleCreateProject}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:ring-blue-900 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g. My Fantasy Novel"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Genre
                    </label>
                    <input
                      type="text"
                      value={formData.genre}
                      onChange={(e) =>
                        setFormData({ ...formData, genre: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:ring-blue-900 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g. Fantasy, Romance, Sci-Fi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:ring-blue-900 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:ring-blue-900 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Write a brief description of your project"
                    rows={4}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewProjectForm(false);
                      setFormData({ title: '', description: '', genre: '', author: '' });
                    }}
                    className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Projects List */}
        {projects.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              My Projects ({projects.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {project.description || 'No description'}
                    </p>

                    <div className="flex gap-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
                      {project.genre && (
                        <div className="flex items-center gap-1">
                          <span>Book</span>
                          <span>{project.genre}</span>
                        </div>
                      )}
                      {project.author && (
                        <div className="flex items-center gap-1">
                          <span>Author</span>
                          <span>{project.author}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <div>Characters: {project.characters.length}</div>
                      <div>Episodes: {project.episodes.length}</div>
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                      Updated: {new Date(project.updatedAt).toLocaleDateString('en-US')}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectProject(project.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-bold rounded transition-colors"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this project?')) {
                            deleteProject(project.id);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm font-bold rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && !showNewProjectForm && (
          <div className="text-center py-16">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">No projects yet.</p>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Create a new project to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
