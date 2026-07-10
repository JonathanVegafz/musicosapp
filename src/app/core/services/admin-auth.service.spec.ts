import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AdminAuthService } from './admin-auth.service';

const STORAGE_KEY = 'musicos-admin-unlocked';

function setup(platformId = 'browser'): AdminAuthService {
  TestBed.configureTestingModule({
    providers: [AdminAuthService, { provide: PLATFORM_ID, useValue: platformId }],
  });
  return TestBed.inject(AdminAuthService);
}

describe('AdminAuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts locked when nothing is stored', () => {
    const service = setup();
    expect(service.unlocked()).toBe(false);
  });

  it('starts unlocked when a prior unlock was persisted', () => {
    localStorage.setItem(STORAGE_KEY, '1');
    const service = setup();
    expect(service.unlocked()).toBe(true);
  });

  it('resolves requestUnlock immediately without opening the modal when already unlocked', async () => {
    localStorage.setItem(STORAGE_KEY, '1');
    const service = setup();
    const granted = await service.requestUnlock();
    expect(granted).toBe(true);
    expect(service.visible()).toBe(false);
  });

  it('opens the modal and resolves true on the correct code', async () => {
    const service = setup();
    const pending = service.requestUnlock();
    expect(service.visible()).toBe(true);

    service.submit('musicosadmin1234');
    expect(await pending).toBe(true);
    expect(service.unlocked()).toBe(true);
    expect(service.visible()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
  });

  it('keeps the modal open and sets an error on a wrong code', async () => {
    const service = setup();
    service.requestUnlock();

    service.submit('wrong-code');
    expect(service.unlocked()).toBe(false);
    expect(service.visible()).toBe(true);
    expect(service.errorMsg()).toBeTruthy();
  });

  it('resolves false and stays locked on cancel', async () => {
    const service = setup();
    const pending = service.requestUnlock();

    service.cancel();
    expect(await pending).toBe(false);
    expect(service.unlocked()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('does not read localStorage on the server platform', () => {
    const service = setup('server');
    expect(service.unlocked()).toBe(false);
  });
});
