import { useEffect, useMemo, useState } from 'react';
import { categories, clubs } from './data/clubs';
import { supabase } from './lib/supabase';
import { CategoryFilter } from './components/CategoryFilter';
import { ClubDetailsModal } from './components/ClubDetailsModal';
import { ClubGrid } from './components/ClubGrid';
import { JoinedDrawer } from './components/JoinedDrawer';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [joinedClubIds, setJoinedClubIds] = useState([]);
  const [activeClub, setActiveClub] = useState(null);
  const [isJoinedDrawerOpen, setIsJoinedDrawerOpen] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsLoadingSession(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoadingSession(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

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

  if (isLoadingSession) return <main className="loading-page">Loading your campus community...</main>;
  if (!session) return <LoginPage />;

  return (
    <>
      <Navbar joinedCount={joinedClubIds.length} onOpenJoined={() => setIsJoinedDrawerOpen(true)} onSignOut={() => supabase.auth.signOut()} />
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
