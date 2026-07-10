import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ChordLyricsPair, ChordProParser, Song, Tag } from 'chordsheetjs';
import { FontSize } from '../../../types';
import { transposeChord } from '../../utils/chord-transpose';

interface ChordItem {
  chord: string;
  lyric: string;
}

interface SheetLine {
  items: ChordItem[];
  isEmpty: boolean;
  /** Section label from a ChordPro `{comment: ...}` directive, if any. */
  comment?: string;
  /** Whether any item on this line carries a chord (used by "chords only" mode). */
  hasChords: boolean;
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

    .section {
      color: var(--accent-chord);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: 0.8em;
      margin: 1em 0 0.35em;
      padding-bottom: 0.15em;
      border-bottom: 1px solid color-mix(in srgb, var(--accent-chord) 35%, transparent);
    }

    .section:first-child {
      margin-top: 0;
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
        @if (line.comment) {
          <div class="section">{{ line.comment }}</div>
        } @else if (line.isEmpty) {
          <div class="line-empty" aria-hidden="true"></div>
        } @else if (!chordsOnly() || line.hasChords) {
          <div class="line">
            @for (item of line.items; track $index) {
              <span class="chord-item">
                <span class="chord">{{ item.chord || '&nbsp;' }}</span>
                @if (!chordsOnly()) {
                  <span class="lyric">{{ item.lyric || ' ' }}</span>
                }
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
  readonly chordsOnly = input<boolean>(false);

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
          lines.push({ items: [], isEmpty: true, hasChords: false });
          continue;
        }

        // A `{comment: ...}` directive marks a song section (Intro, Coro, …).
        // Render it as a visible section header so the structure is reflected.
        const commentTag = line.items.find(
          (item): item is Tag => item instanceof Tag && item.name === 'comment',
        );
        if (commentTag) {
          lines.push({
            items: [],
            isEmpty: false,
            hasChords: false,
            comment: commentTag.value ?? '',
          });
          continue;
        }

        const items: ChordItem[] = line.items
          .filter((item): item is ChordLyricsPair => item instanceof ChordLyricsPair)
          .map((item) => {
            const rawChord = item.chords ?? '';
            const transposed = transposeChord(rawChord, delta);
            return {
              chord: transposed,
              lyric: item.lyrics ?? '',
            };
          });

        const isEmpty = items.length === 0 || items.every((i) => !i.chord && !i.lyric.trim());
        const hasChords = items.some((i) => !!i.chord);
        lines.push({ items, isEmpty, hasChords });
      }

      return lines;
    } catch {
      // Fallback: renderiza el texto plano si el parse falla
      return raw.split('\n').map((text) => ({
        items: [{ chord: '', lyric: text }],
        hasChords: false,
        isEmpty: text.trim() === '',
      }));
    }
  });
}
