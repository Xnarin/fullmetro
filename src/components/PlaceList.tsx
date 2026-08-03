'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Place } from '@/types/place';
import PlaceCard from './PlaceCard';

interface PlaceListProps {
  places: Place[];
}

type StationType = '전체' | '김포공항' | '마곡나루' | '디지털미디어시티' | '홍대입구' | '공덕' | '서울역';
type PriceRangeType = '전체' | '~1만' | '1~2만' | '2만~';

const STATIONS: StationType[] = ['전체', '김포공항', '마곡나루', '디지털미디어시티', '홍대입구', '공덕', '서울역'];
const PRICE_RANGES: PriceRangeType[] = ['전체', '~1만', '1~2만', '2만~'];

export default function PlaceList({ places }: PlaceListProps) {
  const router = useRouter();
  const [selectedStation, setSelectedStation] = useState<StationType>('전체');
  const [selectedPrice, setSelectedPrice] = useState<PriceRangeType>('전체');

  const filtered = useMemo(() => {
    return places.filter((place) => {
      // 역 필터
      if (selectedStation !== '전체' && place.station !== selectedStation) {
        return false;
      }

      // 가격대 필터
      if (selectedPrice !== '전체') {
        const price = place.price || 0;
        if (selectedPrice === '~1만' && price >= 10000) return false;
        if (selectedPrice === '1~2만' && (price < 10000 || price > 20000)) return false;
        if (selectedPrice === '2만~' && price <= 20000) return false;
      }

      return true;
    });
  }, [places, selectedStation, selectedPrice]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // 미방문(null) 맨 뒤, 방문한 것들은 별점 높은 순
      const aRating = a.last_visited ? (a.rating || 0) : -1;
      const bRating = b.last_visited ? (b.rating || 0) : -1;
      return bRating - aRating;
    });
  }, [filtered]);

  const unvisitedCount = sorted.filter((p) => !p.last_visited).length;

  const handleRecommend = () => {
    // 선택한 역에서 미방문 음식점 찾기
    const available = selectedStation === '전체'
      ? sorted.filter((p) => !p.last_visited)
      : places.filter((p) => p.station === selectedStation && !p.last_visited);

    if (available.length > 0) {
      const random = available[Math.floor(Math.random() * available.length)];
      alert(`추천: ${random.name} (${random.station})`);
    } else {
      // 미방문이 없으면 별점 4.0 이상 중 랜덤
      const highRated = selectedStation === '전체'
        ? sorted.filter((p) => (p.rating || 0) >= 4.0)
        : places.filter((p) => p.station === selectedStation && (p.rating || 0) >= 4.0);

      if (highRated.length > 0) {
        const random = highRated[Math.floor(Math.random() * highRated.length)];
        alert(`추천: ${random.name} (${random.station})`);
      } else {
        alert('추천할 곳이 없습니다.');
      }
    }
  };

  return (
    <div className="place-list-container">
      <header className="list-header">
        <div className="header-title">
          <h1>Fullmetro</h1>
          <p>공철의 연금술사</p>
        </div>
        <div className="header-actions">
          <button className="icon-btn" title="검색">🔍</button>
          <button className="icon-btn" title="메뉴">☰</button>
        </div>
      </header>

      <div className="filters">
        <div className="station-filter">
          {STATIONS.map((station) => (
            <button
              key={station}
              className={`filter-btn station ${selectedStation === station ? 'active' : ''}`}
              onClick={() => setSelectedStation(station)}
            >
              {station}
            </button>
          ))}
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>가격대</label>
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value as PriceRangeType)}
              className="price-filter"
            >
              {PRICE_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          <button className="recommend-btn" onClick={handleRecommend}>
            🎲 추천
          </button>

          <button className="add-btn" onClick={() => router.push('/add')}>
            ➕ 등록
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <p>조건에 맞는 맛집이 없습니다.</p>
        </div>
      ) : (
        <div className="places-grid">
          {sorted.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}
