# QA Report — MúsicosWorship App

> **Fecha:** 2026-06-16  
> **URL:** https://jonathanvegafz.github.io/musicosapp/  
> **Código:** `/Users/jonathan/Documents/GitHub/musicosapp`  
> **Stack:** Angular 21 · Supabase · ChordSheetJS · Tonal.js · PrimeNG

---

## 🔴 Crítico

### 1. Clave `service_role` de Supabase expuesta en el frontend

**Archivo:** `src/environments/environment.ts`

La clave almacenada en `environment.supabaseKey` es un JWT con `"role": "service_role"`, no el `anon key`. La diferencia es fundamental: **la service_role bypassa por completo Row Level Security (RLS)**. Cualquier usuario que inspeccione el bundle de producción puede leer, modificar o eliminar cualquier fila de la base de datos.

**Solución:**
1. Revocar la clave actual desde Supabase Dashboard → Project Settings → API → Reset service_role key.
2. Reemplazarla por el `anon key` (etiquetado como "anon public" en el dashboard).
3. Habilitar Row Level Security en todas las tablas (`songs`, `setlists`, `setlist_songs`, `setlist_members`).

```ts
// ✅ Correcto
export const environment = {
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseKey: '<ANON_KEY_AQUÍ>',   // nunca la service_role
};
```

---

## 🟠 Alto

### 2. Test roto en `app.spec.ts`

**Archivo:** `src/app/app.spec.ts`

El test verifica `'Hello, musicos'` en un `<h1>`, pero la app real muestra `'Bienvenido 🎵'`. Ejecutar `ng test` falla inmediatamente.

```ts
// ❌ Actual (falla)
expect(compiled.querySelector('h1')?.textContent).toContain('Hello, musicos');

// ✅ Corregir a
expect(compiled.querySelector('h1')?.textContent).toContain('Bienvenido');
```

### 3. Sin feedback de carga ni de error en servicios

**Archivos:** `songs.service.ts`, `setlists.service.ts`

Cuando Supabase falla (red caída, sesión expirada, etc.) los servicios silencian el error y dejan el estado en `[]`. El usuario ve la pantalla vacía sin saber si hay un problema o simplemente no hay datos.

**Solución propuesta:** Agregar señales de estado.

```ts
// En el servicio
readonly error = signal<string | null>(null);
readonly loading = signal(false);

async init(): Promise<void> {
  if (!isPlatformBrowser(this.platformId)) return;
  this.loading.set(true);
  try {
    const { data, error } = await this.sb.from('songs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    this.songs.set((data ?? []).map(mapSong));
  } catch (e: unknown) {
    this.error.set(e instanceof Error ? e.message : 'Error al cargar canciones');
    this.songs.set([]);
  } finally {
    this.loading.set(false);
  }
}
```

### 4. `_syncOrders` hace N llamadas secuenciales a Supabase

**Archivo:** `src/app/core/services/setlists.service.ts` — método `_syncOrders`

Cada reordenamiento de canciones en un setlist dispara una llamada HTTP por cada canción. Para un setlist de 10 canciones = 10 requests secuenciales.

**Solución:** usar `upsert` en batch:

```ts
private async _syncOrders(setlistId: string, songs: SetlistSong[]): Promise<void> {
  const rows = songs.map((s) => ({
    setlist_id: setlistId,
    song_id: s.songId,
    order: s.order,
  }));
  const { error } = await this.sb
    .from('setlist_songs')
    .upsert(rows, { onConflict: 'setlist_id,song_id' });
  if (error) throw error;
}
```

### 5. Inconsistencia en las tonalidades del filtro de Biblioteca

**Archivo:** `src/app/features/library/library.component.ts`

La lista `KEYS` en Library omite los bemoles enarmónicos (`Db`, `Eb`, `Gb`, `Ab`, `Bb`) que sí existen en el formulario de nueva canción. Una canción guardada en `Db` nunca podrá filtrarse en la Biblioteca.

```ts
// ❌ Library — faltan bemoles
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', ...];

// ✅ Unificar con la misma lista del formulario
const KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb',
  'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
];
```

---

## 🟡 Medio

### 6. El modal de "Nueva Setlist" no tiene trampa de foco (focus trap)

**Archivo:** `src/app/features/setlists/setlists.component.ts`

Los usuarios de teclado pueden salir del modal con `Tab`, accediendo al contenido de fondo. Tampoco se cierra con `Escape`.

