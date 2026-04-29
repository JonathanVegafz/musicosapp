import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { SongsService } from './core/services/songs.service';
import { SetlistsService } from './core/services/setlists.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideClientHydration(withEventReplay()),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: 'html',
        },
      },
      ripple: true,
    }),
    MessageService,
    provideAppInitializer(async () => {
      const songs = inject(SongsService);
      const setlists = inject(SetlistsService);
      await songs.init();
      await setlists.init();
    }),
  ],
};
