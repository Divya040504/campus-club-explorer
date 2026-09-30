function Navbar({ joinedCount, onOpenJoined }) {
  return (
    <header className="navbar">
      <a className="brand" href="/" aria-label="Campus Club Explorer home">
        <span className="brand-mark">CC</span>
        <span>Campus Club Explorer</span>
      </a>
      <button className="joined-button" type="button" onClick={onOpenJoined}>
        Joined clubs <span>{joinedCount}</span>
      </button>
    </header>
  );
}

