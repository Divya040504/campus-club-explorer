export function RequestsDrawer({ requests, onClose }) {
  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="joined-drawer" role="dialog" aria-modal="true" aria-labelledby="requests-title" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-heading">
          <div>
            <p className="eyebrow">Stay up to date</p>
            <h2 id="requests-title">My requests</h2>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close membership requests">×</button>
        </div>
        {requests.length > 0 ? (
          <ul className="joined-list">
            {requests.map((request) => (
              <li key={request.id}>
                {request.clubName}
                <span className={`request-status ${request.status}`}>{request.status}</span>
              </li>
            ))}
          </ul>
        ) : <p className="empty-drawer">You have not sent any membership requests yet.</p>}
      </aside>
    </div>
  );
}
