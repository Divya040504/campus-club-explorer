import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EventsPage } from './EventsPage';
import { ProfilePage } from './ProfilePage';

export function AdminDashboard({ session, onSignOut }) {
  const [profiles, setProfiles] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendanceRequests, setAttendanceRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  async function loadAdminData() {
    setIsLoading(true);
    setError('');
    const [profilesResult, clubsResult, eventsResult, attendanceResult] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role').order('full_name'),
      supabase.from('clubs').select('id, name, lead_id').order('name'),
      supabase.from('events').select('id, title, starts_at, clubs(name)').order('starts_at'),
      supabase.from('event_attendance_requests').select('id, status, events(title, clubs(name)), student:profiles!event_attendance_requests_student_id_fkey(full_name)').order('created_at', { ascending: false }),
    ]);

    if (profilesResult.error || clubsResult.error || eventsResult.error || attendanceResult.error) {
      setError(profilesResult.error?.message || clubsResult.error?.message || eventsResult.error?.message || attendanceResult.error.message);
    } else {
      setProfiles(profilesResult.data);
      setClubs(clubsResult.data);
      setEvents(eventsResult.data);
      setAttendanceRequests(attendanceResult.data);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function updateRole(profileId, role) {
    setError('');
    setMessage('');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', profileId);

    if (updateError) setError(updateError.message);
    else {
      setProfiles((current) => current.map((profile) => profile.id === profileId ? { ...profile, role } : profile));
      setMessage('User role updated.');
    }
  }

  async function assignLead(clubId, leadId) {
    setError('');
    setMessage('');
    const { error: updateError } = await supabase
      .from('clubs')
      .update({ lead_id: leadId || null })
      .eq('id', clubId);

    if (updateError) setError(updateError.message);
    else {
      setClubs((current) => current.map((club) => club.id === clubId ? { ...club, lead_id: leadId || null } : club));
      setMessage('Club lead assignment updated.');
    }
  }

  const leadProfiles = profiles.filter((profile) => profile.role === 'club_lead' || profile.role === 'admin');
  const upcomingEvents = events.filter((event) => new Date(event.starts_at) >= new Date());
  const pendingAttendance = attendanceRequests.filter((request) => request.status === 'pending');

  if (isProfileOpen) {
    return <ProfilePage session={session} userRole="admin" onBack={() => setIsProfileOpen(false)} onSignOut={onSignOut} />;
  }

  return (
    <>
      <header className="navbar">
        <a className="brand" href="/" aria-label="Campus Club Explorer home">
          <span className="brand-mark">CC</span>
          <span>Campus Club Explorer</span>
        </a>
        <div className="navbar-actions">
          <button className="joined-button" type="button" onClick={() => setIsProfileOpen(true)}>Profile</button>
          <button className="sign-out-button" type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </header>
      <main className="admin-page">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">Administrator portal</p>
            <h1>Manage your campus community</h1>
          </div>
          <button className="details-button" type="button" onClick={loadAdminData}>Refresh</button>
        </div>
        {error && <p className="form-message error-message" role="alert">{error}</p>}
        {message && <p className="form-message success-message" role="status">{message}</p>}
        {isLoading ? <p className="loading-state">Loading administration data...</p> : (
          <>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div><p className="eyebrow">Organization overview</p><h2>Community activity</h2></div>
              </div>
              <div className="profile-stats">
                <div><strong>{profiles.length}</strong><span>Registered users</span></div>
                <div><strong>{clubs.length}</strong><span>Clubs</span></div>
                <div><strong>{upcomingEvents.length}</strong><span>Upcoming events</span></div>
                <div><strong>{pendingAttendance.length}</strong><span>Pending attendance requests</span></div>
              </div>
            </section>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="eyebrow">Access control</p>
                  <h2>User roles</h2>
                </div>
                <span className="result-count">{profiles.length} users</span>
              </div>
              <div className="admin-list">
                {profiles.map((profile) => (
                  <div className="admin-row" key={profile.id}>
                    <div>
                      <strong>{profile.full_name || 'Unnamed user'}</strong>
                      <span>{profile.id}</span>
                    </div>
                    <select value={profile.role} onChange={(event) => updateRole(profile.id, event.target.value)}>
                      <option value="student">Student</option>
                      <option value="club_lead">Club lead</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                ))}
              </div>
            </section>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="eyebrow">Club ownership</p>
                  <h2>Assign club leads</h2>
                </div>
                <span className="result-count">{clubs.length} clubs</span>
              </div>
              <div className="admin-list">
                {clubs.map((club) => (
                  <div className="admin-row" key={club.id}>
                    <strong>{club.name}</strong>
                    <select value={club.lead_id || ''} onChange={(event) => assignLead(club.id, event.target.value)}>
                      <option value="">No lead assigned</option>
                      {leadProfiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.full_name || profile.id}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div><p className="eyebrow">Event oversight</p><h2>Attendance requests</h2></div>
                <span className="result-count">{attendanceRequests.length} requests</span>
              </div>
              {attendanceRequests.length > 0 ? (
                <div className="admin-list">
                  {attendanceRequests.slice(0, 8).map((request) => (
                    <div className="admin-row" key={request.id}>
                      <div>
                        <strong>{request.student?.full_name || 'Student'}</strong>
                        <span>{request.events?.title} · {request.events?.clubs?.name}</span>
                      </div>
                      <span className={`request-status ${request.status}`}>{request.status}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="empty-drawer">No event attendance requests yet.</p>}
            </section>
          </>
        )}
        <EventsPage session={session} userRole="admin" />
      </main>
    </>
  );
}
