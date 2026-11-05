export function ClubCard({ club, requestStatus, onRequest, onViewDetails }) {
  const hasRequest = Boolean(requestStatus);

  return (
    <article className="club-card">
      <div className="card-topline">
        <span className="category-badge">{club.category}</span>
        {requestStatus && <span className={`joined-label request-status ${requestStatus}`}>{requestStatus}</span>}
      </div>
      <h2>{club.name}</h2>
      <p className="venue">{club.venue}</p>
      <p className="short-description">{club.shortDesc}</p>
      <div className="card-actions">
        <button className="details-button" type="button" onClick={() => onViewDetails(club)}>
          View details
        </button>
        <button className={hasRequest && requestStatus !== 'rejected' ? 'join-button joined' : 'join-button'} type="button" onClick={() => onRequest(club)} disabled={requestStatus === 'pending' || requestStatus === 'approved'}>
          {requestStatus === 'approved' ? 'Member' : requestStatus === 'pending' ? 'Requested' : requestStatus === 'rejected' ? 'Request again' : 'Request to join'}
        </button>
      </div>
    </article>
  );
}
