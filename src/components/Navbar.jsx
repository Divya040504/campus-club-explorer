export function Navbar({ joinedCount, requestCount, onOpenJoined, onOpenRequests, onOpenEvents, onOpenHelpDesk, onOpenProfile, onSignOut }) {
  return (
    <header className="navbar">
      <a className="brand" href="/" aria-label="Campus Club Explorer home">
        <span className="brand-mark">CC</span>
        <span>Campus Club Explorer</span>
      </a>
      <div className="navbar-actions">
        <button className="joined-button" type="button" onClick={onOpenEvents}>Events</button>
        <button className="help-link" type="button" onClick={onOpenHelpDesk}>Help desk</button>
        <button className="joined-button" type="button" onClick={onOpenRequests}>
          My requests <span>{requestCount}</span>
        </button>
        <button className="joined-button" type="button" onClick={onOpenJoined}>
          Joined clubs <span>{joinedCount}</span>
        </button>
        <button className="profile-button" type="button" onClick={onOpenProfile} aria-label="Open your profile">
          <span className="profile-button-avatar" aria-hidden="true">U</span>
          <span>Profile</span>
        </button>
        <button className="sign-out-button" type="button" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  );
}
