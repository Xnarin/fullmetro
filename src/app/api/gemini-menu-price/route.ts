import { NextRequest, NextResponse } from "next/server";

const getPrompt = (category?: string) => `이 이미지는 ${category === '카페' ? '카페' : '식당'} 메뉴판이다. 메뉴판을 읽고 1인당 평균 ${category === '카페' ? '음료' : '식사'} 가격(원)을 추정해줘.
아래 JSON 형식으로만 답해라. 다른 텍스트는 절대 포함하지 마라.
{"price_per_person": 숫자 또는 null, "items": [{"name": "메뉴명", "price": 숫자}], "note": "간단한 설명"}

- price_per_person은 1인 기준으로 가장 대표적인(일반적으로 주문하는) 메뉴 가격을 원 단위 정수로 추정해라.
${category === '카페'
  ? '- items에는 아메리카노, 시그니처 음료, 라테, 티, 시즌 음료 등 대표 음료를 중요도 순으로 최대 5개 넣어라. 샷·시럽 같은 추가 옵션, 병음료, 디저트는 제외해라.'
  : '- items에는 식당의 대표 메인 메뉴만 중요도 순으로 최대 5개 넣어라. 밑반찬, 음료, 주류, 세트 구성의 선택 항목, 추가 토핑 등 사이드 메뉴는 제외해라.'}
- 이미지가 메뉴판이 아니거나 가격을 읽을 수 없으면 price_per_person을 null로 하고 note에 이유를 적어라.`;

export async function POST(request: NextRequest) {
  const geminiKey = process.env.GEMINI_KEY;
  if (!geminiKey) {
    return NextResponse.json(
      { error: "GEMINI_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: { image?: string; mimeType?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  const { image, mimeType, category } = body;
  if (!image || !mimeType) {
    return NextResponse.json(
      { error: "image and mimeType are required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: getPrompt(category) },
                { inlineData: { mimeType, data: image } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Gemini API error:", res.status, text);
      return NextResponse.json(
        { error: "Gemini API request failed" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Gemini response missing text:", JSON.stringify(data));
      return NextResponse.json(
        { error: "Gemini로부터 응답을 받지 못했습니다." },
        { status: 502 }
      );
    }

    const parsed: { items?: unknown[]; [key: string]: unknown } = JSON.parse(text);
    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    const items = rawItems
          .filter(
            (item): item is { name: string; price: number } =>
              typeof item === 'object' &&
              item !== null &&
              typeof (item as { name?: unknown }).name === 'string' &&
              Number.isFinite((item as { price?: unknown }).price)
          )
          .slice(0, 5)
          .map((item) => ({ name: item.name.trim(), price: Math.round(item.price) }))

    return NextResponse.json({ ...parsed, items });
  } catch (err) {
    console.error("Gemini menu price error:", err);
    return NextResponse.json(
      { error: "메뉴 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
