do $$
declare
  column_row record;
begin
  for column_row in
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and (
        (table_name = 'profiles' and column_name = 'id') or
        (table_name = 'equipment' and column_name = 'owner_id') or
        (table_name = 'borrowing_requests' and column_name in ('borrower_id', 'lender_id')) or
        (table_name = 'notifications' and column_name = 'user_id') or
        (table_name = 'lending' and column_name in ('lender_id', 'borrower_id')) or
        (table_name = 'return_record' and column_name = 'borrower_id') or
        (table_name = 'dispute' and column_name in ('reporter_id', 'against_user_id')) or
        (table_name = 'audit_log' and column_name = 'actor_id') or
        (table_name = 'rental_extensions' and column_name in ('requester_id', 'approved_by')) or
        (table_name = 'late_return_flags' and column_name = 'borrower_id')
      )
  loop
    if column_row.data_type <> 'text' then
      raise exception 'Expected text but found % for %.%',
        column_row.data_type, column_row.table_name, column_row.column_name;
    end if;
  end loop;
end;
$$;