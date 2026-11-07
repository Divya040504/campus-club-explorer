import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const roleLabels = {
  student: 'Student',
  club_lead: 'Club lead',
  admin: 'Administrator',
};

export function ProfilePage({ session, userRole, onBack, onSignOut }) {
  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ fullName: '', avatarUrl: '', bio: '', campus: '', course: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfileData() {
      setIsLoading(true);
      setError('');
      const [profileResult, membershipResult, createdEventsResult, attendanceEventsResult] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url, bio, campus, course').eq('id', session.user.id).single(),
        supabase.from('membership_requests').select('id, status, clubs(name)').eq('student_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('events').select('id, title, venue, starts_at, clubs(name)').eq('created_by', session.user.id).order('starts_at'),
        supabase.from('event_attendance_requests').select('status, events(id, title, venue, starts_at, clubs(name))').eq('student_id', session.user.id),
      ]);

      if (profileResult.error || membershipResult.error || createdEventsResult.error || attendanceEventsResult.error) {
        setError(profileResult.error?.message || membershipResult.error?.message || createdEventsResult.error?.message || attendanceEventsResult.error.message);
      } else {
        const nextProfile = profileResult.data;
        setProfile(nextProfile);
        setForm({
          fullName: nextProfile.full_name || '',
          avatarUrl: nextProfile.avatar_url || '',
          bio: nextProfile.bio || '',
          campus: nextProfile.campus || '',
          course: nextProfile.course || '',
        });
        setRequests(membershipResult.data);
        setClubs(membershipResult.data.filter((request) => request.status === 'approved'));
        const createdEvents = createdEventsResult.data;
        const attendedEvents = attendanceEventsResult.data.map((request) => ({
          ...request.events,
          attendanceStatus: request.status,
        }));
        setEvents([...createdEvents, ...attendedEvents.filter((event) => !createdEvents.some((createdEvent) => createdEvent.id === event.id))]);
      }
      setIsLoading(false);
    }

    loadProfileData();
  }, [session.user.id]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');
    const { data, error: saveError } = await supabase
      .from('profiles')
      .update({
        full_name: form.fullName.trim(),
        avatar_url: form.avatarUrl.trim() || null,
        bio: form.bio.trim(),
        campus: form.campus.trim(),
        course: form.course.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
      .select('full_name, avatar_url, bio, campus, course')
      .single();

    if (saveError) setError(saveError.message);
    else {
      setProfile(data);
      setMessage('Profile updated successfully.');
    }
    setIsSaving(false);
  }

  return (
    <>
      <header className="navbar">
        <button className="brand profile-back" type="button" onClick={onBack} aria-label="Back to dashboard">
          <span className="brand-mark">CC</span>
          <span>Campus Club Explorer</span>
        </button>
        <button className="sign-out-button" type="button" onClick={onSignOut}>Sign out</button>
      </header>
      <main className="profile-page">
        {isLoading ? <p className="loading-state">Loading your profile...</p> : (
          <>
            <section className="profile-header">
              <div className="profile-avatar">{(form.fullName || session.user.email || 'U').charAt(0).toUpperCase()}</div>
              <div>
                <p className="eyebrow">Account profile</p>
                <h1>{form.fullName || 'Your profile'}</h1>
                <p className="profile-meta">{roleLabels[userRole] || userRole} · {session.user.email}</p>
              </div>
            </section>
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            {message && <p className="form-message success-message" role="status">{message}</p>}
            <div className="profile-layout">
              <form className="admin-panel profile-form" onSubmit={saveProfile}>
                <div className="admin-panel-heading"><div><p className="eyebrow">Personal details</p><h2>Edit profile</h2></div></div>
                <label>Full name<input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} required /></label>
                <label>Profile photo URL<input type="url" value={form.avatarUrl} onChange={(event) => updateField('avatarUrl', event.target.value)} placeholder="https://..." /></label>
                <label>Bio<textarea value={form.bio} onChange={(event) => updateField('bio', event.target.value)} rows="4" maxLength="500" /></label>
                <label>Campus<input value={form.campus} onChange={(event) => updateField('campus', event.target.value)} /></label>
                <label>Course<input value={form.course} onChange={(event) => updateField('course', event.target.value)} /></label>
                <label>Email <input value={session.user.email} readOnly /></label>
                <label>Role <input value={roleLabels[userRole] || userRole} readOnly /></label>
                <button className="auth-submit" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</button>
              </form>
              <div className="profile-side">
                <section className="admin-panel"><div className="admin-panel-heading"><h2>My clubs</h2><span className="result-count">{clubs.length}</span></div>{clubs.length ? clubs.map((request) => <p className="profile-list-item" key={request.id}><strong>{request.clubs?.name}</strong><span>Membership approved</span></p>) : <p className="empty-drawer">No approved memberships yet.</p>}</section>
                <section className="admin-panel"><div className="admin-panel-heading"><h2>My requests</h2><span className="result-count">{requests.length}</span></div>{requests.length ? requests.map((request) => <p className="profile-list-item" key={request.id}><strong>{request.clubs?.name}</strong><span className={`request-status ${request.status}`}>{request.status}</span></p>) : <p className="empty-drawer">No membership requests yet.</p>}</section>
                <section className="admin-panel"><div className="admin-panel-heading"><h2>My events</h2><span className="result-count">{events.length}</span></div>{events.length ? events.map((event) => <p className="profile-list-item" key={event.id}><strong>{event.title}</strong><span>{event.clubs?.name} · {new Date(event.starts_at).toLocaleString()}</span></p>) : <p className="empty-drawer">No events connected to your account yet.</p>}</section>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
