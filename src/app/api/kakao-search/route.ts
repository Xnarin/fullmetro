import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if (!kakaoKey) {
    return NextResponse.json(
      { error: "KAKAO_REST_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query.trim());
  url.searchParams.set("size", "5");

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${kakaoKey}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Kakao API error:", res.status, text);
    return NextResponse.json(
      { error: "Kakao API request failed" },
      { status: 502 }
    );
  }

  const data = await res.json();

  const results = (data.documents || []).map((doc: Record<string, string>) => ({
    name: doc.place_name,
    address: doc.road_address_name || doc.address_name,
    phone: doc.phone || null,
    category: doc.category_name,
  }));

  return NextResponse.json({ results });
}
