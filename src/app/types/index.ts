export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  bpm: number;
  capo: number;
  youtube?: string;
  content: string;
  createdAt: string;
  tags?: string[];
}

export interface Setlist {
  id: string;
  name: string;
  date?: string;
  description?: string;
  songs: SetlistSong[];
  createdAt: string;
}

export interface SetlistSong {
  songId: string;
  order: number;
  transposedKey?: string;
  notes?: string;
}

export type FontSize = 'normal' | 'large' | 'xlarge';
