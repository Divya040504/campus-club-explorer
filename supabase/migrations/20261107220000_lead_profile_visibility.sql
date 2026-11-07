create policy "Club leads can view requester profiles"
  on public.profiles for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.membership_requests
      where student_id = profiles.id
        and public.is_club_lead(club_id)
    )
    or exists (
      select 1
      from public.event_attendance_requests ear
      join public.events e on e.id = ear.event_id
      where ear.student_id = profiles.id
        and public.is_club_lead(e.club_id)
    )
  );
