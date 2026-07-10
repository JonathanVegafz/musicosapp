import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TransposeControlComponent } from './transpose-control.component';

// ── Helper host ───────────────────────────────────────────────────────────────

@Component({
  standalone: true,
  imports: [TransposeControlComponent],
  template: `
    <app-transpose-control
      [originalKey]="key"
      [semitones]="semitones"
      (transposeChange)="onChange($event)"
    />
  `,
})
class HostComponent {
  key = 'G';
  semitones = 0;
  onChange = vi.fn();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TransposeControlComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('displays the original key when semitones is 0', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const display = fixture.nativeElement.querySelector('.key-display');
    expect(display?.textContent?.trim()).toContain('G');
  });

  it('emits +1 when up button is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const upBtn = buttons[1]; // + button
    upBtn.click();
    expect(fixture.componentInstance.onChange).toHaveBeenCalledWith(1);
  });

  it('emits -1 when down button is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const downBtn = buttons[0]; // − button
    downBtn.click();
    expect(fixture.componentInstance.onChange).toHaveBeenCalledWith(-1);
  });

  it('disables up button at max semitones (+12)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.semitones = 12;
    fixture.detectChanges();
    const upBtn = fixture.nativeElement.querySelectorAll('button')[1];
    expect(upBtn.disabled).toBe(true);
  });

  it('does not disable up button below the +12 limit', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.semitones = 6;
    fixture.detectChanges();
    const upBtn = fixture.nativeElement.querySelectorAll('button')[1];
    expect(upBtn.disabled).toBe(false);
  });

  it('disables down button at min semitones (-12)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.semitones = -12;
    fixture.detectChanges();
    const downBtn = fixture.nativeElement.querySelectorAll('button')[0];
    expect(downBtn.disabled).toBe(true);
  });

  it('displays the transposed key when semitones is non-zero', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.key = 'G';
    fixture.componentInstance.semitones = 2;
    fixture.detectChanges();
    const display = fixture.nativeElement.querySelector('.key-display');
    // G + 2 semitones = A
    expect(display?.textContent).toContain('A');
  });

  it('transposes minor keys instead of leaving them unchanged', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.key = 'Bm';
    fixture.componentInstance.semitones = 2;
    fixture.detectChanges();
    const display = fixture.nativeElement.querySelector('.key-display');
    // Bm + 2 semitones = C#m
    expect(display?.textContent).toContain('C#m');
  });

  it('shows semitone delta indicator when transposed', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.semitones = 3;
    fixture.detectChanges();
    const delta = fixture.nativeElement.querySelector('.key-delta');
    expect(delta?.textContent).toContain('+3');
  });

  it('hides delta when semitones is 0', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.semitones = 0;
    fixture.detectChanges();
    const delta = fixture.nativeElement.querySelector('.key-delta');
    expect(delta).toBeNull();
  });

  it('has aria-label on buttons for accessibility', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons.forEach((btn: HTMLButtonElement) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
