import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function ClubLeadDashboard({ session, onSignOut }) {
  const [clubs, setClubs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

    const { data: requestData, error: requestsError } = await supabase
      .from('membership_requests')
      .select('id, club_id, student_id, message, status, created_at, profiles(full_name), clubs(name)')
      .in('club_id', clubData.map((club) => club.id))
      .order('created_at', { ascending: false });

    if (requestsError) setError(requestsError.message);
    else setRequests(requestData);
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
                  {clubs.map((club) => <div className="assigned-club" key={club.id}><strong>{club.name}</strong><span>{club.category} · {club.venue}</span></div>)}
                </div>
              ) : <p className="empty-drawer">No club has been assigned to this account yet.</p>}
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
                        <strong>{request.profiles?.full_name || 'Student'}</strong>
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
          </>
        )}
      </main>
    </>
  );
}
