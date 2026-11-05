grant usage on schema public to authenticated;

grant select on public.clubs to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update on public.membership_requests to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert on public.help_desk_messages to authenticated;

grant usage, select on all sequences in schema public to authenticated;
