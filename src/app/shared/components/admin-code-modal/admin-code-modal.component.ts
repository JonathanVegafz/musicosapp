import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-code-modal',
  imports: [FormsModule, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  styles: `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 300;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-xl);
      padding: 1.75rem;
      width: 100%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: var(--shadow-lg);
    }

    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i { color: var(--accent-primary); }
    }

    .modal-hint {
      font-size: 0.825rem;
      color: var(--text-secondary);
      margin-top: -0.75rem;
    }

    .field { display: flex; flex-direction: column; gap: 0.4rem; }

    label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    input[type='password'] {
      width: 100%;
      padding: 0.6rem 0.75rem;
      background: var(--surface-overlay);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 0.875rem;
      outline: none;
      font-family: var(--font-sans);
      transition: border-color 0.15s;

      &:focus { border-color: var(--accent-primary); }
      &.invalid { border-color: #ef4444; }
    }

    .error-msg { font-size: 0.75rem; color: #ef4444; }

    .modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn-outline {
      padding: 0.6rem 1rem;
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
      &:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1.1rem;
      background: var(--accent-primary);
      color: #0f0f11;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: var(--accent-primary-hover); }
    }
  `,
  template: `
    @if (adminAuth.visible()) {
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div
          class="modal"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-modal-title"
        >
          <h2 class="modal-title" id="admin-modal-title">
            <i class="pi pi-lock" aria-hidden="true"></i>
            Código de administrador
          </h2>
          <p class="modal-hint">Se pedirá una sola vez en este dispositivo.</p>

          <form (ngSubmit)="submit()">
            <div class="field">
              <label for="admin-code">Código</label>
              <input
                id="admin-code"
                type="password"
                [(ngModel)]="code"
                name="code"
                autocomplete="off"
                [class.invalid]="adminAuth.errorMsg()"
                aria-required="true"
                [attr.aria-invalid]="!!adminAuth.errorMsg()"
                aria-describedby="admin-code-error"
              />
              @if (adminAuth.errorMsg()) {
                <span class="error-msg" id="admin-code-error" role="alert">
                  {{ adminAuth.errorMsg() }}
                </span>
              }
            </div>

            <div class="modal-actions" style="margin-top: 1.25rem;">
              <button type="button" class="btn-outline" (click)="cancel()">Cancelar</button>
              <button type="submit" class="btn-primary">
                <i class="pi pi-check" aria-hidden="true"></i>
                Confirmar
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AdminCodeModalComponent {
  readonly adminAuth = inject(AdminAuthService);
  readonly code = signal('');

  submit(): void {
    this.adminAuth.submit(this.code());
    this.code.set('');
  }

  cancel(): void {
    this.adminAuth.cancel();
    this.code.set('');
  }

  onEscape(): void {
    if (this.adminAuth.visible()) this.cancel();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel();
  }
}
