-- Juris demo workspaces.
-- Run this script only during initial setup or when replacing the old shared demo schema.
-- It removes the legacy public workspace row and its demo data.

drop table if exists public.workspace_state;

create table public.workspace_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '[]'::jsonb,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.workspace_state enable row level security;

revoke all on table public.workspace_state from anon, authenticated;
grant select, insert, update on table public.workspace_state to authenticated;

create policy "Users can read their Juris workspace"
on public.workspace_state for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their Juris workspace"
on public.workspace_state for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their Juris workspace"
on public.workspace_state for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

comment on table public.workspace_state is
'Isolated demo workspaces for anonymous Juris users. Never store real client data.';
