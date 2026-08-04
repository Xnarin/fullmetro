import { NextRequest, NextResponse } from "next/server";

const PROMPT = `이 이미지는 식당 메뉴판이다. 메뉴판을 읽고 1인당 평균 식사 가격(원)을 추정해줘.
아래 JSON 형식으로만 답해라. 다른 텍스트는 절대 포함하지 마라.
{"price_per_person": 숫자 또는 null, "items": [{"name": "메뉴명", "price": 숫자}], "note": "간단한 설명"}

- price_per_person은 1인분 기준으로 가장 대표적인(일반적으로 주문하는) 메뉴 가격을 원 단위 정수로 추정해라.
- 이미지가 메뉴판이 아니거나 가격을 읽을 수 없으면 price_per_person을 null로 하고 note에 이유를 적어라.`;

export async function POST(request: NextRequest) {
  const geminiKey = process.env.GEMINI_KEY;
  if (!geminiKey) {
    return NextResponse.json(
      { error: "GEMINI_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: { image?: string; mimeType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  const { image, mimeType } = body;
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
                { text: PROMPT },
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

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Gemini menu price error:", err);
    return NextResponse.json(
      { error: "메뉴 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
