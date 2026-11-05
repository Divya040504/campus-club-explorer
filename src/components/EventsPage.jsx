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
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const canManageEvents = userRole === 'admin' || userRole === 'club_lead';

  async function loadEvents() {
    setIsLoading(true);
    setError('');
    const eventsQuery = supabase
      .from('events')
      .select('id, club_id, title, description, venue, starts_at, ends_at, clubs(name)')
      .order('starts_at');
    const clubsQuery = supabase
      .from('clubs')
      .select('id, name, venue, lead_id')
      .order('name');
    const [{ data: eventData, error: eventsError }, { data: clubData, error: clubsError }] = await Promise.all([eventsQuery, clubsQuery]);

    if (eventsError || clubsError) {
      setError(eventsError?.message || clubsError.message);
    } else {
      const visibleClubs = userRole === 'club_lead'
        ? clubData.filter((club) => club.lead_id === session.user.id)
        : clubData;
      setClubs(visibleClubs);
      setEvents(eventData);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const manageableClubs = useMemo(() => clubs, [clubs]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateForm() {
    const firstClub = manageableClubs[0];
    setForm(emptyForm(firstClub?.id || ''));
    setError('');
    setMessage('');
    setIsFormOpen(true);
  }

  async function createEvent(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    const selectedClub = manageableClubs.find((club) => String(club.id) === String(form.clubId));
    const { data, error: createError } = await supabase
      .from('events')
      .insert({
        club_id: form.clubId,
        title: form.title,
        description: form.description,
        venue: form.venue || selectedClub?.venue,
        starts_at: new Date(form.startsAt).toISOString(),
        ends_at: new Date(form.endsAt).toISOString(),
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
              {canManageEvents && <button className="details-button" type="button" onClick={() => deleteEvent(event.id)}>Delete event</button>}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
