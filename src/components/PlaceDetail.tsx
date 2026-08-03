'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Place } from '@/types/place';

interface PlaceDetailProps {
  place: Place;
}

const WAIT_OPTIONS = [
  { value: 0, label: '바로' },
  { value: 10, label: '10분' },
  { value: 20, label: '20분' },
  { value: 30, label: '30분' },
  { value: 40, label: '40분+' },
];

export default function PlaceDetail({ place }: PlaceDetailProps) {
  const router = useRouter();
  const [rating, setRating] = useState(place.rating || 0);
  const [waitTime, setWaitTime] = useState<number | null>(place.wait_minutes ?? null);
  const [memo, setMemo] = useState(place.memo || '');
  const [isVisited, setIsVisited] = useState(!!place.last_visited);
  const [visitedToday, setVisitedToday] = useState(false);

  const stationMap: Record<string, string> = {
    '김포공항': '✈️',
    '마곡나루': '🚇',
    '디지털미디어시티': '🏢',
    '홍대입구': '🎨',
    '공덕': '🚉',
    '서울역': '🚄',
  };

  const handleVisitToday = () => {
    setIsVisited(true);
    setVisitedToday(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('places')
        .update({
          rating: rating > 0 ? rating : null,
          wait_minutes: waitTime,
          memo: memo || null,
          last_visited: visitedToday ? new Date().toISOString().split('T')[0] : place.last_visited,
        })
        .eq('id', place.id);

      if (error) {
        console.error('Supabase error:', error);
        alert('저장 중 오류가 발생했습니다.');
        return;
      }

      alert('저장되었습니다!');
    } catch (err) {
      console.error('Error:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (confirm(`'${place.name}'을(를) 삭제하시겠습니까?`)) {
      try {
        const { error } = await supabase
          .from('places')
          .delete()
          .eq('id', place.id);

        if (error) {
          console.error('Supabase error:', error);
          alert('삭제 중 오류가 발생했습니다.');
          return;
        }

        alert('삭제되었습니다.');
        router.push('/');
      } catch (err) {
        console.error('Error:', err);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="detail-container">
      <header className="detail-header">
        <button className="detail-back-btn" onClick={() => router.back()}>
          ←
        </button>
        <div className="detail-header-actions">
          <button className="detail-icon-btn" title="찜하기">
            ♡
          </button>
          <button className="detail-icon-btn" title="더보기">
            ⋮
          </button>
        </div>
      </header>

      <div className="detail-content">
        {/* 가게 이미지 영역 */}
        <div className="detail-image-placeholder">
          <div className="detail-image-icon">🍽️</div>
        </div>

        {/* 기본 정보 */}
        <div className="detail-info-section">
          <div className="detail-title-row">
            <h1>{place.name}</h1>
          </div>

          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">역</span>
              <span className="meta-value">
                {stationMap[place.station] || '🚇'} {place.station}
              </span>
            </div>
            {place.category && (
              <div className="meta-item">
                <span className="meta-label">카테고리</span>
                <span className="meta-value">{place.category}</span>
              </div>
            )}
            {place.walk_minutes && (
              <div className="meta-item">
                <span className="meta-label">도보</span>
                <span className="meta-value">약 {place.walk_minutes}분</span>
              </div>
            )}
            {place.price && (
              <div className="meta-item">
                <span className="meta-label">가격</span>
                <span className="meta-value">
                  {place.price.toLocaleString()}원{place.category !== '카페' ? '/인' : ''}
                </span>
              </div>
            )}
          </div>

          {place.tags && place.tags.length > 0 && (
            <div className="detail-tags">
              {place.tags.map((tag) => (
                <span key={tag} className="detail-tag">
                  {tag === '로컬' && '🏠'}
                  {tag === '느좋' && '✨'}
                  {tag === '블로거' && '📸'}
                  {' '}{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 방문 체크 */}
        {!isVisited && (
          <button className="visit-check-btn" onClick={handleVisitToday}>
            ✅ 오늘 방문했어요
          </button>
        )}
        {isVisited && (
          <div className="visit-badge">방문 완료</div>
        )}

        {/* 별점 */}
        <div className="detail-section">
          <h2 className="section-title">별점</h2>
          <div className="rating-input">
            <div className="stars-display">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${rating >= star ? 'filled' : ''}`}
                  onClick={() => setRating(rating === star ? 0 : star)}
                  title={`${star}점`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && <span className="rating-display">{rating.toFixed(1)}</span>}
          </div>
        </div>

        {/* 웨이팅 */}
        <div className="detail-section">
          <h2 className="section-title">웨이팅 시간</h2>
          <div className="wait-chips">
            {WAIT_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`wait-chip ${waitTime === option.value ? 'active' : ''}`}
                onClick={() => setWaitTime(waitTime === option.value ? null : option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 메모 */}
        <div className="detail-section">
          <h2 className="section-title">메모</h2>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value.slice(0, 500))}
            placeholder="메모를 입력해주세요"
            className="detail-memo"
            rows={3}
          />
          <div className="memo-count">{memo.length} / 500</div>
        </div>

        {/* 액션 버튼 */}
        <div className="detail-actions">
          <button className="detail-save-btn" onClick={handleSave}>
            ✏️ 저장
          </button>
          <button className="detail-delete-btn" onClick={handleDelete}>
            🗑️ 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
