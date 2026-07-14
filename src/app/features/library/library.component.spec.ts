import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LibraryComponent } from './library.component';
import { SongsService } from '../../core/services/songs.service';
import { mockSongsService, sampleSong } from '../../testing/mock-services';

function setup(stub = mockSongsService()) {
  TestBed.configureTestingModule({
    imports: [LibraryComponent],
    providers: [provideRouter([]), { provide: SongsService, useValue: stub }],
  });
  return TestBed.createComponent(LibraryComponent);
}

describe('LibraryComponent', () => {
  it('lists all songs initially', () => {
    const stub = mockSongsService([
      sampleSong({ id: '1', title: 'Cristo Vive' }),
      sampleSong({ id: '2', title: 'Waymaker' }),
    ]);
    const fixture = setup(stub);
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredSongs()).toHaveLength(2);
  });

  it('includes enharmonic flat keys in the filter list', () => {
    const fixture = setup();
    expect(fixture.componentInstance.keys).toContain('Db');
    expect(fixture.componentInstance.keys).toContain('Bb');
  });

  it('paginates results beyond the page size', () => {
    const many = Array.from({ length: 30 }, (_, i) => sampleSong({ id: String(i), title: `Song ${i}` }));
    const fixture = setup(mockSongsService(many));
    fixture.detectChanges();
    expect(fixture.componentInstance.totalPages()).toBe(2);
    expect(fixture.componentInstance.pagedSongs()).toHaveLength(fixture.componentInstance.pageSize);

    fixture.componentInstance.nextPage();
    expect(fixture.componentInstance.page()).toBe(2);
    expect(fixture.componentInstance.pagedSongs()).toHaveLength(30 - fixture.componentInstance.pageSize);
  });

  it('clears filters', () => {
    const fixture = setup();
    fixture.componentInstance.query.set('abc');
    fixture.componentInstance.selectedKey.set('G');
    fixture.componentInstance.selectedArtist.set('Hillsong');
    fixture.componentInstance.selectedTags.set(['adoración']);
    fixture.componentInstance.clearFilters();
    expect(fixture.componentInstance.query()).toBe('');
    expect(fixture.componentInstance.selectedKey()).toBe('');
    expect(fixture.componentInstance.selectedArtist()).toBe('');
    expect(fixture.componentInstance.selectedTags()).toEqual([]);
  });

  it('filters by selected artist', () => {
    const stub = mockSongsService([
      sampleSong({ id: '1', title: 'Cristo Vive', artist: 'Hillsong' }),
      sampleSong({ id: '2', title: 'Waymaker', artist: 'Sinach' }),
    ]);
    const fixture = setup(stub);
    fixture.detectChanges();
    fixture.componentInstance.selectedArtist.set('Sinach');
    expect(fixture.componentInstance.filteredSongs()).toHaveLength(1);
    expect(fixture.componentInstance.filteredSongs()[0].title).toBe('Waymaker');
  });

  it('toggles a tag filter on and off', () => {
    const stub = mockSongsService([
      sampleSong({ id: '1', title: 'Cristo Vive', tags: ['adoración'] }),
      sampleSong({ id: '2', title: 'Waymaker', tags: ['fe'] }),
    ]);
    const fixture = setup(stub);
    fixture.detectChanges();

    fixture.componentInstance.toggleTag('fe');
    expect(fixture.componentInstance.selectedTags()).toEqual(['fe']);
    expect(fixture.componentInstance.filteredSongs()).toHaveLength(1);
    expect(fixture.componentInstance.filteredSongs()[0].title).toBe('Waymaker');

    fixture.componentInstance.toggleTag('fe');
    expect(fixture.componentInstance.selectedTags()).toEqual([]);
  });
});
