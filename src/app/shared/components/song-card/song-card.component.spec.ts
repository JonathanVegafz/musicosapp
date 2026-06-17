import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SongCardComponent } from './song-card.component';
import { Song } from '../../../types';

const song: Song = {
  id: 's1',
  title: 'Cristo Vive',
  artist: 'Hillsong',
  key: 'G',
  bpm: 120,
  capo: 2,
  youtube: 'https://youtu.be/abcdefghijk',
  content: '[G]Cristo vive',
  createdAt: '2024-01-01T00:00:00Z',
  tags: ['adoración', 'rápido'],
};

function createComponent() {
  TestBed.configureTestingModule({
    imports: [SongCardComponent],
    providers: [provideRouter([])],
  });
  const fixture = TestBed.createComponent(SongCardComponent);
  fixture.componentRef.setInput('song', song);
  return fixture;
}

describe('SongCardComponent', () => {
  it('renders title, artist, key and tags', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.title')?.textContent).toContain('Cristo Vive');
    expect(el.querySelector('.artist')?.textContent).toContain('Hillsong');
    expect(el.querySelector('.key-badge')?.textContent).toContain('G');
    expect(el.querySelectorAll('.tag')).toHaveLength(2);
  });

  it('shows capo and video meta when present', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Capo 2');
    expect(text).toContain('Video');
  });

  it('hides the delete button by default', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.action-btn')).toBeNull();
  });

  it('emits delete with the song id when delete button is clicked', () => {
    const fixture = createComponent();
    fixture.componentRef.setInput('showDelete', true);
    const spy = vi.fn();
    fixture.componentInstance.delete.subscribe(spy);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.action-btn')?.click();
    expect(spy).toHaveBeenCalledWith('s1');
  });
});
