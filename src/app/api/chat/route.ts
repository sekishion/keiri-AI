import { NextRequest, NextResponse } from 'next/server';
import { deepseek, SYSTEM_PROMPT } from '@/lib/deepseek';

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const systemMessage = context
      ? `${SYSTEM_PROMPT}\n\n## 現在の経営データ\n${context}`
      : SYSTEM_PROMPT;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemMessage },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    });

    const content = response.choices[0]?.message?.content || 'すみません、回答を生成できませんでした。';

    return NextResponse.json({ content });
  } catch (error) {
    console.error('DeepSeek API error:', error);
    return NextResponse.json(
      { error: 'AIへの接続に失敗しました。しばらく待ってから再度お試しください。' },
      { status: 500 }
    );
  }
}
