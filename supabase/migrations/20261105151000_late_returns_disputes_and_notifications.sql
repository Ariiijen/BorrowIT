create table if not exists public.late_return_events (
  id uuid primary key default gen_random_uuid(),
  borrowing_request_id uuid not null unique references public.borrowing_requests(id) on delete cascade,
  borrower_id text not null references public.profiles(id) on delete cascade,
  days_late integer not null default 0 check (days_late >= 0),
  processed_at timestamptz not null default now()
);

create index if not exists late_return_events_borrower_idx
  on public.late_return_events (borrower_id);

alter table public.late_return_events enable row level security;

revoke all on table public.late_return_events from anon, authenticated;
grant select on table public.late_return_events to authenticated;

drop policy if exists "late_returns_admins_can_manage" on public.late_return_events;
create policy "late_returns_admins_can_manage"
  on public.late_return_events
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "late_returns_users_can_view_own_events" on public.late_return_events;
create policy "late_returns_users_can_view_own_events"
  on public.late_return_events
  for select
  using (borrower_id = public.firebase_uid());

create or replace function public.prevent_borrowing_from_restricted_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restricted boolean;
  v_until timestamptz;
begin
  select is_restricted, restriction_until
  into v_restricted, v_until
  from public.profiles
  where id = new.borrower_id;

  if v_restricted and (v_until is null or v_until > now()) then
    raise exception 'Your account is restricted until %', v_until;
  end if;

  if v_restricted and v_until <= now() then
    update public.profiles
    set is_restricted = false,
        restriction_until = null,
        updated_at = now()
    where id = new.borrower_id;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_restricted_borrowing_trigger on public.borrowing_requests;
create trigger prevent_restricted_borrowing_trigger
before insert on public.borrowing_requests
for each row execute function public.prevent_borrowing_from_restricted_profile();

create or replace function public.process_overdue_rentals()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
  v_processed integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can process overdue rentals';
  end if;

  for v_request in
    select br.*
    from public.borrowing_requests br
    where br.status = 'Borrowed'
      and br.end_date < current_date
      and not exists (
        select 1 from public.late_return_events lre
        where lre.borrowing_request_id = br.id
      )
  loop
    insert into public.late_return_events (
      borrowing_request_id, borrower_id, days_late
    )
    values (
      v_request.id,
      v_request.borrower_id,
      greatest(1, current_date - v_request.end_date)
    );

    update public.profiles
    set late_return_count = late_return_count + 1,
        is_restricted = true,
        restriction_until = greatest(
          coalesce(restriction_until, now()),
          now() + interval '7 days'
        ),
        updated_at = now()
    where id = v_request.borrower_id;

    insert into public.notifications (user_id, type, message)
    values (
      v_request.borrower_id,
      'Overdue',
      'Your borrowed equipment is overdue. Your account is restricted for 7 days from this overdue event.'
    );
    v_processed := v_processed + 1;
  end loop;

  update public.profiles
  set is_restricted = false,
      restriction_until = null,
      updated_at = now()
  where is_restricted = true
    and restriction_until is not null
    and restriction_until <= now();

  return v_processed;
end;
$$;

revoke all on function public.process_overdue_rentals() from public;
grant execute on function public.process_overdue_rentals() to authenticated;

create or replace function public.record_late_return_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.borrowing_requests%rowtype;
begin
  select * into v_request
  from public.borrowing_requests
  where id = new.borrowing_request_id;

  if v_request.id is not null and v_request.end_date < new.returned_at::date
     and not exists (
       select 1 from public.late_return_events
       where borrowing_request_id = v_request.id
     ) then
    insert into public.late_return_events (
      borrowing_request_id, borrower_id, days_late
    )
    values (
      v_request.id,
      v_request.borrower_id,
      new.returned_at::date - v_request.end_date
    );

    update public.profiles
    set late_return_count = late_return_count + 1,
        is_restricted = true,
        restriction_until = greatest(
          coalesce(restriction_until, now()),
          now() + interval '7 days'
        ),
        updated_at = now()
    where id = v_request.borrower_id;

    insert into public.notifications (user_id, type, message)
    values (
      v_request.borrower_id,
      'Overdue',
      'The equipment was returned late. Your account is restricted for 7 days.'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists record_late_return_event_trigger on public.return_record;
create trigger record_late_return_event_trigger
after insert on public.return_record
for each row execute function public.record_late_return_event();

create or replace function public.create_dispute_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message text;
begin
  if tg_op = 'INSERT' then
    v_message := 'A dispute was filed for borrowing request ' || new.borrowing_request_id::text || '.';
    insert into public.notifications (user_id, type, message)
    values (new.against_user_id, 'DisputeFiled', v_message);
    insert into public.notifications (user_id, type, message)
    select id, 'DisputeFiled', v_message
    from public.profiles
    where role = 'Admin';
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    v_message := 'Your dispute status changed to ' || new.status || '.';
    if new.resolution_notes is not null and btrim(new.resolution_notes) <> '' then
      v_message := v_message || ' Resolution notes: ' || new.resolution_notes;
    end if;
    insert into public.notifications (user_id, type, message)
    values (new.reporter_id, 'DisputeFiled', v_message);
    insert into public.notifications (user_id, type, message)
    values (new.against_user_id, 'DisputeFiled', v_message);
  end if;
  return new;
end;
$$;

drop trigger if exists dispute_notifications_trigger on public.dispute;
create trigger dispute_notifications_trigger
after insert or update on public.dispute
for each row execute function public.create_dispute_notifications();

create or replace function public.create_notification_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email
  from public.profiles
  where id = new.user_id;

  if v_email is not null then
    insert into public.notification_delivery (
      notification_id, email, status
    )
    values (
      new.id, lower(v_email), 'Pending'
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists notification_delivery_trigger on public.notifications;
create trigger notification_delivery_trigger
after insert on public.notifications
for each row execute function public.create_notification_delivery();
