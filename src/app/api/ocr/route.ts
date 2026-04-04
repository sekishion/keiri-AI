import { NextRequest, NextResponse } from 'next/server';
import { deepseek } from '@/lib/deepseek';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // base64 image data

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `あなたはレシート・領収書の読み取りAIです。
画像の説明テキストから、以下の情報を抽出してJSON形式で返してください。

{
  "amount": 数値（税込金額）,
  "store": "店名",
  "date": "YYYY-MM-DD形式の日付",
  "category": "勘定科目（会議費/交際費/消耗品費/旅費交通費/通信費/地代家賃/水道光熱費/その他）",
  "categoryLabel": "カテゴリの日本語ラベル",
  "items": ["品目1", "品目2"],
  "confidence": 0.0〜1.0の確信度
}

情報が読み取れない場合はnullを入れてください。`
        },
        {
          role: 'user',
          content: `以下のレシート画像の内容を読み取ってください:\n\n${image}`
        }
      ],
      temperature: 0.1,
      max_tokens: 512,
    });

    const content = response.choices[0]?.message?.content || '{}';

    // JSONを抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      } catch {
        return NextResponse.json({ error: 'レシートの読み取り結果の解析に失敗しました' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'レシートの読み取りに失敗しました' }, { status: 400 });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: 'レシートの読み取りに失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}
