-- ============================================================
-- Musicos App — Supabase Schema
-- ============================================================

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table if not exists songs (
  id           text primary key,
  title        text not null,
  artist       text not null,
  key          text not null,
  bpm          integer not null,
  capo         integer not null default 0,
  youtube      text,
  pdf_url      text,
  content      text not null,
  tags         text[],
  created_at   timestamptz not null default now()
);

create table if not exists setlists (
  id           text primary key,
  name         text not null,
  date         date,
  description  text,
  created_at   timestamptz not null default now()
);

create table if not exists setlist_songs (
  id             uuid primary key default gen_random_uuid(),
  setlist_id     text not null references setlists(id) on delete cascade,
  song_id        text not null references songs(id) on delete cascade,
  "order"        integer not null,
  transposed_key text,
  notes          text
);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table songs        enable row level security;
alter table setlists     enable row level security;
alter table setlist_songs enable row level security;

-- Allow full access to authenticated users only.
-- Adjust these policies to match your auth requirements.

create policy "authenticated read songs"
  on songs for select to authenticated using (true);

create policy "authenticated write songs"
  on songs for all to authenticated using (true) with check (true);

create policy "authenticated read setlists"
  on setlists for select to authenticated using (true);

create policy "authenticated write setlists"
  on setlists for all to authenticated using (true) with check (true);

create policy "authenticated read setlist_songs"
  on setlist_songs for select to authenticated using (true);

create policy "authenticated write setlist_songs"
  on setlist_songs for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- Initial seed data
-- ------------------------------------------------------------

insert into songs (id, title, artist, key, bpm, capo, youtube, pdf_url, tags, content, created_at) values
(
  'song-abres-caminos',
  'Abres Caminos',
  'Marcela Gándara',
  'D',
  132,
  0,
  'https://youtu.be/Ao_pBncalhI?si=L918EnPEir8I-nZa',
  '/pdfs/ABRES CAMINO (ACORDES).pdf',
  array['adoración', 'poderoso'],
  '{comment: Intro}
[G] [D] [A] [Bm]

{comment: Verso 1}
[G]Aquí estás, te vemos mo[D]ver
[A]Te adoraré, te ado[Bm]raré
[G]Aquí estás, obrando en [D]mi
[A]Te adoraré, te ado[Bm]raré

{comment: Coro}
[G]Milagroso, abres camino
[D]Cumples promesas
[A]Luz en tinieblas
[Bm]Mi dios, así eres tú

{comment: Verso 3}
[G]Aquí estás, sanando mi cora[D]zón
[A]Te adoraré, te ado[Bm]raré
[G]Aquí estás, tocando mi cora[D]zón
[A]Te adoraré, te ado[Bm]raré

{comment: Puente}
[G]Aunque no pueda ver
Estás obrando
[D]Aunque no pueda ver
Estás obrando
[A]Siempre estás
Siempre estás obrando
[Bm]Siempre estás
Siempre estás obrando',
  '2026-04-29T00:00:00.000Z'
),
(
  'song-bondad-de-dios',
  'La Bondad de Dios',
  'Church of the City',
  'G',
  136,
  0,
  'https://youtu.be/LveZsAhVbws?si=DEXOvo_0yHR9sqoA',
  '/pdfs/LA BONDAD DE DIOS - G.pdf',
  array['adoración', 'íntimo'],
  '{comment: Verso}
[G]Te amo Dios, Tu amor nunca me fa[C]lla [G]
Mi existir en tus manos es[Em]tá [C] [D]
Desde el momento que des[Em]pierto [C]
Hasta el anoche[G]cer [D/F#] [Em]
[C]Yo cantaré de la bonda[D]d de [G]Dios

{comment: Coro}
[C]En mi vida has sido [G]bueno
[C]En mi vida has sido tan, tan [G]fiel [D]
[C]Con mi ser, con cada a[G]liento [D/F#] [Em]
[C]Yo cantaré de la bonda[D]d de [G]Dios

{comment: Puente}
[G/B]Tu fidelidad sigue persi[C]guién[D]dome [G]
[G/B]Todo lo que soy, Te lo entre[C]go hoy
[D]A Ti me ren[Em]diré
[G/B]Tu fidelidad sigue persi[C]guién[D]dome [G]',
  '2026-04-29T00:00:00.000Z'
),
(
  'song-hossana',
  'Hossana',
  'Marcos Barrientos',
  'Bm',
  146,
  0,
  'https://youtu.be/RHZTk79wAL4?si=P2Vc9cb0xjZSS3YV',
  '/pdfs/Hossana (ACORDES).pdf',
  array['alabanza', 'poderoso'],
  '{comment: Verso 1}
[Bm]Levantamos un [A]clamor
[F#m]Por sanidad y reden[G]ción
[Bm]Muéstranos lo que tu [A]ves
[F#m]Los secretos de tu cora[G]zón
[Bm]Un pueblo unido pi[A]de hoy
[F#m]Tu libertad y salva[G]ción
[Bm]Ármanos con tu va[A]lor
[D/F#]Lo que deseamos es revolu[G]ción

{comment: Precoro}
[G]Que el cielo se parta en dos [A]
[G]Inúndanos
[A]En el desierto broten ríos
[Bm]Vida sopla hoy

{comment: Coro}
[D]Hosanna al rey de salva[Em]ción
Hosanna al Dios Altísimo
[G]Hosanna, Jesucristo, Jesucristo es [A]rey
[Bm]rey

{comment: Puente}
[G]Hosanna Hosanna [A]
[G]Hosanna al [A]rey [G/B] [A/C#]
[G]Hosanna Hosanna [A]
[G]Hosanna al [A]rey [Bm] [A/C#]',
  '2026-04-29T00:00:00.000Z'
)
on conflict (id) do nothing;
