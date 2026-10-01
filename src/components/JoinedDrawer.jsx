function JoinedDrawer({ clubs, onClose }) {
  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="joined-drawer" role="dialog" aria-modal="true" aria-labelledby="joined-title" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-heading">
          <div>
            <p className="eyebrow">Your shortlist</p>
            <h2 id="joined-title">Joined clubs</h2>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close joined clubs">×</button>
        </div>
        {clubs.length > 0 ? (
          <ul className="joined-list">
            {clubs.map((club) => <li key={club.id}>{club.name}<span>{club.venue}</span></li>)}
          </ul>
        ) : <p className="empty-drawer">You have not joined any clubs yet.</p>}
      </aside>
    </div>
  );
}

