import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SongFormComponent } from './song-form.component';
import { SongsService } from '../../core/services/songs.service';
import { mockSongsService, sampleSong } from '../../testing/mock-services';

function setup(stub = mockSongsService()) {
  TestBed.configureTestingModule({
    imports: [SongFormComponent],
    providers: [provideRouter([]), { provide: SongsService, useValue: stub }],
  });
  return { fixture: TestBed.createComponent(SongFormComponent), stub };
}

describe('SongFormComponent', () => {
  it('is invalid when required fields are empty', () => {
    const { fixture } = setup();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('includes enharmonic flat keys', () => {
    const { fixture } = setup();
    expect(fixture.componentInstance.keys).toContain('Eb');
  });

  it('rejects a non-YouTube URL', () => {
    const { fixture } = setup();
    const youtube = fixture.componentInstance.form.controls.youtube;
    youtube.setValue('https://vimeo.com/123');
    expect(youtube.invalid).toBe(true);
  });

  it('accepts a valid YouTube URL', () => {
    const { fixture } = setup();
    const youtube = fixture.componentInstance.form.controls.youtube;
    youtube.setValue('https://youtu.be/abcdefghijk');
    expect(youtube.valid).toBe(true);
  });

  it('prefills the form when editing an existing song', () => {
    const { fixture } = setup(mockSongsService([sampleSong({ id: 'song-1', title: 'Waymaker' })]));
    fixture.componentRef.setInput('id', 'song-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.isEditing()).toBe(true);
    expect(fixture.componentInstance.form.controls.title.value).toBe('Waymaker');
  });
});
