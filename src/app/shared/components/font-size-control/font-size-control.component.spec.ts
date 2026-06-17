import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FontSizeControlComponent } from './font-size-control.component';
import { FontSize } from '../../../types';

@Component({
  standalone: true,
  imports: [FontSizeControlComponent],
  template: `
    <app-font-size-control [current]="current" (sizeChange)="onChange($event)" />
  `,
})
class HostComponent {
  current: FontSize = 'normal';
  onChange = vi.fn();
}

describe('FontSizeControlComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('renders 3 size buttons', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.size-btn');
    expect(buttons).toHaveLength(3);
  });

  it('marks the current size as active', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.current = 'large';
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.size-btn');
    // Second button (large) should be active
    expect(buttons[1].classList.contains('active')).toBe(true);
    expect(buttons[0].classList.contains('active')).toBe(false);
  });

  it('emits the selected size when clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.size-btn');
    buttons[2].click(); // xlarge
    expect(fixture.componentInstance.onChange).toHaveBeenCalledWith('xlarge');
  });

  it('buttons have aria-label and aria-pressed attributes', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.current = 'normal';
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.size-btn');
    buttons.forEach((btn: HTMLButtonElement) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
      expect(btn.getAttribute('aria-pressed')).toBeDefined();
    });
  });
});
