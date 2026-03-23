import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, NavbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--surface-ground);
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .page-area {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }

    @media (max-width: 768px) {
      .shell {
        flex-direction: column-reverse;
      }

      .page-area {
        padding: 1rem;
        padding-bottom: 5rem;
      }
    }
  `,
  template: `
    <div class="shell">
      <app-navbar />
      <main class="main-content" id="main-content">
        <div class="page-area">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class AppShellComponent {}
