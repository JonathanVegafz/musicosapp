import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SongsService } from '../../core/services/songs.service';
import { ChordSheetComponent } from '../../shared/components/chord-sheet/chord-sheet.component';

const KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
];

@Component({
  selector: 'app-song-form',
  imports: [ReactiveFormsModule, RouterLink, ChordSheetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .form-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.825rem;
      transition: color 0.15s;
      &:hover { color: var(--accent-primary); }
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .form-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    @media (max-width: 900px) {
      .form-layout { grid-template-columns: 1fr; }
    }

    .form-panel, .preview-panel {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .panel-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .required { color: var(--accent-chord); }

    input[type='text'],
    input[type='number'],
    input[type='url'],
    select,
    textarea {
      width: 100%;
      padding: 0.6rem 0.75rem;
      background: var(--surface-overlay);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: var(--font-sans);

      &:focus {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.15);
      }

      &::placeholder { color: var(--text-muted); }
      &.invalid { border-color: #ef4444; }
    }

    textarea {
      font-family: var(--font-mono);
      resize: vertical;
      min-height: 280px;
      font-size: 0.825rem;
      line-height: 1.6;
    }

    select option { background: var(--surface-overlay); }

    .error-msg {
      font-size: 0.75rem;
      color: #ef4444;
    }

    .hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .chordpro-hint {
      font-family: var(--font-mono);
      background: var(--surface-overlay);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm);
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.8;

      .ch { color: var(--accent-chord); }
    }

    .preview-empty {
      color: var(--text-muted);
      font-size: 0.875rem;
      text-align: center;
      padding: 2rem 1rem;
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      padding-top: 0.5rem;
      border-top: 1px solid var(--surface-border);
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.65rem 1.25rem;
      background: var(--accent-primary);
      color: #0f0f11;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.15s;
      &:hover:not(:disabled) { background: var(--accent-primary-hover); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .btn-outline {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.65rem 1.1rem;
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      font-weight: 500;
      font-size: 0.875rem;
      text-decoration: none;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
      &:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
    }

    .preview-header {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .preview-key {
      font-size: 0.75rem;
      color: var(--accent-chord);
      font-family: var(--font-mono);
      font-weight: 700;
      background: var(--accent-chord-bg);
      border-radius: var(--radius-sm);
      padding: 0.1rem 0.4rem;
    }
  `,
  template: `
    <div class="form-page">
      <div class="page-header">
        <a class="back-btn" routerLink="/library">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          Biblioteca
        </a>
        <h1 class="page-title">{{ isEditing() ? 'Editar canción' : 'Nueva canción' }}</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-layout">
          <!-- Form panel -->
          <div class="form-panel">
            <span class="panel-title">Información</span>

            <div class="field">
              <label for="title">Título <span class="required" aria-label="requerido">*</span></label>
              <input
                id="title"
                type="text"
                formControlName="title"
                placeholder="Ej: Cristo Vive"
                [class.invalid]="isInvalid('title')"
                aria-required="true"
              />
              @if (isInvalid('title')) {
                <span class="error-msg" role="alert">El título es requerido</span>
              }
            </div>

            <div class="field">
              <label for="artist">Artista <span class="required" aria-label="requerido">*</span></label>
              <input
                id="artist"
                type="text"
                formControlName="artist"
                placeholder="Ej: San Marcos Worship"
                [class.invalid]="isInvalid('artist')"
                aria-required="true"
              />
              @if (isInvalid('artist')) {
                <span class="error-msg" role="alert">El artista es requerido</span>
              }
            </div>

            <div class="field-row">
              <div class="field">
                <label for="key">Tonalidad <span class="required" aria-label="requerido">*</span></label>
                <select id="key" formControlName="key" aria-required="true">
                  @for (k of keys; track k) {
                    <option [value]="k">{{ k }}</option>
                  }
                </select>
              </div>

              <div class="field">
                <label for="bpm">BPM</label>
                <input
                  id="bpm"
                  type="number"
                  formControlName="bpm"
                  placeholder="72"
                  min="40"
                  max="220"
                />
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="capo">Capo</label>
                <input
                  id="capo"
                  type="number"
                  formControlName="capo"
                  placeholder="0"
                  min="0"
                  max="12"
                />
              </div>

              <div class="field">
                <label for="tags">Etiquetas</label>
                <input
                  id="tags"
                  type="text"
                  formControlName="tagsRaw"
                  placeholder="adoración, lento"
                />
                <span class="hint">Separadas por comas</span>
              </div>
            </div>

            <div class="field">
              <label for="youtube">Video de YouTube</label>
              <input
                id="youtube"
                type="url"
                formControlName="youtube"
                placeholder="https://youtube.com/watch?v=..."
              />
              <span class="hint">Opcional — URL completa del video de referencia</span>
            </div>

            <div class="field">
              <label for="content">
                Letra con acordes (ChordPro) <span class="required" aria-label="requerido">*</span>
              </label>

              <div class="chordpro-hint" aria-label="Ejemplo de formato ChordPro">
                <span class="ch">[G]</span>Cristo vive <span class="ch">[D]</span>Cristo reina<br />
                <span class="ch">[Em]</span>Su amor me <span class="ch">[C]</span>alcanzó
              </div>

              <textarea
                id="content"
                formControlName="content"
                placeholder="[G]Escribe la letra [D]con los acordes [Em]entre corchetes..."
                [class.invalid]="isInvalid('content')"
                aria-required="true"
                aria-describedby="content-hint"
              ></textarea>
              <span id="content-hint" class="hint">
                Coloca el acorde entre corchetes justo antes de la sílaba donde suena.
              </span>
              @if (isInvalid('content')) {
                <span class="error-msg" role="alert">La letra es requerida</span>
              }
            </div>

            <div class="form-actions">
              <a class="btn-outline" routerLink="/library">Cancelar</a>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="form.invalid || saving()"
              >
                <i class="pi pi-check" aria-hidden="true"></i>
                {{ saving() ? 'Guardando...' : (isEditing() ? 'Guardar cambios' : 'Crear canción') }}
              </button>
            </div>
          </div>

          <!-- Preview panel -->
          <div class="preview-panel" aria-label="Vista previa de la canción">
            <div class="preview-header">
              <span class="panel-title">Vista previa</span>
              @if (form.value.key) {
                <span class="preview-key">{{ form.value.key }}</span>
              }
            </div>

            @if (previewContent()) {
              <app-chord-sheet [content]="previewContent()" [semitones]="0" fontSize="normal" />
            } @else {
              <div class="preview-empty" aria-live="polite">
                <i class="pi pi-file-edit" style="font-size:2rem; display:block; margin-bottom:0.5rem;" aria-hidden="true"></i>
                Escribe la letra con acordes para ver la vista previa
              </div>
            }
          </div>
        </div>
      </form>
    </div>
  `,
})
export class SongFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly songsService = inject(SongsService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  readonly isEditing = computed(() => !!this.id());
  readonly saving = signal(false);
  readonly keys = KEYS;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    artist: ['', Validators.required],
    key: ['G', Validators.required],
    bpm: [72],
    capo: [0],
    youtube: [''],
    tagsRaw: [''],
    content: ['', Validators.required],
  });

  readonly previewContent = computed(() => this.form.controls.content.value);

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    const song = this.songsService.getById(id);
    if (!song) return;
    this.form.patchValue({
      title: song.title,
      artist: song.artist,
      key: song.key,
      bpm: song.bpm,
      capo: song.capo,
      youtube: song.youtube ?? '',
      tagsRaw: song.tags?.join(', ') ?? '',
      content: song.content,
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const v = this.form.getRawValue();
    const tags = v.tagsRaw
      ? v.tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const data = {
      title: v.title,
      artist: v.artist,
      key: v.key,
      bpm: Number(v.bpm),
      capo: Number(v.capo),
      youtube: v.youtube || undefined,
      tags,
      content: v.content,
    };

    try {
      const id = this.id();
      if (id) {
        await this.songsService.update(id, data);
        this.router.navigate(['/songs', id]);
      } else {
        const newSong = await this.songsService.add(data);
        this.router.navigate(['/songs', newSong.id]);
      }
    } finally {
      this.saving.set(false);
    }
  }
}
