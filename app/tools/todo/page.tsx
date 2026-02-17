'use client';

import React, { useState } from 'react';
import { useCreative } from '@/context/CreativeContext';

export default function TodoPage() {
  const { currentProject, updateProjectField: updateField } = useCreative();
  const updateProjectField = updateField;
  const [newTodoText, setNewTodoText] = useState('');

  if (!currentProject) {
    return (
      <div className="flex-1 p-8">
        <p className="text-gray-600 dark:text-gray-400">프로젝트를 선택해주세요.</p>
      </div>
    );
  }

  const todos = currentProject.todos || [];

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      const newTodo = {
        id: Date.now().toString(),
        text: newTodoText,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      const updatedTodos = [...todos, newTodo];
      updateProjectField('todo', updatedTodos);
      setNewTodoText('');
    }
  };

  const handleToggleTodo = (id: string) => {
    const updatedTodos = todos.map((todo: any) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    updateProjectField('todo', updatedTodos);
  };

  const handleDeleteTodo = (id: string) => {
    const updatedTodos = todos.filter((todo: any) => todo.id !== id);
    updateProjectField('todo', updatedTodos);
  };

  const completedCount = todos.filter((todo: any) => todo.completed).length;

  return (
    <div className="flex-1 p-8 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">📋 Todo List</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          프로젝트 진행 사항을 관리하세요. ({completedCount}/{todos.length})
        </p>

        {/* 새로운 Todo 추가 */}
        <div className="mb-8 flex gap-3">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            placeholder="새로운 작업을 입력하세요..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
          />
          <button
            onClick={handleAddTodo}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
          >
            추가
          </button>
        </div>

        {/* Todo 리스트 */}
        <div className="space-y-2">
          {todos.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">아직 작업이 없습니다.</p>
          ) : (
            todos.map((todo: any) => (
              <div
                key={todo.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                  className="w-5 h-5 cursor-pointer"
                />
                <span
                  className={`flex-1 ${
                    todo.completed
                      ? 'line-through text-gray-500 dark:text-gray-500'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  삭제
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
