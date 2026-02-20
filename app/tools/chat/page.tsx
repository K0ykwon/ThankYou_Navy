'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCreative } from '@/context/CreativeContext';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const { currentProject, addEpisode, updateEpisode, addSceneEvent, addCharacter } = useCreative();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentProject) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">프로젝트를 먼저 선택하세요</p>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">프로젝트로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const buildContext = () => ({
    projectTitle: currentProject.title,
    projectDescription: currentProject.description,
    settingData: currentProject.settingData,
    characters: currentProject.characters,
    episodes: currentProject.episodes || [],
    sceneEvents: currentProject.timeline?.events || [],
    worldSetting: currentProject.worldSetting,
  });

  // 에이전트 tool call 실행 및 결과 메시지 생성
  const executeToolCalls = async (toolCalls: { id: string; name: string; args: any }[]): Promise<string[]> => {
    const results: string[] = [];
    for (const tc of toolCalls) {
      try {
        if (tc.name === 'add_character') {
          const newChar = {
            id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
            name: tc.args.name,
            role: tc.args.role || '',
            description: tc.args.description || '',
            appearance: tc.args.appearance || '',
            personality: tc.args.personality || '',
            backstory: tc.args.backstory || '',
            relationships: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await addCharacter(newChar);
          results.push(`✅ 캐릭터 **${tc.args.name}** 추가 완료`);
        } else if (tc.name === 'add_scene') {
          const charIds = (currentProject?.characters || [])
            .filter((c: any) => (tc.args.character_names || []).includes(c.name))
            .map((c: any) => c.id);
          const newScene = {
            id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
            title: tc.args.title,
            description: tc.args.description || '',
            timestamp: tc.args.timestamp || 0,
            characterIds: charIds,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await addSceneEvent(newScene);
          results.push(`✅ 씬 **${tc.args.title}** 추가 완료`);
        } else if (tc.name === 'add_episode') {
          const chapterNum = (currentProject?.episodes?.length || 0) + 1;
          const newEp = {
            id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
            title: tc.args.title,
            content: tc.args.content || '',
            chapterNumber: chapterNum,
            scenes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await addEpisode(newEp);
          results.push(`✅ 회차 **${chapterNum}화 ${tc.args.title}** 추가 완료`);
        } else if (tc.name === 'write_episode_content') {
          const eps = currentProject?.episodes || [];
          const targetEp = tc.args.episode_title
            ? eps.find((e: any) => e.title === tc.args.episode_title)
            : eps[eps.length - 1];
          if (targetEp) {
            const newContent = tc.args.append
              ? (targetEp.content || '') + '\n\n' + tc.args.content
              : tc.args.content;
            await updateEpisode(targetEp.id, { content: newContent });
            results.push(`✅ **${targetEp.title}** 내용 저장 완료 (${tc.args.content.length}자)`);
          } else {
            // 회차가 없으면 새로 만들어서 저장
            const chapterNum = (currentProject?.episodes?.length || 0) + 1;
            const title = tc.args.episode_title || `${chapterNum}화`;
            const newEp = {
              id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
              title,
              content: tc.args.content,
              chapterNumber: chapterNum,
              scenes: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await addEpisode(newEp);
            results.push(`✅ 새 회차 **${title}** 생성 및 내용 저장 완료`);
          }
        }
      } catch (err: any) {
        results.push(`⚠️ ${tc.name} 실행 실패: ${err.message || err}`);
      }
    }
    return results;
  };

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

      // tool call 실행 (에이전트 저장)
      let toolResults: string[] = [];
      if (Array.isArray(data.toolCalls) && data.toolCalls.length > 0) {
        toolResults = await executeToolCalls(data.toolCalls);
      }

      // 메시지 조합: AI 답변 + 도구 실행 결과
      const replyParts: string[] = [];
      if (data.reply) replyParts.push(data.reply);
      if (toolResults.length > 0) replyParts.push(toolResults.join('\n'));

      const assistantMsg: Message = {
        id: Date.now().toString() + '-a',
        role: 'assistant',
        content: replyParts.join('\n\n') || '(작업 완료)',
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: Date.now().toString() + '-e',
        role: 'assistant',
        content: `오류: ${err.message}`,
      };
      setMessages(prev => [...prev, errMsg]);
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

  const contextSummary = [
    currentProject.characters.length > 0 && `캐릭터 ${currentProject.characters.length}명`,
    (currentProject.settingData?.characters?.length ?? 0) > 0 && `설정 데이터`,
    (currentProject.timeline?.events?.length ?? 0) > 0 && `씬 ${currentProject.timeline.events.length}개`,
    currentProject.worldSetting && '원문 텍스트',
  ].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">💬 AI 창작 어시스턴트</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{currentProject.title}</p>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {contextSummary ? `RAG 컨텍스트: ${contextSummary}` : '컨텍스트 없음 (텍스트 에디터에서 저장 필요)'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">💬</p>
            <p className="text-gray-600 dark:text-gray-400 font-medium">프로젝트 컨텍스트 기반 AI 어시스턴트</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              캐릭터, 세계관, 씬 정보를 바탕으로 창작을 도와드립니다.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
              {[
                '이 스토리의 주인공을 한 문장으로 소개해줘',
                '현재 캐릭터들 간의 관계를 설명해줘',
                '다음 씬을 위한 아이디어를 제안해줘',
                '스토리의 복선이나 모순점을 찾아줘',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left text-sm px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문이나 요청을 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
            rows={2}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm disabled:cursor-not-allowed"
          >
            전송
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 px-1">
          대화를 초기화하려면 페이지를 새로고침하세요.
        </p>
      </div>
    </div>
  );
}
