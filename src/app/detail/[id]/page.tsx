import { supabase } from '@/lib/supabase';
import PlaceDetail from '@/components/PlaceDetail';
import { Place } from '@/types/place';

export const dynamic = 'force-dynamic';

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const placeId = parseInt(id, 10);

  const { data: place, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', placeId)
    .single();

  if (error || !place) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
        <p>맛집을 찾을 수 없습니다.</p>
        {error && <p style={{ fontSize: '12px', color: '#9ca3af' }}>{error.message}</p>}
      </div>
    );
  }

  return <PlaceDetail place={place as Place} />;
}
