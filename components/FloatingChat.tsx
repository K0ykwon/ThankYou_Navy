'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCreative } from '@/context/CreativeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingChat() {
  const { currentProject } = useCreative();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  // 프로젝트가 없으면 버튼 자체를 숨김
  if (!currentProject) return null;

  const buildContext = () => ({
    projectTitle: currentProject.title,
    projectDescription: currentProject.description,
    settingData: currentProject.settingData,
    characters: currentProject.characters,
    sceneEvents: currentProject.timeline?.events || [],
    worldSetting: currentProject.worldSetting,
  });

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          context: buildContext(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API 오류');
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-a',
        role: 'assistant',
        content: data.reply,
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-e',
        role: 'assistant',
        content: `오류: ${err.message}`,
      }]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 채팅 패널 */}
      {isOpen && (
        <div className="mb-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          style={{ height: '480px' }}>
          {/* 패널 헤더 */}
          <div className="flex-shrink-0 bg-blue-600 dark:bg-blue-700 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">💬 AI 창작 어시스턴트</p>
              <p className="text-blue-200 text-xs truncate max-w-[180px]">{currentProject.title}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-blue-200 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  캐릭터, 세계관, 씬 정보를 바탕으로<br />창작을 도와드립니다.
                </p>
                <div className="mt-3 space-y-1.5">
                  {[
                    '주인공을 소개해줘',
                    '다음 씬 아이디어 제안해줘',
                    '스토리 모순점 찾아줘',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="block w-full text-left text-xs px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl rounded-bl-sm px-3 py-2">
                  <span className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800">
            <div className="flex items-end gap-1.5">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="질문 입력... (Enter 전송)"
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-bold py-2 px-3 rounded-xl transition-colors text-xs disabled:cursor-not-allowed"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-13 h-13 rounded-full shadow-lg flex items-center justify-center text-xl transition-all duration-200 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        style={{ width: '52px', height: '52px' }}
        title="AI 창작 어시스턴트"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
