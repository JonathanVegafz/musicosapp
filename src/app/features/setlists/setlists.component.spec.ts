import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SetlistsComponent } from './setlists.component';
import { SetlistsService } from '../../core/services/setlists.service';
import { mockSetlistsService, sampleSetlist } from '../../testing/mock-services';

function setup(stub = mockSetlistsService()) {
  TestBed.configureTestingModule({
    imports: [SetlistsComponent],
    providers: [provideRouter([]), { provide: SetlistsService, useValue: stub }],
  });
  return { fixture: TestBed.createComponent(SetlistsComponent), stub };
}

describe('SetlistsComponent', () => {
  it('renders the empty state with no setlists', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay setlists todavía');
  });

  it('opens and closes the modal', () => {
    const { fixture } = setup();
    fixture.componentInstance.openModal();
    expect(fixture.componentInstance.showModal()).toBe(true);
    fixture.componentInstance.closeModal();
    expect(fixture.componentInstance.showModal()).toBe(false);
  });

  it('closes the modal on Escape', () => {
    const { fixture } = setup();
    fixture.componentInstance.openModal();
    fixture.componentInstance.onEscape();
    expect(fixture.componentInstance.showModal()).toBe(false);
  });

  it('does not create when the form is invalid', async () => {
    const { fixture, stub } = setup();
    fixture.componentInstance.openModal();
    await fixture.componentInstance.createSetlist();
    expect(stub.create).not.toHaveBeenCalled();
  });

  it('creates a setlist with a date stored as a plain day string', async () => {
    const { fixture, stub } = setup();
    fixture.componentInstance.openModal();
    fixture.componentInstance.createForm.setValue({
      name: 'Servicio',
      date: '2026-12-25',
      description: '',
    });
    await fixture.componentInstance.createSetlist();
    expect(stub.create).toHaveBeenCalledWith({
      name: 'Servicio',
      date: '2026-12-25',
      description: undefined,
    });
  });

  it('formats a date-only string without shifting the day', () => {
    const { fixture } = setup(mockSetlistsService([sampleSetlist()]));
    const formatted = fixture.componentInstance.formatDate('2025-12-25');
    expect(formatted).toContain('25');
    expect(formatted).toContain('diciembre');
  });
});
