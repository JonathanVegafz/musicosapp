import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SongDetailComponent } from './song-detail.component';
import { SongsService } from '../../core/services/songs.service';
import { mockSongsService, sampleSong } from '../../testing/mock-services';

function setup(stub = mockSongsService([sampleSong({ id: 'song-1', title: 'Cristo Vive' })])) {
  TestBed.configureTestingModule({
    imports: [SongDetailComponent],
    providers: [provideRouter([]), { provide: SongsService, useValue: stub }],
  });
  const fixture = TestBed.createComponent(SongDetailComponent);
  fixture.componentRef.setInput('id', 'song-1');
  return fixture;
}

describe('SongDetailComponent', () => {
  it('resolves the song by id', () => {
    const fixture = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.song()?.title).toBe('Cristo Vive');
  });

  it('starts with zero transposition', () => {
    const fixture = setup();
    expect(fixture.componentInstance.semitones()).toBe(0);
  });

  it('sets the document title from the song', () => {
    const fixture = setup();
    fixture.detectChanges();
    expect(TestBed.inject(Title).getTitle()).toContain('Cristo Vive');
  });

  it('toggles presentation mode', () => {
    const fixture = setup();
    expect(fixture.componentInstance.presentationMode()).toBe(false);
    fixture.componentInstance.togglePresentation();
    expect(fixture.componentInstance.presentationMode()).toBe(true);
  });
});
