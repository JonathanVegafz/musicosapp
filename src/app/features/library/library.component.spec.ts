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
    fixture.componentInstance.clearFilters();
    expect(fixture.componentInstance.query()).toBe('');
    expect(fixture.componentInstance.selectedKey()).toBe('');
  });
});
