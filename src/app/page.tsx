import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: matjip } = await supabase
    .from("matjip")
    .select("*")
    .order("id");

  return (
    <main>
      <h1>맛집 도장깨기</h1>
      <ul>
        {matjip?.map((item) => (
          <li key={item.id}>{item.food}</li>
        ))}
      </ul>
    </main>
  );
}
