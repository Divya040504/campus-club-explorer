function ClubDetailsModal({ club, onClose }) {
  if (!club) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="club-details-title" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Close club details">×</button>
        <span className="category-badge">{club.category}</span>
        <h2 id="club-details-title">{club.name}</h2>
        <p className="modal-venue">{club.venue}</p>
        <p>{club.fullDesc}</p>
        <div className="contact-box">
          <span>Contact</span>
          <a href={`mailto:${club.contact}`}>{club.contact}</a>
        </div>
      </section>
    </div>
  );
}

