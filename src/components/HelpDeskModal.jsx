export function HelpDeskModal({ clubs, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="details-modal help-desk-modal" role="dialog" aria-modal="true" aria-labelledby="help-desk-title" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Close help desk">×</button>
        <p className="eyebrow">Student support</p>
        <h2 id="help-desk-title">How can we help?</h2>
        <p className="help-desk-intro">Contact the general support team or reach out to the lead of a specific club.</p>
        <div className="help-contact-list">
          <a className="help-contact" href="mailto:student-support@campus.edu">
            <strong>General student support</strong>
            <span>student-support@campus.edu</span>
          </a>
          {clubs.map((club) => (
            <a className="help-contact" href={`mailto:${club.contact}`} key={club.id}>
              <strong>{club.name}</strong>
              <span>{club.contact}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
