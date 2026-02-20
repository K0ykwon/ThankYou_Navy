import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildSystemPrompt(ctx: any): string {
  const lines: string[] = [
    '당신은 창작 스튜디오의 AI 어시스턴트입니다. 사용자의 소설/스토리 창작을 돕습니다.',
    '아래는 현재 프로젝트의 설정 데이터입니다. 이를 참고해서 답변하세요.',
    '',
  ];

  if (ctx.projectTitle) {
    lines.push(`## 프로젝트: ${ctx.projectTitle}`);
    if (ctx.projectDescription) lines.push(`설명: ${ctx.projectDescription}`);
    lines.push('');
  }

  // Characters
  const chars = ctx.settingData?.characters || ctx.characters || [];
  if (chars.length > 0) {
    lines.push('## 등장인물');
    for (const c of chars) {
      const traits = Array.isArray(c.traits) ? c.traits.join(', ') : (c.appearance || '');
      lines.push(
        `- **${c.name}** (${c.role || '역할 미상'}): ${c.description || '설명 없음'}` +
        (traits ? ` | 특성: ${traits}` : '')
      );
    }
    lines.push('');
  }

  // World
  const world = ctx.settingData?.world || [];
  if (world.length > 0) {
    lines.push('## 세계관 설정');
    for (const w of world) {
      if (typeof w === 'string') lines.push(`- ${w}`);
      else if (w.name) lines.push(`- ${w.name}: ${w.description || ''}`);
    }
    lines.push('');
  }

  // Relations
  const relations = ctx.settingData?.relations || [];
  if (relations.length > 0) {
    lines.push('## 인물 관계');
    for (const r of relations) {
      if (r.from && r.to) lines.push(`- ${r.from} → ${r.to}: ${r.type || ''}`);
    }
    lines.push('');
  }

  // Plot threads
  const plots = ctx.settingData?.plot_threads || [];
  if (plots.length > 0) {
    lines.push('## 주요 플롯');
    for (const p of plots) {
      lines.push(`- ${typeof p === 'string' ? p : (p.description || JSON.stringify(p))}`);
    }
    lines.push('');
  }

  // Scene events / timeline
  const events: any[] = ctx.sceneEvents || [];
  if (events.length > 0) {
    lines.push('## 스토리보드 (씬 타임라인)');
    for (const e of events.slice(0, 30)) {
      lines.push(`- [${e.timestamp ?? 0}분] **${e.title}**: ${e.description || ''}`);
    }
    lines.push('');
  }

  // World setting text (truncated)
  if (ctx.worldSetting) {
    const ws: string = ctx.worldSetting;
    const maxLen = 3000;
    const truncated = ws.length > maxLen ? ws.slice(0, maxLen) + '\n...(이하 생략)' : ws;
    lines.push('## 원문 텍스트 (발췌)');
    lines.push(truncated);
    lines.push('');
  }

  lines.push('위 정보를 바탕으로 사용자의 창작 질문에 도움을 주세요. 한국어로 답변하세요.');

  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const systemContent = buildSystemPrompt(context || {});

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
      ...(messages || []).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      max_tokens: 2000,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || '';
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: err?.message || '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