**Solución:** Agregar soporte de keyboard + Angular CDK Dialog (ya está `@angular/cdk` instalado):

```ts
// Detectar Escape en el host del modal
@HostListener('document:keydown.escape')
onEscape(): void {
  this.closeModal();
}
```

Para el focus trap, usar `cdkTrapFocus` del CDK:
```html
<div class="modal" cdkTrapFocus (click)="$event.stopPropagation()">
```

### 7. Botón "Eliminar" en setlist cards invisible para teclado

**Archivo:** `src/app/features/setlists/setlists.component.ts`

El `.delete-btn` tiene `opacity: 0` y solo aparece en `:hover`. Los usuarios de teclado nunca lo ven.

```scss
// ✅ Hacerlo visible al recibir foco
.setlist-card:hover .delete-btn,
.delete-btn:focus-visible {
  opacity: 1;
}
```

### 8. `ngOnInit` innecesario en `SongDetailComponent`

**Archivo:** `src/app/features/song-detail/song-detail.component.ts`

```ts
// ❌ Implementa OnInit solo para resetear lo que ya está reseteado
readonly semitones = signal(0);

ngOnInit(): void {
  this.semitones.set(0); // redundante
}
```

Eliminar `ngOnInit`, `OnInit` del import y la referencia en el ciclo de vida.

### 9. Sin título dinámico por ruta (SEO / UX)

**Archivo:** `src/index.html`, `src/app/app.routes.ts`

El `<title>` es estático `AppMusicos` en todas las rutas. Esto afecta SEO y la experiencia al cambiar de pestaña.

**Solución:** Usar `Title` service de Angular en cada componente, o configurar `title` en las rutas:

```ts
// app.routes.ts
{ path: 'library', title: 'Biblioteca — MúsicosApp', loadComponent: ... }
{ path: 'songs/new', title: 'Nueva canción — MúsicosApp', loadComponent: ... }
```

### 10. Sin `meta description` ni tags OG en `index.html`

**Archivo:** `src/index.html`

```html
<!-- Agregar en <head> -->
<meta name="description" content="Plataforma de gestión de canciones y setlists para músicos de iglesia." />
<meta property="og:title" content="MúsicosWorship App" />
<meta property="og:description" content="Gestiona tu repertorio, setlists y transpón acordes en tiempo real." />
<meta property="og:type" content="website" />
```

### 11. Zona horaria en `formatDate` de Setlists

**Archivo:** `src/app/features/setlists/setlists.component.ts`

```ts
// ❌ 'YYYY-MM-DD' sin hora se interpreta como UTC, puede mostrar día incorrecto
new Date('2024-12-25').toLocaleDateString('es', { ... }) // → 24 dic en UTC-1

// ✅ Forzar zona local agregando hora
formatDate(iso: string): string {
  const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es', { ... });
}
```

### 12. Sin debounce en el buscador de la Biblioteca

**Archivo:** `src/app/features/library/library.component.ts`

La búsqueda filtra con cada pulsación de tecla. Con listas grandes puede afectar el rendimiento.

**Solución:** Aplicar `debounceTime` con `toObservable` de `@angular/core/rxjs-interop`:

```ts
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

readonly debouncedQuery = toSignal(
  toObservable(this.query).pipe(debounceTime(300)),
  { initialValue: '' }
);
```

---

## 🔵 Menor / Mejoras

### 13. `upcomingSetlists` incluye setlists sin fecha como "próximas"

**Archivo:** `src/app/core/services/setlists.service.ts`

Un setlist sin fecha aparece en la sección "Próximas setlists" del Home aunque no tenga fecha asignada. Puede ser intencional, pero conviene documentarlo o ajustarlo:

```ts
// Opción: excluir setlists sin fecha de "upcoming"
.filter((sl) => sl.date && new Date(sl.date) >= now)
```

### 14. La transposición está limitada a ±6 semitonos

**Archivo:** `src/app/shared/components/transpose-control/transpose-control.component.ts`

El rango de ±6 semitonos es razonable para la mayoría de casos, pero algunos músicos necesitan ±12 (una octava completa). Considerar aumentar o hacer el límite configurable.

### 15. Sin paginación en la Biblioteca

**Archivo:** `src/app/features/library/library.component.ts`

Con bibliotecas grandes (200+ canciones), renderizar todas en un grid puede ser lento. Implementar paginación o virtualización con `@angular/cdk/scrolling`.

### 16. Validación de URL de YouTube en el formulario

**Archivo:** `src/app/features/song-form/song-form.component.ts`

