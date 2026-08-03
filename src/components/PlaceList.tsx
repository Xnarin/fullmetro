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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const filtered = useMemo(() => {
    return places.filter((place) => {
      // 검색어
      if (searchQuery.trim() && !place.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
        return false;
      }

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
  }, [places, searchQuery, selectedStation, selectedPrice]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // 미방문(null) 맨 뒤, 방문한 것들은 별점 높은 순
      const aRating = a.last_visited ? (a.rating || 0) : -1;
      const bRating = b.last_visited ? (b.rating || 0) : -1;
      return bRating - aRating;
    });
  }, [filtered]);

  return (
    <div className="place-list-container">
      <header className="list-header">
        {searchOpen ? (
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="맛집 이름 검색"
              className="search-input"
            />
            <button className="icon-btn" title="검색 닫기" onClick={closeSearch}>
              ✕
            </button>
          </div>
        ) : (
          <>
            <div className="header-title">
              <h1>Fullmetro</h1>
              <p>공철의 연금술사</p>
            </div>
            <div className="header-actions">
              <button className="icon-btn" title="검색" onClick={() => setSearchOpen(true)}>
                🔍
              </button>
            </div>
          </>
        )}
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

      <button className="fab-add-btn" onClick={() => router.push('/add')}>
        ➕ 등록
      </button>
    </div>
  );
}
