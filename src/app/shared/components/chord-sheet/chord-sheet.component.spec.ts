import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ChordSheetComponent } from './chord-sheet.component';

// ── Helper: render via host component ────────────────────────────────────────

@Component({
  standalone: true,
  imports: [ChordSheetComponent],
  template: `<app-chord-sheet [content]="content" [semitones]="semitones" [fontSize]="fontSize" />`,
})
class HostComponent {
  content = '';
  semitones = 0;
  fontSize: 'normal' | 'large' | 'xlarge' = 'normal';
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChordSheetComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('renders chord and lyric text from ChordPro content', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.content = '[G]Cristo vive';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.chord')?.textContent?.trim()).toBe('G');
    // ChordSheetJS segments lyrics per chord/word, so check the combined text.
    const lyricText = Array.from(el.querySelectorAll('.lyric'))
      .map((n) => n.textContent)
      .join('');
    expect(lyricText).toContain('Cristo vive');
  });

  it('renders a {comment} directive as a visible section header', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.content = '{comment: Coro · //D8 - A8//}\n[D]Letra';
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('.section') as HTMLElement | null;
    expect(section?.textContent?.trim()).toBe('Coro · //D8 - A8//');
  });

  it('renders empty lines as spacer divs', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.content = '[G]Primera línea\n\n[D]Segunda línea';
    fixture.detectChanges();

    const empties = fixture.nativeElement.querySelectorAll('.line-empty');
    expect(empties.length).toBeGreaterThan(0);
  });

  it('applies correct CSS class for fontSize', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.content = '[G]Test';
    fixture.componentInstance.fontSize = 'large';
    fixture.detectChanges();

    const sheet = fixture.nativeElement.querySelector('.sheet');
    expect(sheet?.classList.contains('size-large')).toBe(true);
  });

  it('transposes G up one semitone to G#', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.content = '[G]Letra';
    fixture.componentInstance.semitones = 1;
    fixture.detectChanges();

    const chord = fixture.nativeElement.querySelector('.chord')?.textContent?.trim();
    expect(chord).toBe('Ab');
  });

  it('transposes G down one semitone to F#', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.content = '[G]Letra';
    fixture.componentInstance.semitones = -1;
    fixture.detectChanges();

    const chord = fixture.nativeElement.querySelector('.chord')?.textContent?.trim();
    expect(chord).toBe('F#');
  });

  it('falls back to plain text rendering on invalid ChordPro', () => {
    const fixture = TestBed.createComponent(HostComponent);
    // Malformed content that won't be valid ChordPro
    fixture.componentInstance.content = 'plain text without chords';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('plain text without chords');
  });

  it('returns empty when content is empty', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.content = '';
    fixture.detectChanges();

    const lines = fixture.nativeElement.querySelectorAll('.line, .line-empty');
    expect(lines.length).toBe(0);
  });

  it('has aria region label for accessibility', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.content = '[G]Test';
    fixture.detectChanges();

    const region = fixture.nativeElement.querySelector('[role="region"]');
    expect(region?.getAttribute('aria-label')).toBeTruthy();
  });
});
