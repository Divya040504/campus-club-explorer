import { useState } from 'react';

export function MembershipRequestModal({ club, onClose, onSubmit, isSubmitting, error }) {
  const [message, setMessage] = useState('');

  if (!club) return null;

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(message);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="details-modal request-modal" role="dialog" aria-modal="true" aria-labelledby="request-title" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Close membership request">×</button>
        <p className="eyebrow">Membership request</p>
        <h2 id="request-title">Join {club.name}</h2>
        <p className="request-intro">Tell the club lead why you would like to join. Your request will remain pending until it is reviewed.</p>
        <form className="request-form" onSubmit={handleSubmit}>
          <label>
            Message <span>(optional)</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength="500" placeholder="Introduce yourself to the club lead..." rows="5" />
          </label>
          {error && <p className="form-message error-message" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending request...' : 'Send request'}
          </button>
        </form>
      </section>
    </div>
  );
}
