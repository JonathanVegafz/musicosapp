import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SetlistsService } from '../../core/services/setlists.service';

@Component({
  selector: 'app-setlists',
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .page { display: flex; flex-direction: column; gap: 1.5rem; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
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

    .setlists-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .setlist-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.1rem 1.25rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      text-decoration: none;
      transition: border-color 0.15s, background 0.15s;
      cursor: pointer;

      &:hover {
        border-color: rgba(167, 139, 250, 0.4);
        background: var(--surface-overlay);
      }
    }

    .setlist-icon {
      width: 44px;
      height: 44px;
      background: rgba(167, 139, 250, 0.1);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i { color: var(--accent-primary); font-size: 1.1rem; }
    }

    .setlist-info { flex: 1; min-width: 0; }

    .setlist-name {
      font-weight: 600;
      font-size: 0.975rem;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .setlist-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.1rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .setlist-date {
      font-size: 0.775rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .setlist-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.3rem;
      flex-shrink: 0;
    }

    .song-count {
      background: rgba(167, 139, 250, 0.12);
      color: var(--accent-primary);
      border-radius: var(--radius-sm);
      padding: 0.2rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .delete-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: var(--radius-sm);
      opacity: 0;
      transition: color 0.15s, opacity 0.15s;
      &:hover { color: #ef4444; }
    }

    .setlist-card:hover .delete-btn { opacity: 1; }

    .empty {
      padding: 3rem 2rem;
      text-align: center;
      color: var(--text-muted);
      background: var(--surface-card);
      border: 1px dashed var(--surface-border);
      border-radius: var(--radius-lg);

      i { font-size: 2.5rem; display: block; margin-bottom: 1rem; color: var(--surface-hover); }
      p { margin-bottom: 1.25rem; }
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 200;
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
      max-width: 460px;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: var(--shadow-lg);
    }

    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .field { display: flex; flex-direction: column; gap: 0.4rem; }

    label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .required { color: var(--accent-chord); }

    input[type='text'], input[type='date'], textarea {
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
      color-scheme: dark;

      &:focus { border-color: var(--accent-primary); }
      &::placeholder { color: var(--text-muted); }
      &.invalid { border-color: #ef4444; }
    }

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

    .error-msg { font-size: 0.75rem; color: #ef4444; }
  `,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Setlists</h1>
        <button class="btn-primary" (click)="openModal()" aria-label="Crear nueva setlist">
          <i class="pi pi-plus" aria-hidden="true"></i>
          Nueva setlist
        </button>
      </div>

      @if (setlists().length) {
        <div class="setlists-list" role="list" aria-label="Lista de setlists">
          @for (sl of setlists(); track sl.id) {
            <a
              class="setlist-card"
              [routerLink]="['/setlists', sl.id]"
              role="listitem"
              [attr.aria-label]="sl.name + ', ' + sl.songs.length + ' canciones'"
            >
              <div class="setlist-icon">
                <i class="pi pi-list" aria-hidden="true"></i>
              </div>

              <div class="setlist-info">
                <div class="setlist-name">{{ sl.name }}</div>
                @if (sl.description) {
                  <div class="setlist-desc">{{ sl.description }}</div>
                }
                @if (sl.date) {
                  <div class="setlist-date">
                    <i class="pi pi-calendar" aria-hidden="true"></i>
                    {{ formatDate(sl.date) }}
                  </div>
                }
              </div>

              <div class="setlist-meta">
                <span class="song-count">{{ sl.songs.length }} canciones</span>
                <button
                  class="delete-btn"
                  (click)="deleteSetlist($event, sl.id)"
                  [attr.aria-label]="'Eliminar ' + sl.name"
                >
                  <i class="pi pi-trash" aria-hidden="true"></i>
                </button>
              </div>
            </a>
          }
        </div>
      } @else {
        <div class="empty" role="status">
          <i class="pi pi-list" aria-hidden="true"></i>
          <p>No hay setlists todavía.</p>
          <button class="btn-primary" (click)="openModal()">
            <i class="pi pi-plus" aria-hidden="true"></i>
            Crear la primera setlist
          </button>
        </div>
      }
    </div>

    <!-- Modal crear setlist -->
    @if (showModal()) {
      <div
        class="modal-backdrop"
        (click)="closeModal()"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title" id="modal-title">Nueva Setlist</h2>

          <form [formGroup]="createForm" (ngSubmit)="createSetlist()">
            <div class="field" style="margin-bottom: 1rem;">
              <label for="sl-name">Nombre <span class="required">*</span></label>
              <input
                id="sl-name"
                type="text"
                formControlName="name"
                placeholder="Ej: Servicio Dominical"
                [class.invalid]="isInvalid('name')"
                aria-required="true"
              />
              @if (isInvalid('name')) {
                <span class="error-msg" role="alert">El nombre es requerido</span>
              }
            </div>

            <div class="field" style="margin-bottom: 1rem;">
              <label for="sl-date">Fecha</label>
              <input id="sl-date" type="date" formControlName="date" />
            </div>

            <div class="field" style="margin-bottom: 1.25rem;">
              <label for="sl-desc">Descripción</label>
              <input
                id="sl-desc"
                type="text"
                formControlName="description"
                placeholder="Opcional"
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-outline" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="createForm.invalid">
                <i class="pi pi-check" aria-hidden="true"></i>
                Crear
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class SetlistsComponent {
  private readonly setlistsService = inject(SetlistsService);
  private readonly fb = inject(FormBuilder);

  readonly setlists = this.setlistsService.setlists;
  readonly showModal = signal(false);

  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    date: [''],
    description: [''],
  });

  openModal(): void {
    this.createForm.reset();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  async createSetlist(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const v = this.createForm.getRawValue();
    await this.setlistsService.create({
      name: v.name,
      date: v.date ? new Date(v.date).toISOString() : undefined,
      description: v.description || undefined,
    });
    this.closeModal();
  }

  async deleteSetlist(event: Event, id: string): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (confirm('¿Eliminar esta setlist?')) {
      await this.setlistsService.remove(id);
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.createForm.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
