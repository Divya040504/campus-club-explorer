function SearchBar({ value, onChange }) {
  return (
    <label className="search-field">
      <span className="search-icon" aria-hidden="true">⌕</span>
      <span className="sr-only">Search clubs by name</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by club name..."
      />
    </label>
  );
}

