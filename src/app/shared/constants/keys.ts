/**
 * Canonical list of musical keys used across the app (library filter and song
 * form). Includes both sharps and enharmonic flats so a song saved in e.g. `Db`
 * can be filtered in the library. Major keys first, then minor keys.
 */
export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
] as const;

export type MusicalKey = (typeof MUSICAL_KEYS)[number];
