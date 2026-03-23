import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    nav {
      width: 220px;
      min-width: 220px;
      background: var(--surface-section);
      border-right: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 0;
      gap: 0.25rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 1.25rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
      margin-bottom: 0.75rem;
      text-decoration: none;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      background: var(--accent-primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .brand-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .brand-sub {
      font-size: 0.7rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1.25rem;
      margin: 0 0.5rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
      cursor: pointer;

      &:hover {
        background: var(--surface-hover);
        color: var(--text-primary);
      }

      &.active {
        background: rgba(167, 139, 250, 0.12);
        color: var(--accent-primary);

        i { color: var(--accent-primary); }
      }

      i {
        font-size: 1.1rem;
        width: 20px;
        text-align: center;
        color: var(--text-muted);
        transition: color 0.15s;
      }
    }

    .nav-section-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 1rem 1.75rem 0.25rem;
    }

    .nav-spacer { flex: 1; }

    .new-song-btn {
      margin: 0.5rem 0.75rem 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.65rem;
      background: var(--accent-primary);
      color: #0f0f11;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.15s;

      &:hover { background: var(--accent-primary-hover); }
    }

    /* Mobile: bottom tab bar */
    @media (max-width: 768px) {
      nav {
        width: 100%;
        min-width: unset;
        height: 64px;
        min-height: 64px;
        flex-direction: row;
        align-items: center;
        padding: 0 0.5rem;
        border-right: none;
        border-top: 1px solid var(--surface-border);
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        gap: 0;
      }

      .brand, .nav-section-label, .nav-spacer, .new-song-btn { display: none; }

      .nav-item {
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.2rem;
        padding: 0.4rem 0.25rem;
        margin: 0;
        border-radius: var(--radius-sm);
        font-size: 0.65rem;

        i { font-size: 1.2rem; width: auto; }
      }
    }
  `,
  template: `
    <nav aria-label="Navegación principal">
      <a class="brand" routerLink="/">
        <div class="brand-icon">🎵</div>
        <div>
          <div class="brand-name">Músicos</div>
          <div class="brand-sub">Worship App</div>
        </div>
      </a>

      <span class="nav-section-label">Música</span>

      @for (item of navItems; track item.route) {
        <a
          class="nav-item"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.route === '/' }"
          [attr.aria-label]="item.label"
        >
          <i [class]="'pi ' + item.icon" aria-hidden="true"></i>
          <span>{{ item.label }}</span>
        </a>
      }

      <div class="nav-spacer"></div>

      <a class="new-song-btn" routerLink="/songs/new" aria-label="Crear nueva canción">
        <i class="pi pi-plus" aria-hidden="true"></i>
        <span>Nueva canción</span>
      </a>
    </nav>
  `,
})
export class NavbarComponent {
  readonly navItems: NavItem[] = [
    { label: 'Inicio', icon: 'pi-home', route: '/' },
    { label: 'Biblioteca', icon: 'pi-music', route: '/library' },
    { label: 'Setlists', icon: 'pi-list', route: '/setlists' },
  ];
}
