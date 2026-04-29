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

export type TrackType =
  | 'click'
  | 'drums'
  | 'bass'
  | 'guitar-electric'
  | 'guitar-acoustic'
  | 'keys'
  | 'pads'
  | 'vocals'
  | 'other';

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  fileName: string;
  volume: number; // 0–100
  muted: boolean;
  solo: boolean;
}

export interface MixerPreset {
  id: string;
  name: string;
  trackStates: Record<string, { volume: number; muted: boolean }>;
}

export interface MultitrackConfig {
  songId: string;
  tracks: Track[];
  presets: MixerPreset[];
  updatedAt: string;
}
