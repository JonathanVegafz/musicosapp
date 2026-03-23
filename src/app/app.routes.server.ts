import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas estáticas — se prerenderizan en build
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'library', renderMode: RenderMode.Prerender },
  { path: 'setlists', renderMode: RenderMode.Prerender },
  { path: 'songs/new', renderMode: RenderMode.Prerender },

  // Rutas con parámetros dinámicos — se renderizan en el servidor por petición
  { path: 'songs/:id', renderMode: RenderMode.Server },
  { path: 'songs/:id/edit', renderMode: RenderMode.Server },
  { path: 'setlists/:id', renderMode: RenderMode.Server },

  // Fallback
  { path: '**', renderMode: RenderMode.Server },
];
