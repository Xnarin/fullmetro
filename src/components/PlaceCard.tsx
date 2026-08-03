'use client';

import Link from 'next/link';
import { Place } from '@/types/place';

interface PlaceCardProps {
  place: Place;
}

const STATION_ICONS: Record<string, string> = {
  '김포공항': '✈️',
  '마곡나루': '🚇',
  '디지털미디어시티': '🏢',
  '홍대입구': '🎨',
  '공덕': '🚉',
  '서울역': '🚄',
};

export default function PlaceCard({ place }: PlaceCardProps) {
  const isVisited = place.last_visited !== null;

  return (
    <Link href={`/detail/${place.id}`} className="place-card-link">
      <div className="place-card">
        <div className="card-header">
          <div className="card-icon" style={{ backgroundColor: '#1e3a8a' }}>
            <span style={{ fontSize: '24px' }}>🍽️</span>
          </div>
          <div className="card-title">
            <h3>{place.name}</h3>
            <div className="bookmark-btn" title="찜하기">♡</div>
          </div>
        </div>

        <div className="card-info">
          <div className="info-row">
            <span className="badge station">
              {STATION_ICONS[place.station] || '🚇'} {place.station}
            </span>
            {place.walk_minutes && (
              <span className="badge">🚶 {place.walk_minutes}분</span>
            )}
          </div>

          <div className="info-row">
            {place.category && (
              <span className="badge category">{place.category}</span>
            )}
            {place.price && (
              <span className="badge price">
                ₩ {place.price.toLocaleString()}
                {place.category === '카페' ? '' : '/인'}
              </span>
            )}
          </div>

          {place.tags && place.tags.length > 0 && (
            <div className="tags">
              {place.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag === '로컬' && '🏠'}
                  {tag === '느좋' && '✨'}
                  {tag === '블로거' && '📸'}
                  {' '}
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="card-rating">
          {isVisited ? (
            <div className="rating-visited">
              <div className="stars">
                {'⭐'.repeat(Math.round(place.rating || 0))}
                {place.rating && (
                  <span className="rating-score">{place.rating.toFixed(1)}</span>
                )}
              </div>
              {(place.wait_minutes === 0 || place.wait_minutes) && (
                <span className="wait-badge">
                  ⏱ {place.wait_minutes === 0 ? '바로입장' : `웨이팅 ${place.wait_minutes}분`}
                </span>
              )}
              <span className="visit-count">(방문함)</span>
            </div>
          ) : (
            <span className="not-visited">미방문</span>
          )}
        </div>
      </div>
    </Link>
  );
}
