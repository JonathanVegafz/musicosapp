import { describe, it, expect } from 'vitest';
import { transposeChord, transposeKey } from './chord-transpose';

describe('transposeChord', () => {
  it('returns the chord unchanged when semitones is 0', () => {
    expect(transposeChord('C#', 0)).toBe('C#');
  });

  it('simplifies a double-sharp result to its natural spelling', () => {
    // C# down a tritone naively spells as F## (diminished 5th); should simplify to G.
    expect(transposeChord('C#', -6)).toBe('G');
    expect(transposeChord('D#', -6)).toBe('A');
    expect(transposeChord('G#', -6)).toBe('D');
  });

  it('simplifies double sharps on both root and bass of a slash chord', () => {
    // Reproduces the "Digno" bug: G#/C transposed -6 naively spells C##/F#.
    expect(transposeChord('G#/C', -6)).toBe('D/F#');
  });

  it('keeps existing enharmonic behavior for simple sharp transposition', () => {
    expect(transposeChord('G', 1)).toBe('Ab');
    expect(transposeChord('G', -1)).toBe('F#');
  });

  it('leaves legitimate single accidentals untouched', () => {
    expect(transposeChord('F#', 0)).toBe('F#');
    expect(transposeChord('C', 2)).toBe('D');
  });
});

describe('transposeKey', () => {
  it('returns the key unchanged when semitones is 0', () => {
    expect(transposeKey('Bm', 0)).toBe('Bm');
  });

  it('transposes minor keys correctly instead of leaving them unchanged', () => {
    expect(transposeKey('Bm', 2)).toBe('C#m');
    expect(transposeKey('F#m', 1)).toBe('Gm');
  });

  it('simplifies a double-sharp key result to its natural spelling', () => {
    expect(transposeKey('C#', -6)).toBe('G');
  });

  it('transposes major keys as before', () => {
    expect(transposeKey('G', 2)).toBe('A');
  });
});
