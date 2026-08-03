import { supabase } from "@/lib/supabase";
import PlaceList from "@/components/PlaceList";
import { Place } from "@/types/place";

export default async function Home() {
  let places: Place[] = [];
  let error = null;

  try {
    const { data, error: err } = await supabase
      .from("places")
      .select("*")
      .order("rating", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (err) {
      console.error("Supabase error:", err);
      error = err;
    } else {
      places = (data as Place[]) || [];
    }
  } catch (e) {
    console.error("Error fetching places:", e);
    error = e;
  }

  if (error) {
    return (
      <main className="main-container">
        <div style={{ padding: '20px', color: '#ef4444' }}>
          <p>데이터를 불러올 수 없습니다.</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>{String(error)}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="main-container">
      <PlaceList places={places} />
    </main>
  );
}
