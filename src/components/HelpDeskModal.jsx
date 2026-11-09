import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function HelpDeskModal({ clubs, session, onClose }) {
  const [clubId, setClubId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function submitMessage(event) {
    event.preventDefault();
    setError('');
    setIsSending(true);
    const { error: submitError } = await supabase.from('help_desk_messages').insert({
      student_id: session.user.id,
      club_id: clubId || null,
      subject: subject.trim(),
      message: message.trim(),
    });
    if (submitError) setError(submitError.message);
    else {
      setSent(true);
      setSubject('');
      setMessage('');
      setClubId('');
    }
    setIsSending(false);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="details-modal help-desk-modal" role="dialog" aria-modal="true" aria-labelledby="help-desk-title" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Close help desk">×</button>
        <p className="eyebrow">Student support</p>
        <h2 id="help-desk-title">How can we help?</h2>
        <p className="help-desk-intro">Contact the general support team or reach out to the lead of a specific club.</p>
        {sent ? <p className="form-message success-message" role="status">Your support request was sent successfully.</p> : (
          <form className="help-desk-form" onSubmit={submitMessage}>
            <label>Related club
              <select value={clubId} onChange={(event) => setClubId(event.target.value)}>
                <option value="">General support</option>
                {clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}
              </select>
            </label>
            <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength="120" /></label>
            <label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} required maxLength="1000" rows="5" /></label>
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={isSending}>{isSending ? 'Sending...' : 'Send request'}</button>
          </form>
        )}
      </section>
    </div>
  );
}
