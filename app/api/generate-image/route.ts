import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY가 설정되지 않았습니다. .env.local에 키를 추가해주세요.' },
      { status: 500 }
    );
  }

  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: 'prompt가 필요합니다.' }, { status: 400 });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.error?.message || `Gemini API 오류 (${response.status})` },
      { status: response.status }
    );
  }

  const data = await response.json();
  const parts: any[] = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData);

  if (!imagePart) {
    return NextResponse.json({ error: '이미지가 생성되지 않았습니다.' }, { status: 500 });
  }

  return NextResponse.json({
    imageData: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || 'image/png',
  });
}
