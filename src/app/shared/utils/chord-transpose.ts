import { Chord, Interval, Note } from 'tonal';

/**
 * `Interval.fromSemitones()` always picks one fixed interval quality per
 * semitone distance (e.g. a diminished 5th for ±6), regardless of how the
 * input note is spelled. Applied to a note that already has a sharp/flat,
 * that can force a double accidental (C# -> F##) or an awkward enharmonic
 * (B -> E#) instead of the simplest spelling. `Note.simplify` collapses
 * those back to standard notation without touching legitimate single
 * accidentals (F#, Bb, etc. pass through unchanged).
 */
function simplifyNote(note: string): string {
  return Note.simplify(note) || note;
}

export function transposeChord(chord: string, semitones: number): string {
  if (!chord || semitones === 0) return chord;
  try {
    const interval = Interval.fromSemitones(semitones);
    const transposed = Chord.transpose(chord, interval);
    if (!transposed) return chord;
    const [tonic, type, bass] = Chord.tokenize(transposed);
    if (!tonic) return transposed;
    const bassPart = bass ? '/' + simplifyNote(bass) : '';
    return simplifyNote(tonic) + type + bassPart;
  } catch {
    return chord;
  }
}

export function transposeKey(key: string, semitones: number): string {
  if (!key || semitones === 0) return key;
  try {
    const interval = Interval.fromSemitones(semitones);
    const minorMatch = /^(.+)m$/.exec(key);
    const root = minorMatch ? minorMatch[1] : key;
    const transposed = Note.transpose(root, interval);
    if (!transposed) return key;
    return simplifyNote(transposed) + (minorMatch ? 'm' : '');
  } catch {
    return key;
  }
}
