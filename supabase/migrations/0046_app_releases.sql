-- Native app release distribution (starting with Android APK, architected to
-- extend to google_play/app_store/windows/macos/linux later without
-- structural changes - see `platform` check constraint).
--
-- Storage: a PRIVATE bucket (never publicly listable/guessable - downloads
-- only ever happen through the app's own /download/latest route, which
-- fetches bytes server-side via the service-role client and streams them
-- back, or via a short-lived signed URL). No RLS policies on either table:
-- both are service-role-only, gated by requirePlatformAdmin/requirePlatformOwner
-- in application code, matching the platform_moderators pattern.
insert into storage.buckets (id, name, public) values ('app-releases', 'app-releases', false);

create table app_releases (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'android'
    check (platform in ('android', 'google_play', 'app_store', 'windows', 'macos', 'linux')),
  version text not null,
  channel text not null default 'stable' check (channel in ('stable', 'beta', 'alpha')),
  storage_path text not null,
  file_size bigint not null,
  sha256 text not null,
  release_notes text,
  min_supported_version text,
  uploaded_by uuid references auth.users(id) on delete set null,
  is_published boolean not null default false,
  archived_at timestamptz,
  download_count bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (platform, version)
);

-- Enforces "only one release can remain active" per platform at the DB
-- level: publishing a new version must archive/unpublish the previous one
-- in the same transaction, or this index rejects the insert/update.
create unique index app_releases_one_active_per_platform
  on app_releases (platform)
  where is_published and archived_at is null;

alter table app_releases enable row level security;

create table app_release_downloads (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references app_releases(id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

create index app_release_downloads_release_id_idx on app_release_downloads (release_id);
create index app_release_downloads_downloaded_at_idx on app_release_downloads (downloaded_at);

alter table app_release_downloads enable row level security;

-- Atomic counter bump, called right after a download actually starts
-- streaming (not just when the page loads) - see recordDownload in
-- src/lib/data/releases.ts.
create or replace function increment_release_download_count(p_release_id uuid)
returns void as $$
begin
  update app_releases set download_count = download_count + 1 where id = p_release_id;
  insert into app_release_downloads (release_id) values (p_release_id);
end;
$$ language plpgsql security definer;
