export interface Place {
  id: number;
  name: string;
  station: string;
  category?: string;
  address?: string;
  phone?: string;
  photo_url?: string;
  tags: string[];
  walk_minutes?: number;
  price?: number;
  rating?: number;
  wait_minutes?: number;
  last_visited?: string;
  memo?: string;
  created_at: string;
}
