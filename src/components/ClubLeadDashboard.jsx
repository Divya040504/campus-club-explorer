import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EventsPage } from './EventsPage';
import { ProfilePage } from './ProfilePage';
import { ThemeToggle } from './ThemeToggle';

export function ClubLeadDashboard({ session, onSignOut }) {
  const [clubs, setClubs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [attendanceRequests, setAttendanceRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [memberCounts, setMemberCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  async function loadLeadData() {
    setIsLoading(true);
    setError('');
    const { data: clubData, error: clubsError } = await supabase
      .from('clubs')
      .select('id, name, category, venue')
      .eq('lead_id', session.user.id)
      .order('name');

    if (clubsError) {
      setError(clubsError.message);
      setIsLoading(false);
      return;
    }

    setClubs(clubData);
    if (clubData.length === 0) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    const [{ data: requestData, error: requestsError }, { data: eventData, error: eventsError }] = await Promise.all([
      supabase
      .from('membership_requests')
      .select('id, club_id, student_id, message, status, created_at, student:profiles!membership_requests_student_id_fkey(full_name), clubs(name)')
      .in('club_id', clubData.map((club) => club.id))
      .order('created_at', { ascending: false }),
      supabase
        .from('events')
        .select('id, club_id, title, venue, starts_at, ends_at, clubs(name)')
        .in('club_id', clubData.map((club) => club.id))
        .order('starts_at'),
    ]);

    if (requestsError || eventsError) {
      setError(requestsError?.message || eventsError.message);
      setIsLoading(false);
      return;
    }

    const eventIds = eventData.map((event) => event.id);
    const attendanceResult = eventIds.length > 0
      ? await supabase
        .from('event_attendance_requests')
        .select('id, event_id, student_id, status, created_at, events(title, starts_at, clubs(name)), student:profiles!event_attendance_requests_student_id_fkey(full_name)')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })
      : { data: [], error: null };

    if (attendanceResult.error) {
      setError(attendanceResult.error.message);
      setIsLoading(false);
      return;
    }

    const counts = Object.fromEntries(clubData.map((club) => [club.id, 0]));
    requestData.forEach((request) => {
      if (request.status === 'approved') counts[request.club_id] += 1;
    });
    setMemberCounts(counts);
    setEvents(eventData);
    setAttendanceRequests(attendanceResult.data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadLeadData();
  }, []);

  async function reviewRequest(requestId, status) {
    setError('');
    setMessage('');
    const { error: updateError } = await supabase
      .from('membership_requests')
      .update({
        status,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setRequests((current) => current.map((request) => (
        request.id === requestId ? { ...request, status } : request
      )));
      setMessage(`Request ${status}.`);
    }
  }

  async function reviewAttendanceRequest(requestId, status) {
      setError('');
      setMessage('');
      const { error: updateError } = await supabase
        .from('event_attendance_requests')
        .update({
          status,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) setError(updateError.message);
      else {
        setAttendanceRequests((current) => current.map((request) => (
          request.id === requestId ? { ...request, status } : request
        )));
        setMessage(`Event attendance request ${status}.`);
      }
  }

  const pendingMembershipCount = requests.filter((request) => request.status === 'pending').length;
  const pendingAttendanceCount = attendanceRequests.filter((request) => request.status === 'pending').length;
  const upcomingEvents = events.filter((event) => new Date(event.starts_at) >= new Date());
  const attendanceByEvent = attendanceRequests.reduce((summary, request) => {
    const current = summary[request.event_id] || { approved: 0, pending: 0 };
    current[request.status] = (current[request.status] || 0) + 1;
    return { ...summary, [request.event_id]: current };
  }, {});

  if (isProfileOpen) {
    return <ProfilePage session={session} userRole="club_lead" onBack={() => setIsProfileOpen(false)} onSignOut={onSignOut} />;
  }

  return (
    <>
      <header className="navbar">
        <a className="brand" href="/" aria-label="Campus Club Explorer home">
          <span className="brand-mark">CC</span>
          <span>Campus Club Explorer</span>
        </a>
        <div className="navbar-actions">
          <button className="profile-button" type="button" onClick={() => setIsProfileOpen(true)} aria-label="Open your profile">
            <span className="profile-button-avatar" aria-hidden="true">U</span>
            <span>Profile</span>
          </button>
          <ThemeToggle />
          <button className="sign-out-button" type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </header>
      <main className="admin-page">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">Club lead portal</p>
            <h1>Support your club community</h1>
          </div>
          <button className="details-button" type="button" onClick={loadLeadData}>Refresh</button>
        </div>
        {error && <p className="form-message error-message" role="alert">{error}</p>}
        {message && <p className="form-message success-message" role="status">{message}</p>}
        {isLoading ? <p className="loading-state">Loading club requests...</p> : (
          <>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="eyebrow">Your responsibility</p>
                  <h2>Assigned clubs</h2>
                </div>
                <span className="result-count">{clubs.length} clubs</span>
              </div>
              {clubs.length > 0 ? (
                <div className="assigned-clubs">
                  {clubs.map((club) => <div className="assigned-club" key={club.id}><strong>{club.name}</strong><span>{club.category} · {club.venue} · {memberCounts[club.id] || 0} members</span></div>)}
                </div>
              ) : <p className="empty-drawer">No club has been assigned to this account yet.</p>}
            </section>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div><p className="eyebrow">Schedule</p><h2>Upcoming events</h2></div>
                <span className="result-count">{upcomingEvents.length} events</span>
              </div>
              {upcomingEvents.length > 0 ? (
                <div className="admin-list">
                  {upcomingEvents.map((event) => {
                    const counts = attendanceByEvent[event.id] || { approved: 0, pending: 0 };
                    return (
                      <div className="admin-row" key={event.id}>
                        <div>
                          <strong>{event.title}</strong>
                          <span>{event.clubs?.name} · {event.venue} · {new Date(event.starts_at).toLocaleString()}</span>
                        </div>
                        <span className="event-counts">{counts.approved} approved · {counts.pending} pending</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="empty-drawer">No upcoming events for your assigned clubs.</p>}
            </section>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div><p className="eyebrow">Club overview</p><h2>Activity summary</h2></div>
              </div>
              <div className="profile-stats">
                <div><strong>{pendingMembershipCount}</strong><span>Pending membership requests</span></div>
                <div><strong>{upcomingEvents.length}</strong><span>Upcoming events</span></div>
                <div><strong>{pendingAttendanceCount}</strong><span>Pending event requests</span></div>
                <div><strong>{Object.values(memberCounts).reduce((total, count) => total + count, 0)}</strong><span>Approved members</span></div>
              </div>
            </section>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="eyebrow">Student applications</p>
                  <h2>Membership requests</h2>
                </div>
                <span className="result-count">{requests.length} requests</span>
              </div>
              {requests.length > 0 ? (
                <div className="admin-list">
                  {requests.map((request) => (
                    <div className="admin-row request-row" key={request.id}>
                      <div>
                        <strong>{request.student?.full_name || 'Student'}</strong>
                        <span>{request.clubs?.name} · {request.message || 'No message provided'}</span>
                        <span>{new Date(request.created_at).toLocaleString()}</span>
                      </div>
                      <div className="request-actions">
                        <span className={`request-status ${request.status}`}>{request.status}</span>
                        {request.status === 'pending' && (
                          <>
                            <button className="join-button" type="button" onClick={() => reviewRequest(request.id, 'approved')}>Approve</button>
                            <button className="details-button" type="button" onClick={() => reviewRequest(request.id, 'rejected')}>Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="empty-drawer">No membership requests have been submitted for your clubs.</p>}
            </section>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div><p className="eyebrow">Event attendance</p><h2>Attendance requests</h2></div>
                <span className="result-count">{attendanceRequests.length} requests</span>
              </div>
              {attendanceRequests.length > 0 ? (
                <div className="admin-list">
                  {attendanceRequests.map((request) => (
                    <div className="admin-row request-row" key={request.id}>
                      <div>
                        <strong>{request.student?.full_name || 'Student'}</strong>
                        <span>{request.events?.title} · {request.events?.clubs?.name}</span>
                        <span>{new Date(request.created_at).toLocaleString()}</span>
                      </div>
                      <div className="request-actions">
                        <span className={`request-status ${request.status}`}>{request.status}</span>
                        {request.status === 'pending' && (
                          <>
                            <button className="join-button" type="button" onClick={() => reviewAttendanceRequest(request.id, 'approved')}>Approve</button>
                            <button className="details-button" type="button" onClick={() => reviewAttendanceRequest(request.id, 'rejected')}>Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="empty-drawer">No event attendance requests have been submitted.</p>}
            </section>
          </>
        )}
        <EventsPage session={session} userRole="club_lead" />
      </main>
    </>
  );
}
