import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==================== Tool 정의 ====================
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'add_character',
      description: '새 캐릭터를 프로젝트에 추가합니다.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '캐릭터 이름' },
          role: { type: 'string', description: '역할 (주인공, 악당, 조력자 등)' },
          description: { type: 'string', description: '한 줄 설명' },
          appearance: { type: 'string', description: '외모/특징' },
          personality: { type: 'string', description: '성격/특성' },
          backstory: { type: 'string', description: '배경 스토리' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_scene',
      description: '스토리보드에 새 씬을 추가합니다.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '씬 제목' },
          description: { type: 'string', description: '씬 설명' },
          timestamp: { type: 'number', description: '씬이 일어나는 시간대 (분 단위)' },
          character_names: {
            type: 'array',
            items: { type: 'string' },
            description: '이 씬에 등장하는 캐릭터 이름 목록',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_episode',
      description: '소설에 새 회차(챕터)를 추가합니다.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '회차 제목' },
          content: { type: 'string', description: '회차 내용 (소설 본문)' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_episode_content',
      description: '특정 회차의 소설 본문을 작성하거나 이어 씁니다. 기존 내용이 있으면 이어 씁니다.',
      parameters: {
        type: 'object',
        properties: {
          episode_title: { type: 'string', description: '내용을 작성할 회차 제목 (없으면 새로 만듦)' },
          content: { type: 'string', description: '작성할 소설 본문' },
          append: { type: 'boolean', description: '기존 내용에 이어 쓰기 (true) 또는 대체하기 (false). 기본값 false.' },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_consistency',
      description: '현재 소설 텍스트의 일관성을 검사합니다.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

// ==================== 시스템 프롬프트 ====================
function buildSystemPrompt(ctx: any): string {
  const lines: string[] = [
    '당신은 창작 스튜디오의 AI 창작 어시스턴트입니다. 사용자의 소설/스토리 창작을 적극적으로 돕습니다.',
    '제공된 도구(tool)를 사용해 실제로 캐릭터 추가, 씬 추가, 소설 작성 등을 수행할 수 있습니다.',
    '사용자가 "~해줘", "~만들어줘" 등을 요청하면 적극적으로 도구를 사용하세요.',
    '',
  ];

  if (ctx.projectTitle) {
    lines.push(`## 프로젝트: ${ctx.projectTitle}`);
    if (ctx.projectDescription) lines.push(`설명: ${ctx.projectDescription}`);
    lines.push('');
  }

  const chars = ctx.settingData?.characters || ctx.characters || [];
  if (chars.length > 0) {
    lines.push('## 등장인물');
    for (const c of chars) {
      const traits = c.appearance || (Array.isArray(c.traits) ? c.traits.join(', ') : '');
      lines.push(
        `- **${c.name}** (${c.role || '역할 미상'}): ${c.description || ''}` +
        (traits ? ` | 외모: ${traits}` : '') +
        (c.personality ? ` | 성격: ${c.personality}` : '') +
        (c.backstory ? ` | 배경: ${c.backstory}` : '')
      );
    }
    lines.push('');
  }

  const world = ctx.settingData?.world || [];
  if (world.length > 0) {
    lines.push('## 세계관 설정');
    for (const w of world) {
      if (typeof w === 'string') lines.push(`- ${w}`);
      else if (w.name) lines.push(`- ${w.name}: ${w.description || ''}`);
    }
    lines.push('');
  }

  const events: any[] = ctx.sceneEvents || [];
  if (events.length > 0) {
    lines.push('## 스토리보드');
    for (const e of events.slice(0, 20)) {
      lines.push(`- [${e.timestamp ?? 0}분] **${e.title}**: ${e.description || ''}`);
    }
    lines.push('');
  }

  const episodes: any[] = ctx.episodes || [];
  if (episodes.length > 0) {
    lines.push('## 회차 목록');
    for (const ep of episodes) {
      lines.push(`- ${ep.chapterNumber ? ep.chapterNumber + '화' : ''} ${ep.title}${ep.content ? ' (내용 있음)' : ''}`);
    }
    lines.push('');
  }

  if (ctx.worldSetting) {
    const ws: string = ctx.worldSetting;
    const maxLen = 2000;
    const truncated = ws.length > maxLen ? ws.slice(0, maxLen) + '\n...(이하 생략)' : ws;
    lines.push('## 원문 텍스트 (발췌)');
    lines.push(truncated);
    lines.push('');
  }

  lines.push('위 정보를 바탕으로 도움을 주세요. 한국어로 답변하세요.');
  return lines.join('\n');
}

// ==================== API Route ====================
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
      tools,
      tool_choice: 'auto',
      max_tokens: 3000,
      temperature: 0.7,
    });

    const choice = completion.choices[0];
    const reply = choice.message.content || '';
    const toolCalls = choice.message.tool_calls || [];

    // tool_calls를 파싱해서 반환
    const parsedToolCalls = toolCalls.map((tc: any) => ({
      id: tc.id,
      name: tc.function?.name,
      args: JSON.parse(tc.function?.arguments || '{}'),
    }));

    return NextResponse.json({ reply, toolCalls: parsedToolCalls });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: err?.message || '알 수 없는 오류' }, { status: 500 });
  }
}
