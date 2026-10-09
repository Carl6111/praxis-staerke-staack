-- Einmal im Supabase SQL-Editor ausführen, BEVOR der Branch
-- feat/meldungen-mit-datum live geht. Idempotent, gefahrlos wiederholbar.
-- Bestehende Beiträge bleiben unverändert (ohne Datum, Priorität normal).
alter table posts add column if not exists von timestamptz;
alter table posts add column if not exists bis timestamptz;
alter table posts add column if not exists mit_uhrzeit boolean not null default false;
alter table posts add column if not exists prioritaet text not null default 'normal';
do $$ begin
  alter table posts add constraint posts_prioritaet_check check (prioritaet in ('normal', 'dringend'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table posts add constraint posts_zeitraum_check check (von is null or bis is null or bis >= von);
exception when duplicate_object then null; end $$;
create index if not exists posts_bis_idx on posts (bis);
