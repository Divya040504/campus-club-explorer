function ClubCard({ club, isJoined, onJoin, onViewDetails }) {
  return (
    <article className="club-card">
      <div className="card-topline">
        <span className="category-badge">{club.category}</span>
        {isJoined && <span className="joined-label">Joined</span>}
      </div>
      <h2>{club.name}</h2>
      <p className="venue">{club.venue}</p>
      <p className="short-description">{club.shortDesc}</p>
      <div className="card-actions">
        <button className="details-button" type="button" onClick={() => onViewDetails(club)}>
          View details
        </button>
        <button className={isJoined ? 'join-button joined' : 'join-button'} type="button" onClick={() => onJoin(club.id)}>
          {isJoined ? 'Joined' : 'Join'}
        </button>
      </div>
    </article>
  );
}

