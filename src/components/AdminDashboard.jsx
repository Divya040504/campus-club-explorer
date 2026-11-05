import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function AdminDashboard({ onSignOut }) {
  const [profiles, setProfiles] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadAdminData() {
    setIsLoading(true);
    setError('');
    const [profilesResult, clubsResult] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role').order('full_name'),
      supabase.from('clubs').select('id, name, lead_id').order('name'),
    ]);

    if (profilesResult.error || clubsResult.error) {
      setError(profilesResult.error?.message || clubsResult.error.message);
    } else {
      setProfiles(profilesResult.data);
      setClubs(clubsResult.data);
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

  return (
    <>
      <header className="navbar">
        <a className="brand" href="/" aria-label="Campus Club Explorer home">
          <span className="brand-mark">CC</span>
          <span>Campus Club Explorer</span>
        </a>
        <button className="sign-out-button" type="button" onClick={onSignOut}>Sign out</button>
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
          </>
        )}
      </main>
    </>
  );
}
