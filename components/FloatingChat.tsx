'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCreative } from '@/context/CreativeContext';
import { checkConsistency } from '@/lib/somniApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolResults?: ToolResult[];
}

interface ToolResult {
  name: string;
  success: boolean;
  summary: string;
}

export default function FloatingChat() {
  const {
    currentProject,
    addCharacter,
    addSceneEvent,
    addEpisode,
    updateEpisode,
    updateProject,
  } = useCreative();

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

  if (!currentProject) return null;

  const buildContext = () => ({
    projectTitle: currentProject.title,
    projectDescription: currentProject.description,
    settingData: currentProject.settingData,
    characters: currentProject.characters,
    sceneEvents: currentProject.timeline?.events || [],
    episodes: currentProject.episodes || [],
    worldSetting: currentProject.worldSetting,
  });

  // ==================== Tool 실행 ====================
  const executeTool = async (name: string, args: any): Promise<ToolResult> => {
    try {
      switch (name) {
        case 'add_character': {
          const newChar = {
            id: Date.now().toString(),
            name: args.name,
            role: args.role || '',
            description: args.description || null,
            appearance: args.appearance || '',
            personality: args.personality || '',
            backstory: args.backstory || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await addCharacter(newChar);
          return { name, success: true, summary: `캐릭터 "${args.name}" 추가됨` };
        }

        case 'add_scene': {
          const charIds = (args.character_names || []).flatMap((cname: string) => {
            const found = currentProject.characters.find(c => c.name === cname);
            return found ? [found.id] : [];
          });
          const scene = {
            id: Date.now().toString() + '-s',
            title: args.title,
            description: args.description || '',
            timestamp: args.timestamp ?? 0,
            characterIds: charIds,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await addSceneEvent(scene);
          return { name, success: true, summary: `씬 "${args.title}" 추가됨` };
        }

        case 'add_episode': {
          const chapterNum = (currentProject.episodes?.length || 0) + 1;
          const ep = {
            id: Date.now().toString() + '-ep',
            title: args.title,
            content: args.content || '',
            chapterNumber: chapterNum,
            scenes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await addEpisode(ep);
          return { name, success: true, summary: `${chapterNum}화 "${args.title}" 추가됨` };
        }

        case 'write_episode_content': {
          const episodes = currentProject.episodes || [];
          const targetEp = args.episode_title
            ? episodes.find(e => e.title === args.episode_title || e.title.includes(args.episode_title))
            : episodes[episodes.length - 1];

          if (targetEp) {
            const newContent = args.append
              ? (targetEp.content || '') + '\n\n' + args.content
              : args.content;
            await updateEpisode(targetEp.id, { content: newContent });
            return { name, success: true, summary: `"${targetEp.title}" 내용 ${args.append ? '추가' : '작성'}됨 (${args.content.length}자)` };
          } else {
            // 회차 없으면 새로 생성
            const chapterNum = (episodes.length || 0) + 1;
            const ep = {
              id: Date.now().toString() + '-ep',
              title: args.episode_title || `${chapterNum}화`,
              content: args.content,
              chapterNumber: chapterNum,
              scenes: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await addEpisode(ep);
            return { name, success: true, summary: `새 회차 생성 후 내용 작성됨 (${args.content.length}자)` };
          }
        }

        case 'check_consistency': {
          const raw = currentProject.worldSetting || '';
          if (!raw.trim()) {
            return { name, success: false, summary: '텍스트 에디터에 원문이 없어 검사할 수 없습니다.' };
          }
          const result = await checkConsistency(raw, currentProject.settingData || null);
          await updateProject(currentProject.id, { consistencyReport: result });
          const score = Math.round((result.score ?? 0) * 100);
          return { name, success: true, summary: `일관성 검사 완료 — ${score}점` };
        }

        default:
          return { name, success: false, summary: `알 수 없는 tool: ${name}` };
      }
    } catch (err: any) {
      return { name, success: false, summary: `오류: ${err.message || err}` };
    }
  };

  // ==================== 메시지 전송 ====================
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

      // Tool 실행
      const toolResults: ToolResult[] = [];
      if (data.toolCalls && data.toolCalls.length > 0) {
        for (const tc of data.toolCalls) {
          const result = await executeTool(tc.name, tc.args);
          toolResults.push(result);
        }
      }

      const assistantMsg: Message = {
        id: Date.now().toString() + '-a',
        role: 'assistant',
        content: data.reply || (toolResults.length > 0 ? '' : ''),
        toolResults: toolResults.length > 0 ? toolResults : undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
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
        <div
          className="mb-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          style={{ height: '520px' }}
        >
          {/* 헤더 */}
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

          {/* 메시지 */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-400 dark:text-gray-500 text-xs mb-3">
                  창작 작업을 직접 실행할 수 있습니다
                </p>
                <div className="space-y-1.5">
                  {[
                    '새 캐릭터 만들어줘',
                    '다음 씬을 스토리보드에 추가해줘',
                    '1화 소설 내용 써줘',
                    '일관성 검사해줘',
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
              <div key={msg.id}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {(msg.content || (!msg.toolResults && msg.role === 'assistant')) && (
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  )}
                </div>
                {/* Tool 실행 결과 */}
                {msg.toolResults && msg.toolResults.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {msg.toolResults.map((tr, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${
                          tr.success
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                        }`}
                      >
                        <span className="flex-shrink-0">{tr.success ? '✓' : '✗'}</span>
                        <span>{tr.summary}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                placeholder="요청 입력... (Enter 전송)"
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
        className={`rounded-full shadow-lg flex items-center justify-center text-xl transition-all duration-200 ${
          isOpen ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        style={{ width: '52px', height: '52px' }}
        title="AI 창작 어시스턴트"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
