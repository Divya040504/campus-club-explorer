import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

function formatEventDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function emptyForm(clubId = '') {
  return { clubId, title: '', description: '', venue: '', startsAt: '', endsAt: '' };
}

export function EventsPage({ session, userRole, onClose }) {
  const [events, setEvents] = useState([]);
  const [attendanceRequests, setAttendanceRequests] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleWarning, setScheduleWarning] = useState('');
  const canManageEvents = userRole === 'admin' || userRole === 'club_lead';

  async function loadEvents() {
    setIsLoading(true);
    setError('');
    const eventsQuery = supabase
      .from('events')
      .select('id, club_id, title, description, venue, starts_at, ends_at, clubs(name)')
      .order('starts_at');
    const attendanceQuery = supabase
      .from('event_attendance_requests')
      .select('id, event_id, status')
      .eq('student_id', session.user.id);
    const clubsQuery = supabase
      .from('clubs')
      .select('id, name, venue, lead_id')
      .order('name');
    const [{ data: eventData, error: eventsError }, { data: clubData, error: clubsError }, { data: attendanceData, error: attendanceError }] = await Promise.all([eventsQuery, clubsQuery, attendanceQuery]);

    if (eventsError || clubsError || attendanceError) {
      setError(eventsError?.message || clubsError?.message || attendanceError.message);
    } else {
      const visibleClubs = userRole === 'club_lead'
        ? clubData.filter((club) => club.lead_id === session.user.id)
        : clubData;
      setClubs(visibleClubs);
      const visibleEvents = userRole === 'club_lead'
        ? eventData.filter((event) => visibleClubs.some((club) => club.id === event.club_id))
        : eventData;
      setEvents(visibleEvents);
      setAttendanceRequests(attendanceData);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (isFormOpen) checkSchedule();
  }, [form.clubId, form.venue, form.startsAt, form.endsAt, events, isFormOpen]);

  const manageableClubs = useMemo(() => clubs, [clubs]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateForm() {
    const firstClub = manageableClubs[0];
    setForm(emptyForm(firstClub?.id || ''));
    setError('');
    setMessage('');
    setScheduleWarning('');
    setIsFormOpen(true);
  }

  function checkSchedule() {
    const selectedClub = manageableClubs.find((club) => String(club.id) === String(form.clubId));
    const startsAt = new Date(form.startsAt);
    const endsAt = new Date(form.endsAt);

    if (!selectedClub || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      setScheduleWarning('');
      return;
    }

    const venue = (form.venue || selectedClub.venue).trim().toLowerCase();
    const overlappingEvent = events.find((existingEvent) => (
      existingEvent.venue.trim().toLowerCase() === venue
      && startsAt < new Date(existingEvent.ends_at)
      && endsAt > new Date(existingEvent.starts_at)
    ));

    if (overlappingEvent) {
      setScheduleWarning(`Venue conflict: "${overlappingEvent.title}" already uses ${overlappingEvent.venue} during this time.`);
      return;
    }

    const sameDayEvent = events.find((existingEvent) => (
      existingEvent.club_id === Number(form.clubId)
      && startsAt.toDateString() === new Date(existingEvent.starts_at).toDateString()
    ));

    setScheduleWarning(sameDayEvent
      ? `Same-day notice: "${sameDayEvent.title}" is already scheduled for this club on this date.`
      : '');
  }

  async function createEvent(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setScheduleWarning('');
    const selectedClub = manageableClubs.find((club) => String(club.id) === String(form.clubId));
    const startsAt = new Date(form.startsAt);
    const endsAt = new Date(form.endsAt);
    const venue = (form.venue || selectedClub?.venue || '').trim();

    if (!selectedClub || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      setError('Choose a club and a valid time range before saving the event.');
      return;
    }

    const overlappingEvent = events.find((existingEvent) => (
      existingEvent.venue.trim().toLowerCase() === venue.toLowerCase()
      && startsAt < new Date(existingEvent.ends_at)
      && endsAt > new Date(existingEvent.starts_at)
    ));

    if (overlappingEvent) {
      setError(`This venue is already booked by "${overlappingEvent.title}" during that time.`);
      return;
    }

    const { data: conflictingEvents, error: conflictQueryError } = await supabase
      .from('events')
      .select('id, title, venue, starts_at, ends_at')
      .eq('venue', venue)
      .lt('starts_at', endsAt.toISOString())
      .gt('ends_at', startsAt.toISOString())
      .limit(1);

    if (conflictQueryError) {
      setError(`We could not verify the venue schedule: ${conflictQueryError.message}`);
      return;
    }

    if (conflictingEvents.length > 0) {
      setError(`This venue is already booked by "${conflictingEvents[0].title}" during that time.`);
      setScheduleWarning(`Venue conflict: "${conflictingEvents[0].title}" already uses ${conflictingEvents[0].venue} during this time.`);
      return;
    }

    const { data, error: createError } = await supabase
      .from('events')
      .insert({
        club_id: form.clubId,
        title: form.title,
        description: form.description,
        venue,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        created_by: session.user.id,
      })
      .select('id, club_id, title, description, venue, starts_at, ends_at, clubs(name)')
      .single();

    if (createError) {
      setError(createError.code === '23P01'
        ? 'This venue is already booked during that time. Choose another venue or time.'
        : createError.message);
      return;
    }

    setEvents((current) => [...current, data].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)));
    setForm(emptyForm());
    setIsFormOpen(false);
    setMessage('Event created successfully.');
  }

  async function deleteEvent(eventId) {
    setError('');
    setMessage('');
    const { error: deleteError } = await supabase.from('events').delete().eq('id', eventId);
    if (deleteError) setError(deleteError.message);
    else {
      setEvents((current) => current.filter((event) => event.id !== eventId));
      setMessage('Event deleted.');
    }
  }

  async function requestAttendance(eventId) {
    setError('');
    setMessage('');
    const { data, error: requestError } = await supabase
      .from('event_attendance_requests')
      .insert({ event_id: eventId, student_id: session.user.id })
      .select('id, event_id, status')
      .single();

    if (requestError) {
      setError(requestError.code === '23505' ? 'You already requested to attend this event.' : requestError.message);
    } else {
      setAttendanceRequests((current) => [...current, data]);
      setMessage('Attendance request submitted.');
    }
  }

  async function cancelAttendance(requestId) {
    setError('');
    setMessage('');
    const { error: cancelError } = await supabase
      .from('event_attendance_requests')
      .delete()
      .eq('id', requestId);

    if (cancelError) setError(cancelError.message);
    else {
      setAttendanceRequests((current) => current.filter((request) => request.id !== requestId));
      setMessage('Attendance request cancelled.');
    }
  }

  return (
    <main className="events-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Campus calendar</p>
          <h1>Upcoming club events</h1>
        </div>
        <div className="events-heading-actions">
          {onClose && <button className="details-button" type="button" onClick={onClose}>Back to clubs</button>}
          {canManageEvents && manageableClubs.length > 0 && <button className="join-button" type="button" onClick={openCreateForm}>Create event</button>}
        </div>
      </div>
      {error && <p className="form-message error-message" role="alert">{error}</p>}
      {message && <p className="form-message success-message" role="status">{message}</p>}
      {isFormOpen && (
        <form className="admin-panel event-form" onSubmit={createEvent}>
          <div className="admin-panel-heading"><h2>Create event</h2><button className="close-button" type="button" onClick={() => setIsFormOpen(false)} aria-label="Close event form">×</button></div>
          <div className="event-form-grid">
            <label>Club
              <select value={form.clubId} onChange={(event) => updateField('clubId', event.target.value)} required>
                <option value="">Select a club</option>
                {manageableClubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}
              </select>
            </label>
            <label>Event title<input value={form.title} onChange={(event) => updateField('title', event.target.value)} required /></label>
            <label>Venue<input value={form.venue} onChange={(event) => updateField('venue', event.target.value)} placeholder="e.g. VBTF 06" required /></label>
            <label>Starts<input type="datetime-local" value={form.startsAt} onChange={(event) => updateField('startsAt', event.target.value)} required /></label>
            <label>Ends<input type="datetime-local" value={form.endsAt} onChange={(event) => updateField('endsAt', event.target.value)} required /></label>
            <label className="event-description">Description<textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows="3" /></label>
          </div>
          {scheduleWarning && <p className="form-message warning-message" role="status">{scheduleWarning}</p>}
          <button className="auth-submit" type="submit">Save event</button>
        </form>
      )}
      {isLoading ? <p className="loading-state">Loading events...</p> : events.length === 0 ? (
        <p className="empty-state">No events have been scheduled yet.</p>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <div className="event-date">{formatEventDate(event.starts_at)}</div>
              <h2>{event.title}</h2>
              <p className="event-club">{event.clubs?.name} · {event.venue}</p>
              <p>{event.description || 'Join the club community for this event.'}</p>
              <p className="event-time">Until {formatEventDate(event.ends_at)}</p>
              {userRole === 'student' && (() => {
                const attendance = attendanceRequests.find((request) => request.event_id === event.id);
                if (!attendance) return <button className="join-button" type="button" onClick={() => requestAttendance(event.id)}>Request to attend</button>;
                return (
                  <div className="event-attendance">
                    <span className={`request-status ${attendance.status}`}>Attendance {attendance.status}</span>
                    {attendance.status === 'pending' && <button className="details-button" type="button" onClick={() => cancelAttendance(attendance.id)}>Cancel request</button>}
                  </div>
                );
              })()}
              {canManageEvents && <button className="details-button" type="button" onClick={() => deleteEvent(event.id)}>Delete event</button>}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
