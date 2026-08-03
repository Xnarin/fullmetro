'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const STATIONS = ['김포공항', '마곡나루', '디지털미디어시티', '홍대입구', '공덕', '서울역'];
const CATEGORIES = ['한식', '카페', '일식', '중식', '양식', '분식', '패스트푸드', '기타'];
const TAGS = ['로컬', '느좋', '블로거'];

export default function AddPlaceForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    station: '',
    category: '',
    tags: [] as string[],
    walk_minutes: '',
    price: '',
    memo: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.station) {
      alert('이름과 역은 필수입니다.');
      return;
    }

    try {
      const { error } = await supabase
        .from('places')
        .insert([
          {
            name: formData.name.trim(),
            station: formData.station,
            category: formData.category || null,
            tags: formData.tags.length > 0 ? formData.tags : [],
            walk_minutes: formData.walk_minutes ? parseInt(formData.walk_minutes) : null,
            price: formData.price ? parseInt(formData.price) : null,
            memo: formData.memo.trim() || null,
          },
        ]);

      if (error) {
        console.error('Supabase error:', error);
        alert('저장 중 오류가 발생했습니다.');
        return;
      }

      alert(`'${formData.name}' 이(가) 등록되었습니다!`);
      router.push('/');
    } catch (err) {
      console.error('Error:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="add-place-container">
      <header className="add-header">
        <button className="back-btn" onClick={() => router.back()}>
          ←
        </button>
        <h1>맛집 등록</h1>
        <div style={{ width: '40px' }} />
      </header>

      <form onSubmit={handleSubmit} className="add-form">
        {/* 이름 */}
        <div className="form-group">
          <label htmlFor="name" className="label-required">
            이름
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="맛집 이름을 입력해주세요"
            className="form-input"
          />
        </div>

        {/* 역 */}
        <div className="form-group">
          <label htmlFor="station" className="label-required">
            역
          </label>
          <select
            id="station"
            name="station"
            value={formData.station}
            onChange={handleInputChange}
            className="form-select"
          >
            <option value="">역을 선택해주세요</option>
            {STATIONS.map((station) => (
              <option key={station} value={station}>
                {station}
              </option>
            ))}
          </select>
        </div>

        {/* 카테고리 */}
        <div className="form-group">
          <label htmlFor="category">카테고리</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="form-select"
          >
            <option value="">카테고리를 선택해주세요</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 태그 */}
        <div className="form-group">
          <label className="label-group">태그</label>
          <div className="checkbox-group">
            {TAGS.map((tag) => (
              <label key={tag} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.tags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">
                  {tag === '로컬' && '🏠'}
                  {tag === '느좋' && '✨'}
                  {tag === '블로거' && '📸'}
                  {' '}{tag}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 도보분 */}
        <div className="form-group">
          <label htmlFor="walk_minutes">도보 분</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="walk_minutes"
              name="walk_minutes"
              value={formData.walk_minutes}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              className="form-input number-input"
            />
            <span className="unit">분</span>
          </div>
        </div>

        {/* 1인 가격 */}
        <div className="form-group">
          <label htmlFor="price">1인 가격</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              className="form-input number-input"
            />
            <span className="unit">원</span>
          </div>
        </div>

        {/* 메모 */}
        <div className="form-group">
          <label htmlFor="memo">메모</label>
          <textarea
            id="memo"
            name="memo"
            value={formData.memo}
            onChange={handleInputChange}
            placeholder="메모를 입력해주세요 (선택사항)"
            className="form-textarea"
            rows={3}
          />
          <div className="char-count">
            {formData.memo.length} / 200
          </div>
        </div>

        {/* 저장 버튼 */}
        <button type="submit" className="submit-btn">
          저장
        </button>
      </form>
    </div>
  );
}
