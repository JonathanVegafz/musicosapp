import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { YouTubeEmbedComponent } from './youtube-embed.component';

@Component({
  standalone: true,
  imports: [YouTubeEmbedComponent],
  template: `<app-youtube-embed [url]="url" />`,
})
class HostComponent {
  url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
}

describe('YouTubeEmbedComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
  });

  it('renders a toggle button', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.yt-toggle')).toBeTruthy();
  });

  it('does not render iframe by default', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
  });

  it('shows iframe after clicking toggle', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.yt-toggle').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeTruthy();
  });

  it('hides iframe after toggling twice', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector('.yt-toggle');
    toggle.click();
    fixture.detectChanges();
    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
  });

  it('uses embed URL format in iframe src', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.yt-toggle').click();
    fixture.detectChanges();
    const iframe = fixture.nativeElement.querySelector('iframe');
    expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('handles youtu.be short URL format', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.url = 'https://youtu.be/dQw4w9WgXcQ';
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.yt-toggle').click();
    fixture.detectChanges();
    const iframe = fixture.nativeElement.querySelector('iframe');
    expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('does not render iframe for invalid URL', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.url = 'https://vimeo.com/12345';
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.yt-toggle').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
  });

  it('toggle button has aria-expanded attribute', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.yt-toggle');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });
});
