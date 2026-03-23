import { Setlist } from '../../types';

export const SETLISTS_SEED: Setlist[] = [
  {
    id: '1',
    name: 'Servicio Dominical',
    date: '2026-03-15T10:00:00Z',
    description: 'Servicio del domingo por la mañana',
    createdAt: '2026-03-13T00:00:00Z',
    songs: [
      { songId: '2', order: 1 },
      { songId: '1', order: 2 },
      { songId: '3', order: 3 },
    ],
  },
  {
    id: '2',
    name: 'Ensayo Miércoles',
    date: '2026-03-18T19:00:00Z',
    description: 'Ensayo general del equipo de alabanza',
    createdAt: '2026-03-13T00:00:00Z',
    songs: [
      { songId: '4', order: 1 },
      { songId: '1', order: 2 },
      { songId: '2', order: 3 },
    ],
  },
];
