import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SetlistDetailComponent } from './setlist-detail.component';
import { SetlistsService } from '../../core/services/setlists.service';
import { SongsService } from '../../core/services/songs.service';
import {
  mockSetlistsService,
  mockSongsService,
  sampleSetlist,
  sampleSong,
} from '../../testing/mock-services';

function setup() {
  const songsStub = mockSongsService([sampleSong({ id: 'song-1', title: 'Cristo Vive' })]);
  const setlistsStub = mockSetlistsService([
    sampleSetlist({ id: 'sl-1', name: 'Domingo AM', songs: [{ songId: 'song-1', order: 1 }] }),
  ]);
  TestBed.configureTestingModule({
    imports: [SetlistDetailComponent],
    providers: [
      provideRouter([]),
      { provide: SetlistsService, useValue: setlistsStub },
      { provide: SongsService, useValue: songsStub },
    ],
  });
  const fixture = TestBed.createComponent(SetlistDetailComponent);
  fixture.componentRef.setInput('id', 'sl-1');
  return { fixture, songsStub, setlistsStub };
}

describe('SetlistDetailComponent', () => {
  it('resolves the setlist by id', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.setlist()?.name).toBe('Domingo AM');
  });

  it('builds entries by resolving each song', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const entries = fixture.componentInstance.entries();
    expect(entries).toHaveLength(1);
    expect(entries[0].song.title).toBe('Cristo Vive');
  });

  it('sets the document title from the setlist name', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(TestBed.inject(Title).getTitle()).toContain('Domingo AM');
  });

  it('reports whether a song is already in the setlist', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.isInSetlist('song-1')).toBe(true);
    expect(fixture.componentInstance.isInSetlist('other')).toBe(false);
  });

  it('delegates adding a song to the service', async () => {
    const { fixture, setlistsStub } = setup();
    fixture.detectChanges();
    await fixture.componentInstance.addSong('song-2');
    expect(setlistsStub.addSong).toHaveBeenCalledWith('sl-1', 'song-2');
  });
});
