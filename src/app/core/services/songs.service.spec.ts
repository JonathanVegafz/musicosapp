import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SongsService } from './songs.service';
import { SupabaseService } from './supabase.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockSongRow = (overrides = {}) => ({
  id: 'song-1',
  title: 'Cristo Vive',
  artist: 'Hillsong',
  key: 'G',
  bpm: 120,
  capo: 0,
  youtube: null,
  content: '[G]Cristo vive',
  tags: ['adoración'],
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

function buildMockSupabase(data: unknown[] | unknown = [], error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error });
  const select = vi.fn().mockReturnValue({ single, order: vi.fn().mockResolvedValue({ data, error }) });
  const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }) });
  const del = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error }) });
  const from = vi.fn().mockReturnValue({ select, insert, update, delete: del });
  return { client: { from } };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SongsService', () => {
  let mockSb: ReturnType<typeof buildMockSupabase>;
  let platformId: string;

  beforeEach(() => {
    mockSb = buildMockSupabase([mockSongRow()]);
    platformId = 'browser';
  });

  // Configure providers via factories so the mock can be chosen per-test
  // BEFORE the service is instantiated (overrideProvider after inject is illegal).
  function setup(): SongsService {
    TestBed.configureTestingModule({
      providers: [
        SongsService,
        { provide: SupabaseService, useFactory: () => mockSb },
        { provide: PLATFORM_ID, useFactory: () => platformId },
      ],
    });
    return TestBed.inject(SongsService);
  }

  // ── init ────────────────────────────────────────────────────────────────────

  describe('init()', () => {
    it('populates songs signal from Supabase on browser', async () => {
      const service = setup();
      await service.init();
      expect(service.songs()).toHaveLength(1);
      expect(service.songs()[0].title).toBe('Cristo Vive');
    });

    it('maps snake_case columns to camelCase', async () => {
      const service = setup();
      await service.init();
      const song = service.songs()[0];
      expect(song.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(song.id).toBe('song-1');
    });

    it('sets empty array and error message when Supabase returns error', async () => {
      mockSb = buildMockSupabase([], { message: 'network error' });
      const service = setup();
      await service.init();
      expect(service.songs()).toHaveLength(0);
      expect(service.error()).toBe('network error');
    });

    it('toggles loading off after completing', async () => {
      const service = setup();
      await service.init();
      expect(service.loading()).toBe(false);
    });

    it('does nothing when platform is server', async () => {
      platformId = 'server';
      const service = setup();
      await service.init();
      expect(service.songs()).toHaveLength(0);
    });
  });

  // ── search ───────────────────────────────────────────────────────────────────

  describe('search()', () => {
    let service: SongsService;

    beforeEach(async () => {
      mockSb = buildMockSupabase([
        mockSongRow({ id: '1', title: 'Cristo Vive', artist: 'Hillsong', key: 'G', tags: ['adoración'] }),
        mockSongRow({ id: '2', title: 'Waymaker', artist: 'Sinach', key: 'A', tags: ['fe'] }),
        mockSongRow({ id: '3', title: 'Goodness of God', artist: 'Bethel', key: 'G', tags: ['adoración', 'fe'] }),
      ]);
      service = setup();
      await service.init();
    });

    it('returns all songs with empty query and no key filter', () => {
      expect(service.search('', undefined)).toHaveLength(3);
    });

    it('filters by title (case-insensitive)', () => {
      const results = service.search('cristo', undefined);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Cristo Vive');
    });

    it('filters by artist (case-insensitive)', () => {
      const results = service.search('hillsong', undefined);
      expect(results).toHaveLength(1);
    });

    it('filters by key', () => {
      const results = service.search('', 'G');
      expect(results).toHaveLength(2);
    });

    it('combines title and key filters', () => {
      const results = service.search('god', 'G');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Goodness of God');
    });

    it('returns empty array when no match', () => {
      expect(service.search('zzz', undefined)).toHaveLength(0);
    });

    it('filters by exact artist', () => {
      const results = service.search('', undefined, 'Bethel');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Goodness of God');
    });

    it('filters by any matching tag', () => {
      const results = service.search('', undefined, undefined, ['fe']);
      expect(results.map((s) => s.title).sort()).toEqual(['Goodness of God', 'Waymaker']);
    });

    it('combines artist and tag filters', () => {
      const results = service.search('', undefined, 'Bethel', ['fe']);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Goodness of God');
    });
  });

  // ── artists / tags ───────────────────────────────────────────────────────────

  describe('artists and tags', () => {
    it('returns distinct, sorted artists and tags', async () => {
      mockSb = buildMockSupabase([
        mockSongRow({ id: '1', artist: 'Sinach', tags: ['fe'] }),
        mockSongRow({ id: '2', artist: 'Bethel', tags: ['adoración', 'fe'] }),
        mockSongRow({ id: '3', artist: 'Bethel', tags: undefined }),
      ]);
      const service = setup();
      await service.init();

      expect(service.artists()).toEqual(['Bethel', 'Sinach']);
      expect(service.tags()).toEqual(['adoración', 'fe']);
    });
  });

  // ── recentSongs ──────────────────────────────────────────────────────────────

  describe('recentSongs', () => {
    it('returns at most 5 songs ordered by newest first', async () => {
      // Supabase returns rows already ordered by created_at DESC; recentSongs trusts that.
      const rows = Array.from({ length: 7 }, (_, i) =>
        mockSongRow({ id: String(i), title: `Song ${i}`, created_at: `2024-0${7 - i}-01T00:00:00Z` }),
      );
      mockSb = buildMockSupabase(rows);
      const service = setup();
      await service.init();

      const recent = service.recentSongs();
      expect(recent).toHaveLength(5);
      expect(new Date(recent[0].createdAt) >= new Date(recent[1].createdAt)).toBe(true);
    });
  });

  // ── getById ──────────────────────────────────────────────────────────────────

  describe('getById()', () => {
    let service: SongsService;

    beforeEach(async () => {
      service = setup();
      await service.init();
    });

    it('returns song when it exists', () => {
      expect(service.getById('song-1')?.title).toBe('Cristo Vive');
    });

    it('returns undefined when not found', () => {
      expect(service.getById('nonexistent')).toBeUndefined();
    });
  });
});