El campo `youtube` es de tipo `url` pero no valida que sea específicamente una URL de YouTube. Una URL inválida simplemente no mostrará el video en la vista de detalle.

```ts
// Agregar validator personalizado
youtube: ['', [Validators.pattern(/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/)]],
```

### 17. `recentSongs` ordena el array completo en cada cambio

**Archivo:** `src/app/core/services/songs.service.ts`

```ts
// ❌ Crea un array nuevo y lo ordena O(n log n) en cada computed
readonly recentSongs = computed(() =>
  [...this.songs()].sort(...).slice(0, 5)
);
```

Como las canciones ya vienen ordenadas por `created_at DESC` desde Supabase, simplificar:

```ts
readonly recentSongs = computed(() => this.songs().slice(0, 5));
```

### 18. Comentarios `eslint-disable` para `any` en helpers de mapeo

**Archivos:** `songs.service.ts`, `setlists.service.ts`

Las funciones `mapSong`, `mapSetlist`, etc. usan `Record<string, any>`. Se puede tipar más específicamente con interfaces que reflejen las columnas de Supabase, eliminando los `eslint-disable`.

---

## ✅ Buenas prácticas detectadas

- Uso correcto de `ChangeDetectionStrategy.OnPush` en todos los componentes.
- Signals de Angular 17+ usados consistentemente (no `BehaviorSubject`).
- Lazy loading de rutas con `loadComponent`.
- `aria-label`, `aria-required`, `role="alert"` bien usados en los formularios.
- `isPlatformBrowser` correctamente aplicado para SSR.
- `DomSanitizer.bypassSecurityTrustResourceUrl` usado solo donde corresponde (YouTube embed).
- Diseño responsive con bottom navigation en mobile.
- Modo presentación implementado con estilos de host.

---

## 🧪 Pruebas generadas

### Unit tests (Vitest + Angular TestBed)

| Archivo | Cobertura |
|---|---|
| `songs.service.spec.ts` | `init`, `search`, `recentSongs`, `getById` |
| `setlists.service.spec.ts` | `init`, `upcomingSetlists`, `getById` |
| `chord-sheet.component.spec.ts` | Render, transposición, fontSize, accesibilidad |
| `transpose-control.component.spec.ts` | UI, emisión de eventos, límites, accesibilidad |
| `font-size-control.component.spec.ts` | Render, active state, emisión de eventos |
| `youtube-embed.component.spec.ts` | Toggle, URL parsing, aria-expanded |

**Ejecutar:**
```bash
ng test
```

### E2E tests (Playwright)

| Archivo | Escenarios |
|---|---|
| `e2e/navigation.spec.ts` | Links de navegación, rutas, breadcrumbs |
| `e2e/song-form.spec.ts` | Validación, vista previa, tonalidades |
| `e2e/library.spec.ts` | Búsqueda, filtros, estado vacío |
| `e2e/setlists.spec.ts` | Modal, validación, cierre |
| `e2e/accessibility.spec.ts` | ARIA, keyboard nav, lang, roles |

**Instalar Playwright (primera vez):**
```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

**Ejecutar contra producción:**
```bash
npx playwright test
```

**Ejecutar contra local:**
```bash
BASE_URL=http://localhost:4200 npx playwright test
```

**Ver reporte HTML:**
```bash
npx playwright show-report
```

---

## 📋 Resumen de prioridades

| Prioridad | # | Descripción |
|---|---|---|
| 🔴 Crítico | 1 | Revocar y reemplazar clave `service_role` de Supabase |
| 🟠 Alto | 2 | Corregir test roto en `app.spec.ts` |
| 🟠 Alto | 3 | Agregar estados de carga y error en servicios |
| 🟠 Alto | 4 | Optimizar `_syncOrders` con upsert en batch |
| 🟠 Alto | 5 | Unificar lista de tonalidades en Library y Form |
| 🟡 Medio | 6 | Focus trap y Escape en el modal de Setlists |
| 🟡 Medio | 7 | Visibilidad del botón eliminar para teclado |
| 🟡 Medio | 8 | Eliminar `ngOnInit` redundante en `SongDetailComponent` |
| 🟡 Medio | 9 | Títulos dinámicos por ruta |
| 🟡 Medio | 10 | Meta description y OG tags |
| 🟡 Medio | 11 | Zona horaria en `formatDate` |
| 🟡 Medio | 12 | Debounce en el buscador |
| 🔵 Menor | 13–18 | Mejoras de performance, UX y código |
