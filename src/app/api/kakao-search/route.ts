import { NextRequest, NextResponse } from "next/server";

const SEOUL_RECT = "126.73,37.41,127.20,37.72";

const STATION_COORDS: Record<string, { x: number; y: number }> = {
  김포공항: { x: 126.8014, y: 37.5629 },
  마곡나루: { x: 126.8262, y: 37.5652 },
  디지털미디어시티: { x: 126.9006, y: 37.5766 },
  홍대입구: { x: 126.9245, y: 37.5571 },
  공덕: { x: 126.9513, y: 37.5445 },
  서울역: { x: 126.9723, y: 37.5559 },
};

function haversineMeters(x1: number, y1: number, x2: number, y2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(y2 - y1);
  const dLng = toRad(x2 - x1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(y1)) * Math.cos(toRad(y2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  const station = request.nextUrl.searchParams.get("station");

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
  url.searchParams.set("rect", SEOUL_RECT);

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
  const stationCoord = station ? STATION_COORDS[station] : null;

  const results = (data.documents || [])
    .filter((doc: Record<string, string>) => {
      const addr = doc.road_address_name || doc.address_name || "";
      return addr.startsWith("서울");
    })
    .map((doc: Record<string, string>) => {
      const x = parseFloat(doc.x);
      const y = parseFloat(doc.y);
      let walk_minutes: number | null = null;

      if (stationCoord && !Number.isNaN(x) && !Number.isNaN(y)) {
        const meters = haversineMeters(stationCoord.x, stationCoord.y, x, y);
        walk_minutes = Math.max(1, Math.round(meters / 75));
      }

      return {
        name: doc.place_name,
        address: doc.road_address_name || doc.address_name,
        phone: doc.phone || null,
        category: doc.category_name,
        walk_minutes,
      };
    });

  return NextResponse.json({ results });
}
