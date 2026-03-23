import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'library',
        loadComponent: () =>
          import('./features/library/library.component').then((m) => m.LibraryComponent),
      },
      {
        path: 'songs/new',
        loadComponent: () =>
          import('./features/song-form/song-form.component').then((m) => m.SongFormComponent),
      },
      {
        path: 'songs/:id/edit',
        loadComponent: () =>
          import('./features/song-form/song-form.component').then((m) => m.SongFormComponent),
      },
      {
        path: 'songs/:id',
        loadComponent: () =>
          import('./features/song-detail/song-detail.component').then(
            (m) => m.SongDetailComponent,
          ),
      },
      {
        path: 'setlists',
        loadComponent: () =>
          import('./features/setlists/setlists.component').then((m) => m.SetlistsComponent),
      },
      {
        path: 'setlists/:id',
        loadComponent: () =>
          import('./features/setlist-detail/setlist-detail.component').then(
            (m) => m.SetlistDetailComponent,
          ),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
