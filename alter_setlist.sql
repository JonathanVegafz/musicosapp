-- ============================================================
-- Musicos App — Alter: setlist_members
-- Agrega una tabla flexible de turnos/roles por setlist.
-- Cada fila representa una persona y lo que hará (ej. "bajo").
-- ============================================================

create table if not exists setlist_members (
  id          uuid primary key default gen_random_uuid(),
  setlist_id  text not null references setlists(id) on delete cascade,
  name        text not null,
  role        text not null,
  "order"     integer not null default 0
);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table setlist_members enable row level security;

create policy "authenticated read setlist_members"
  on setlist_members for select to authenticated using (true);

create policy "authenticated write setlist_members"
  on setlist_members for all to authenticated using (true) with check (true);
