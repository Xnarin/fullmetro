export interface CategoryStyle {
  emoji: string;
  bg: string;
  color: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  한식: { emoji: '🍚', bg: '#FDECE3', color: '#B8490C' },
  카페: { emoji: '☕', bg: '#F1E7D8', color: '#7C5A3A' },
  일식: { emoji: '🍣', bg: '#FDE3EA', color: '#B0245A' },
  중식: { emoji: '🥟', bg: '#FDE8D6', color: '#C2410C' },
  양식: { emoji: '🍝', bg: '#FBE7E7', color: '#B8322A' },
  분식: { emoji: '🍢', bg: '#FCE3EF', color: '#AD1457' },
  패스트푸드: { emoji: '🍔', bg: '#FFF1D6', color: '#B4650A' },
  기타: { emoji: '🍽️', bg: '#EFEAE2', color: '#6B6259' },
};

const DEFAULT_STYLE = CATEGORY_STYLES['기타'];

export function getCategoryStyle(category?: string | null): CategoryStyle {
  if (!category) return DEFAULT_STYLE;
  return CATEGORY_STYLES[category] || DEFAULT_STYLE;
}
