const { useMemo, useState } = React;

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [joinedClubIds, setJoinedClubIds] = useState([]);
  const [activeClub, setActiveClub] = useState(null);
  const [isJoinedDrawerOpen, setIsJoinedDrawerOpen] = useState(false);

  const filteredClubs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return clubs.filter((club) => {
      const matchesCategory = activeCategory === 'All' || club.category === activeCategory;
      const matchesSearch = club.name.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  function toggleJoinedClub(clubId) {
    setJoinedClubIds((currentIds) => (
      currentIds.includes(clubId)
        ? currentIds.filter((id) => id !== clubId)
        : [...currentIds, clubId]
    ));
  }

  const joinedClubs = clubs.filter((club) => joinedClubIds.includes(club.id));

  return (
    <>
      <Navbar joinedCount={joinedClubIds.length} onOpenJoined={() => setIsJoinedDrawerOpen(true)} />
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Find your people</p>
            <h1>Explore. Connect. Belong.</h1>
            <p>Find a club that makes campus feel a little more like home.</p>
          </div>
          <div className="hero-shape" aria-hidden="true">✦</div>
        </section>

        <section className="explorer-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your campus, your community</p>
              <h2>Discover student clubs</h2>
            </div>
            <span className="result-count">{filteredClubs.length} clubs</span>
          </div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          <ClubGrid clubs={filteredClubs} joinedClubIds={joinedClubIds} onJoin={toggleJoinedClub} onViewDetails={setActiveClub} />
        </section>
      </main>

      {activeClub && <ClubDetailsModal club={activeClub} onClose={() => setActiveClub(null)} />}

      {isJoinedDrawerOpen && <JoinedDrawer clubs={joinedClubs} onClose={() => setIsJoinedDrawerOpen(false)} />}
    </>
  );
}

