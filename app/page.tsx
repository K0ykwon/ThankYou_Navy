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
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #F5EAD3, #FBF4E8)' }}>
      {/* Header */}
<header className="w-full shadow-sm" style={{ backgroundColor: '#FBF4E8', borderBottom: '1px solid #DBBF8E' }}>
  <div className="max-w-7xl mx-auto px-6 py-8">
    <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C1505' }}>Creative Studio</h1>
    <p style={{ color: '#9A6B42' }}>Start your creative journey</p>
  </div>
</header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* New Project Section */}
        <div className="mb-12">
          {!showNewProjectForm ? (
            <button
              onClick={() => setShowNewProjectForm(true)}
              style={{ background: 'linear-gradient(to right, #8B5A2B, #A67C52)', color: '#FBF4E8' }}
              className="px-8 py-4 font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 hover:opacity-90"
            >
              + New Project
            </button>
          ) : (
            <div className="p-8 rounded-lg shadow-lg border-2" style={{ backgroundColor: '#F5EAD3', borderColor: '#C4935A' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#2C1505' }}>Create New Project</h2>
              <form onSubmit={handleCreateProject}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#614023' }}>
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      style={{ borderColor: '#C4935A', backgroundColor: '#FBF4E8', color: '#2C1505' }}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                      placeholder="e.g. My Fantasy Novel"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#614023' }}>
                      Genre
                    </label>
                    <input
                      type="text"
                      value={formData.genre}
                      onChange={(e) =>
                        setFormData({ ...formData, genre: e.target.value })
                      }
                      style={{ borderColor: '#C4935A', backgroundColor: '#FBF4E8', color: '#2C1505' }}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                      placeholder="e.g. Fantasy, Romance, Sci-Fi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#614023' }}>
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                      style={{ borderColor: '#C4935A', backgroundColor: '#FBF4E8', color: '#2C1505' }}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2" style={{ color: '#614023' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    style={{ borderColor: '#C4935A', backgroundColor: '#FBF4E8', color: '#2C1505' }}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                    placeholder="Write a brief description of your project"
                    rows={4}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    style={{ backgroundColor: '#8B5A2B', color: '#FBF4E8' }}
                    className="flex-1 px-6 py-3 font-bold rounded-lg transition-colors hover:opacity-80"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewProjectForm(false);
                      setFormData({ title: '', description: '', genre: '', author: '' });
                    }}
                    style={{ backgroundColor: '#9A6B42', color: '#FBF4E8' }}
                    className="flex-1 px-6 py-3 font-bold rounded-lg transition-colors hover:opacity-80"
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
                  className="rounded-lg shadow-md hover:shadow-lg overflow-hidden transition-all transform hover:-translate-y-1"
                  style={{ backgroundColor: '#F5EAD3', border: '1px solid #DBBF8E' }}
                >
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 truncate" style={{ color: '#2C1505' }}>
                      {project.title}
                    </h3>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: '#7A5030' }}>
                      {project.description || 'No description'}
                    </p>

                    <div className="flex gap-3 mb-4 text-sm" style={{ color: '#9A6B42' }}>
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

                    <div className="flex gap-2 text-xs mb-4" style={{ color: '#9A6B42' }}>
                      <div>Characters: {project.characters.length}</div>
                      <div>Episodes: {project.episodes.length}</div>
                    </div>

                    <p className="text-xs mb-4" style={{ color: '#C4935A' }}>
                      Updated: {new Date(project.updatedAt).toLocaleDateString('en-US')}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectProject(project.id)}
                        style={{ backgroundColor: '#8B5A2B', color: '#FBF4E8' }}
                        className="flex-1 px-4 py-2 text-sm font-bold rounded transition-colors hover:opacity-80"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this project?')) {
                            deleteProject(project.id);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded transition-colors"
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
