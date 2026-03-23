import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ChordLyricsPair, ChordProParser, Song } from 'chordsheetjs';
import { Chord, Interval } from 'tonal';
import { FontSize } from '../../../types';

interface ChordItem {
  chord: string;
  lyric: string;
}

interface SheetLine {
  items: ChordItem[];
  isEmpty: boolean;
}

@Component({
  selector: 'app-chord-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }

    .sheet {
      font-family: var(--font-mono);
      line-height: 1.4;
    }

    .sheet.size-normal  { font-size: 1rem; }
    .sheet.size-large   { font-size: 1.3rem; }
    .sheet.size-xlarge  { font-size: 1.65rem; }

    .line {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 0.15em;
    }

    .line-empty {
      height: 1em;
      margin-bottom: 0.5em;
    }

    .chord-item {
      display: inline-flex;
      flex-direction: column;
      margin-right: 0.15em;
    }

    .chord {
      color: var(--accent-chord);
      font-weight: 700;
      font-size: 0.9em;
      line-height: 1.3;
      white-space: pre;
      min-width: 1ch;
    }

    .lyric {
      color: var(--text-primary);
      font-size: 1em;
      line-height: 1.5;
      white-space: pre;
    }
  `,
  template: `
    <div
      class="sheet"
      [class]="'sheet size-' + fontSize()"
      role="region"
      aria-label="Letra de la canción con acordes"
    >
      @for (line of lines(); track $index) {
        @if (line.isEmpty) {
          <div class="line-empty" aria-hidden="true"></div>
        } @else {
          <div class="line">
            @for (item of line.items; track $index) {
              <span class="chord-item">
                <span class="chord">{{ item.chord || '&nbsp;' }}</span>
                <span class="lyric">{{ item.lyric || ' ' }}</span>
              </span>
            }
          </div>
        }
      }
    </div>
  `,
})
export class ChordSheetComponent {
  readonly content = input.required<string>();
  readonly semitones = input<number>(0);
  readonly fontSize = input<FontSize>('normal');

  readonly lines = computed<SheetLine[]>(() => {
    const raw = this.content();
    const delta = this.semitones();
    if (!raw) return [];

    try {
      const parser = new ChordProParser();
      const song: Song = parser.parse(raw);
      const lines: SheetLine[] = [];

      for (const line of song.lines) {
        if (!line.items || line.items.length === 0) {
          lines.push({ items: [], isEmpty: true });
          continue;
        }

        const items: ChordItem[] = line.items
          .filter((item): item is ChordLyricsPair => item instanceof ChordLyricsPair)
          .map((item) => {
            const rawChord = item.chords ?? '';
            const transposed = delta !== 0 ? this.transposeChord(rawChord, delta) : rawChord;
            return {
              chord: transposed,
              lyric: item.lyrics ?? '',
            };
          });

        const isEmpty = items.length === 0 || items.every((i) => !i.chord && !i.lyric.trim());
        lines.push({ items, isEmpty });
      }

      return lines;
    } catch {
      // Fallback: renderiza el texto plano si el parse falla
      return raw.split('\n').map((text) => ({
        items: [{ chord: '', lyric: text }],
        isEmpty: text.trim() === '',
      }));
    }
  });

  private transposeChord(chord: string, semitones: number): string {
    if (!chord) return chord;
    try {
      const interval = Interval.fromSemitones(semitones);
      const result = Chord.transpose(chord, interval);
      return result || chord;
    } catch {
      return chord;
    }
  }
}
