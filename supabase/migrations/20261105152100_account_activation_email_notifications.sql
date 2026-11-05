create or replace function public.notify_account_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.activation_status is distinct from new.activation_status
     and new.activation_status = 'Approved'
     and new.is_activated = true then
    insert into public.notifications (user_id, type, message)
    values (
      new.id,
      'AccountApproved'::public.notification_type,
      'Your BorrowIT account has been approved. You can now access the system.'
    );
  elsif old.activation_status is distinct from new.activation_status
        and new.activation_status = 'Rejected' then
    insert into public.notifications (user_id, type, message)
    values (
      new.id,
      'AccountRejected'::public.notification_type,
      case
        when nullif(trim(coalesce(new.rejection_reason, '')), '') is null
          then 'Your BorrowIT account registration was rejected.'
        else 'Your BorrowIT account registration was rejected: ' || new.rejection_reason
      end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists account_review_notification_trigger on public.profiles;
create trigger account_review_notification_trigger
after update of activation_status, is_activated, rejection_reason on public.profiles
for each row execute function public.notify_account_review();
