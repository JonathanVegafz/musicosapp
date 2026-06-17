import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { SongsService } from '../../core/services/songs.service';
import { SetlistsService } from '../../core/services/setlists.service';
import { mockSongsService, mockSetlistsService, sampleSong, sampleSetlist } from '../../testing/mock-services';

function setup(songsStub = mockSongsService(), setlistsStub = mockSetlistsService()) {
  TestBed.configureTestingModule({
    imports: [HomeComponent],
    providers: [
      provideRouter([]),
      { provide: SongsService, useValue: songsStub },
      { provide: SetlistsService, useValue: setlistsStub },
    ],
  });
  return TestBed.createComponent(HomeComponent);
}

describe('HomeComponent', () => {
  it('shows empty states when there is no data', () => {
    const fixture = setup();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No hay setlists próximas');
    expect(text).toContain('No hay canciones todavía');
  });

  it('renders recent songs and upcoming setlists', () => {
    const songs = mockSongsService([sampleSong({ id: 's1', title: 'Waymaker' })]);
    songs.recentSongs.set([sampleSong({ id: 's1', title: 'Waymaker' })]);
    const setlists = mockSetlistsService([sampleSetlist({ id: 'sl1', name: 'Domingo AM' })]);
    setlists.upcomingSetlists.set([sampleSetlist({ id: 'sl1', name: 'Domingo AM' })]);

    const fixture = setup(songs, setlists);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Waymaker');
    expect(text).toContain('Domingo AM');
  });

  it('shows an error alert when a service reports an error', () => {
    const songs = mockSongsService();
    songs.error.set('Sin conexión');
    const fixture = setup(songs);
    fixture.detectChanges();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Sin conexión');
  });
});
