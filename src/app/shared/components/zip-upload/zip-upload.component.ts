import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { unzip } from 'fflate';

export interface ExtractedAudio {
  fileName: string;
  buffer: ArrayBuffer;
}

const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

@Component({
  selector: 'app-zip-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave()',
    '(drop)': 'onDrop($event)',
    '[class.drag-over]': 'isDragOver()',
  },
  styles: `
    :host {
      display: block;
    }

    .drop-zone {
      border: 2px dashed var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 2rem 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      background: var(--surface-card);
    }

    :host.drag-over .drop-zone {
      border-color: var(--accent-primary);
      background: rgba(167, 139, 250, 0.06);
    }

    .drop-zone:focus {
      outline: 2px solid var(--accent-primary);
      outline-offset: 2px;
    }

    .drop-icon {
      font-size: 2rem;
      color: var(--text-muted);
      display: block;
      margin-bottom: 0.75rem;
    }

    .drop-title {
      font-size: 0.925rem;
      color: var(--text-primary);
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .drop-hint {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .progress-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      justify-content: center;
      padding: 1rem 0;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--surface-border);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .progress-text {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #ef4444;
      font-size: 0.825rem;
      padding: 0.6rem 0.875rem;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: var(--radius-md);
      margin-top: 0.75rem;
    }

    input[type="file"] {
      display: none;
    }
  `,
  template: `
    <input
      #fileInput
      type="file"
      accept=".zip"
      aria-hidden="true"
      tabindex="-1"
      (change)="onFileChange($event)"
    />

    @if (isProcessing()) {
      <div class="progress-wrap" role="status" aria-live="polite" aria-label="Procesando archivo ZIP">
        <div class="spinner" aria-hidden="true"></div>
        <span class="progress-text">Procesando tracks de audio…</span>
      </div>
    } @else {
      <div
        class="drop-zone"
        role="button"
        tabindex="0"
        aria-label="Subir archivo ZIP con tracks de audio. Haz clic o arrastra un archivo."
        (click)="triggerInput()"
        (keydown.enter)="triggerInput()"
        (keydown.space)="triggerInput()"
      >
        <i class="pi pi-upload drop-icon" aria-hidden="true"></i>
        <p class="drop-title">Arrastra tu ZIP aquí o haz clic para seleccionar</p>
        <p class="drop-hint">Archivos MP3/WAV • Máximo 200 MB</p>
      </div>
    }

    @if (errorMessage()) {
      <div class="error-msg" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        {{ errorMessage() }}
      </div>
    }
  `,
})
export class ZipUploadComponent {
  readonly filesExtracted = output<ExtractedAudio[]>();
  readonly uploadError = output<string>();

  readonly isProcessing = signal(false);
  readonly isDragOver = signal(false);
  readonly errorMessage = signal('');

  protected readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  triggerInput(): void {
    this.fileInput().nativeElement.click();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processZip(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processZip(file);
  }

  private processZip(file: File): void {
    this.errorMessage.set('');

    if (!file.name.toLowerCase().endsWith('.zip')) {
      this.setError('Solo se aceptan archivos .zip');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      this.setError('El archivo ZIP supera el límite máximo de 200MB');
      return;
    }

    this.isProcessing.set(true);

    const reader = new FileReader();
    reader.onerror = () => {
      this.setError('Error al leer el archivo');
      this.isProcessing.set(false);
    };
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      unzip(data, (err, files) => {
        if (err) {
          this.setError(`Error al descomprimir: ${err.message}`);
          this.isProcessing.set(false);
          return;
        }

        const audioFiles: ExtractedAudio[] = Object.entries(files)
          .filter(
            ([name]) =>
              /\.(mp3|wav)$/i.test(name) &&
              !name.startsWith('__MACOSX') &&
              !name.split('/').pop()!.startsWith('.'),
          )
          .map(([name, bytes]) => ({
            fileName: name.split('/').pop()!,
            buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
          }));

        if (audioFiles.length === 0) {
          this.setError('El ZIP no contiene archivos MP3 o WAV válidos');
          this.isProcessing.set(false);
          return;
        }

        this.filesExtracted.emit(audioFiles);
        this.isProcessing.set(false);
      });
    };
    reader.readAsArrayBuffer(file);
  }

  private setError(msg: string): void {
    this.errorMessage.set(msg);
    this.uploadError.emit(msg);
  }
}
