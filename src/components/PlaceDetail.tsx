'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MenuItem, Place } from '@/types/place';
import { getCategoryStyle } from '@/lib/categoryStyle';

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
  const [photoUrl, setPhotoUrl] = useState(place.photo_url || '');
  const [menuPhotoUrl, setMenuPhotoUrl] = useState(place.menu_photo_url || '');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(place.menu_items || []);
  const [price, setPrice] = useState<number | undefined>(place.price);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingMenuPhoto, setUploadingMenuPhoto] = useState(false);
  const [analyzingMenu, setAnalyzingMenu] = useState(false);
  const [menuExtractionComplete, setMenuExtractionComplete] = useState(
    (place.menu_items?.length || 0) > 0
  );
  const [menuError, setMenuError] = useState('');
  const [menuNote, setMenuNote] = useState('');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [menuPhotoExpanded, setMenuPhotoExpanded] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const menuPhotoInputRef = useRef<HTMLInputElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const catStyle = getCategoryStyle(place.category);

  const photos = [
    photoUrl ? { url: photoUrl, label: null as string | null } : null,
    menuPhotoUrl ? { url: menuPhotoUrl, label: '메뉴판' } : null,
  ].filter((p): p is { url: string; label: string | null } => p !== null);

  const currentPhoto = photos[photoIndex];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuPhotoExpanded(false);
    };

    if (menuPhotoExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuPhotoExpanded]);

  const goToPhoto = (index: number) => {
    if (photos.length === 0) return;
    setPhotoIndex(Math.max(0, Math.min(photos.length - 1, index)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) < 40) return;
    goToPhoto(photoIndex + (deltaX < 0 ? 1 : -1));
  };

  const stationMap: Record<string, string> = {
    '김포공항': '✈️',
    '마곡나루': '🚇',
    '디지털미디어시티': '🏢',
    '홍대입구': '🎨',
    '공덕': '🚉',
    '서울역': '🚄',
  };

  const handleVisitToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { error } = await supabase
        .from('places')
        .update({ last_visited: today })
        .eq('id', place.id);

      if (error) {
        console.error('Supabase error:', error);
        alert('방문 체크 저장 중 오류가 발생했습니다.');
        return;
      }

      setIsVisited(true);
      setVisitedToday(true);
    } catch (err) {
      console.error('Error:', err);
      alert('방문 체크 저장 중 오류가 발생했습니다.');
    }
  };

  const handleVisitCancel = async () => {
    try {
      const { error } = await supabase
        .from('places')
        .update({ last_visited: null })
        .eq('id', place.id);

      if (error) {
        console.error('Supabase error:', error);
        alert('방문 취소 중 오류가 발생했습니다.');
        return;
      }

      setIsVisited(false);
      setVisitedToday(false);
    } catch (err) {
      console.error('Error:', err);
      alert('방문 취소 중 오류가 발생했습니다.');
    }
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

  const uploadAndSavePhoto = async (
    file: File,
    field: 'photo_url' | 'menu_photo_url',
    prefix: string,
    setUrl: (url: string) => void,
    setUploading: (uploading: boolean) => void
  ): Promise<boolean> => {
    setUploading(true);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${place.id}-${prefix}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('place-photos')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        console.error('Supabase storage error:', uploadError);
        alert('사진 업로드 중 오류가 발생했습니다.');
        return false;
      }

      const { data } = supabase.storage.from('place-photos').getPublicUrl(path);
      const url = data.publicUrl;

      const { error: updateError } = await supabase
        .from('places')
        .update({ [field]: url })
        .eq('id', place.id);

      if (updateError) {
        console.error('Supabase error:', updateError);
        alert('사진 저장 중 오류가 발생했습니다.');
        return false;
      }

      setUrl(url);
      return true;
    } catch (err) {
      console.error('Photo upload error:', err);
      alert('사진 업로드 중 오류가 발생했습니다.');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    uploadAndSavePhoto(file, 'photo_url', 'main', setPhotoUrl, setUploadingPhoto);
  };

  const readFileAsBase64 = (file: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleMenuPhotoOnlyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setMenuError('');
    setMenuNote('');
    const uploaded = await uploadAndSavePhoto(
      file,
      'menu_photo_url',
      'menu',
      setMenuPhotoUrl,
      setUploadingMenuPhoto
    );
    if (!uploaded) return;

    const { error } = await supabase
      .from('places')
      .update({ menu_items: null, price: null })
      .eq('id', place.id);

    if (error) {
      console.error('Supabase error:', error);
      setMenuError('기존 메뉴 정보 초기화 중 오류가 발생했습니다.');
      return;
    }

    setMenuItems([]);
    setPrice(undefined);
    setMenuExtractionComplete(false);
  };

  const handleMenuExtraction = async () => {
    if (!menuPhotoUrl) return;
    setAnalyzingMenu(true);
    setMenuError('');
    setMenuNote('');
    try {
      const menuPhotoResponse = await fetch(menuPhotoUrl);
      if (!menuPhotoResponse.ok) throw new Error('Unable to read menu photo');

      const image = await readFileAsBase64(await menuPhotoResponse.blob());
      const res = await fetch('/api/gemini-menu-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          mimeType: menuPhotoResponse.headers.get('content-type') || 'image/jpeg',
          category: place.category,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMenuError(data.error || '메뉴 분석 중 오류가 발생했습니다.');
        return;
      }

      const items: MenuItem[] = Array.isArray(data.items) ? data.items : [];
      const pricePerPerson = typeof data.price_per_person === 'number' ? data.price_per_person : null;
      const { error } = await supabase
        .from('places')
        .update({
          menu_items: items.length > 0 ? items : null,
          ...(pricePerPerson != null ? { price: pricePerPerson } : {}),
        })
        .eq('id', place.id);

      if (error) {
        console.error('Supabase error:', error);
        setMenuError('분석 결과 저장 중 오류가 발생했습니다.');
        return;
      }

      setMenuItems(items);
      if (pricePerPerson != null) setPrice(pricePerPerson);
      setMenuExtractionComplete(true);
      setMenuNote(
        pricePerPerson != null
          ? `대표 메뉴 ${items.length}개와 1인 예상 가격 ${pricePerPerson.toLocaleString()}원을 저장했어요.`
          : data.note || '대표 메뉴를 저장했어요.'
      );
    } catch (err) {
      console.error('Menu analysis error:', err);
      setMenuError('메뉴 분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzingMenu(false);
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
        <div className="detail-header-actions" style={{ position: 'relative' }}>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
          <input
            ref={menuPhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleMenuPhotoOnlyChange}
            style={{ display: 'none' }}
          />
          <button
            className="detail-icon-btn"
            title="더보기"
            onClick={() => setMoreMenuOpen((v) => !v)}
            disabled={uploadingPhoto || uploadingMenuPhoto || analyzingMenu}
          >
            {uploadingPhoto || uploadingMenuPhoto || analyzingMenu ? '⏳' : '⋮'}
          </button>
          {moreMenuOpen && (
            <div className="more-menu">
              <button
                type="button"
                className="more-menu-item"
                onClick={() => {
                  setMoreMenuOpen(false);
                  photoInputRef.current?.click();
                }}
              >
                📷 대표 사진 등록
              </button>
              <button
                type="button"
                className="more-menu-item"
                onClick={() => {
                  setMoreMenuOpen(false);
                  menuPhotoInputRef.current?.click();
                }}
              >
                🧾 메뉴판 등록
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="detail-content">
        {/* 가게 이미지 영역 */}
        {photos.length > 0 ? (
          <div
            className="detail-image-placeholder detail-photo-carousel"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img src={currentPhoto.url} alt={currentPhoto.label || place.name} />
            {currentPhoto.label && (
              <>
                <span className="photo-label-badge">{currentPhoto.label}</span>
                <button
                  type="button"
                  className="menu-photo-expand-btn"
                  onClick={() => setMenuPhotoExpanded(true)}
                  aria-label="메뉴판 크게 보기"
                  title="메뉴판 크게 보기"
                >
                  +
                </button>
              </>
            )}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-prev"
                  onClick={() => goToPhoto(photoIndex - 1)}
                  style={{ visibility: photoIndex === 0 ? 'hidden' : 'visible' }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-next"
                  onClick={() => goToPhoto(photoIndex + 1)}
                  style={{ visibility: photoIndex === photos.length - 1 ? 'hidden' : 'visible' }}
                >
                  ›
                </button>
                <div className="carousel-dots">
                  {photos.map((_, i) => (
                    <span key={i} className={`carousel-dot ${i === photoIndex ? 'active' : ''}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            className="detail-image-placeholder"
            style={{
              background: `linear-gradient(135deg, ${catStyle.bg} 0%, var(--background) 100%)`,
            }}
          >
            <div className="detail-image-icon">{catStyle.emoji}</div>
          </div>
        )}

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
                <span className="meta-value" style={{ color: catStyle.color, fontWeight: 700 }}>
                  {catStyle.emoji} {place.category}
                </span>
              </div>
            )}
            {place.walk_minutes && (
              <div className="meta-item">
                <span className="meta-label">도보</span>
                <span className="meta-value">약 {place.walk_minutes}분</span>
              </div>
            )}
            {price && (
              <div className="meta-item">
                <span className="meta-label">가격</span>
                <span className="meta-value">
                  {price.toLocaleString()}원{place.category !== '카페' ? '/인' : ''}
                </span>
              </div>
            )}
            {place.address && (
              <div className="meta-item">
                <span className="meta-label">주소</span>
                <span className="meta-value">{place.address}</span>
              </div>
            )}
            {place.phone && (
              <div className="meta-item">
                <span className="meta-label">전화</span>
                <span className="meta-value">
                  <a href={`tel:${place.phone}`}>{place.phone}</a>
                </span>
              </div>
            )}
          </div>

          {place.tags && place.tags.length > 0 && (
            <div className="detail-tags">
              {place.tags.map((tag) => (
                <span key={tag} className={`detail-tag tag-${tag}`}>
                  {tag === '로컬' && '🏠'}
                  {tag === '느좋' && '✨'}
                  {tag === '블로거' && '📸'}
                  {' '}{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 메뉴 */}
        {(menuPhotoUrl || menuItems.length > 0 || menuError || menuNote) && (
          <div className="detail-section">
            <h2 className="section-title">메뉴</h2>
            {menuPhotoUrl && !menuExtractionComplete && (
              <button
                type="button"
                className="menu-photo-btn"
                onClick={handleMenuExtraction}
                disabled={analyzingMenu}
              >
                {analyzingMenu ? '✨ 메뉴판 분석 중...' : '✨ 메뉴판 추출'}
              </button>
            )}
            {menuError && <p className="search-error">{menuError}</p>}
            {menuNote && <p className="search-hint">{menuNote}</p>}
            {menuItems.length > 0 && (
              <ul className="menu-items-preview">
                {menuItems.map((item, i) => (
                  <li key={i}>
                    <span>{item.name}</span>
                    <span>{item.price != null ? `${item.price.toLocaleString()}원` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 카카오맵 */}
        <a
          href={`https://map.kakao.com/?q=${encodeURIComponent(place.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="kakao-map-btn"
        >
          🗺️ 카카오맵에서 보기
        </a>

        {/* 방문 체크 */}
        {!isVisited && (
          <button className="visit-check-btn" onClick={handleVisitToday}>
            ✅ 오늘 방문했어요
          </button>
        )}
        {isVisited && (
          <button
            type="button"
            className="visit-badge visit-cancel-btn"
            onClick={handleVisitCancel}
            title="잘못 눌렀다면 다시 눌러 방문을 취소하세요"
          >
            ✅ 방문 완료 · 다시 누르면 취소
          </button>
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

      {menuPhotoExpanded && menuPhotoUrl && (
        <div
          className="menu-photo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="확대된 메뉴판"
          onClick={() => setMenuPhotoExpanded(false)}
        >
          <button
            type="button"
            className="menu-photo-close-btn"
            onClick={() => setMenuPhotoExpanded(false)}
            aria-label="메뉴판 닫기"
          >
            ×
          </button>
          <img
            src={menuPhotoUrl}
            alt={`${place.name} 메뉴판`}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
