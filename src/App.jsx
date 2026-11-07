import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import { CategoryFilter } from './components/CategoryFilter';
import { AdminDashboard } from './components/AdminDashboard';
import { ClubLeadDashboard } from './components/ClubLeadDashboard';
import { EventsPage } from './components/EventsPage';
import { HelpDeskModal } from './components/HelpDeskModal';
import { ClubDetailsModal } from './components/ClubDetailsModal';
import { ClubGrid } from './components/ClubGrid';
import { JoinedDrawer } from './components/JoinedDrawer';
import { LoginPage } from './components/LoginPage';
import { MembershipRequestModal } from './components/MembershipRequestModal';
import { Navbar } from './components/Navbar';
import { RequestsDrawer } from './components/RequestsDrawer';
import { SearchBar } from './components/SearchBar';
import { ProfilePage } from './components/ProfilePage';

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [clubs, setClubs] = useState([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [clubsError, setClubsError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [joinedClubIds, setJoinedClubIds] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestClub, setRequestClub] = useState(null);
  const [isRequestsDrawerOpen, setIsRequestsDrawerOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [activeClub, setActiveClub] = useState(null);
  const [isJoinedDrawerOpen, setIsJoinedDrawerOpen] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  useEffect(() => {
    if (!session || !supabase) return;

    async function verifyPortalRole() {
      const selectedPortal = sessionStorage.getItem('campus-club-portal');
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        setRoleError(`We could not verify your account role: ${error.message}`);
      } else if (!data) {
        setRoleError('Your account profile is missing. Run the existing-profile backfill migration in Supabase SQL Editor, then sign in again.');
      } else if (selectedPortal && data.role !== selectedPortal) {
        const roleName = data.role.replace('_', ' ');
        const selectedPortalName = selectedPortal.replace('_', ' ');
        setRoleError(`This account is registered as ${roleName}, not ${selectedPortalName}. Select the correct portal and sign in again.`);
      } else {
        setUserRole(data.role);
        setRoleError('');
      }
    }

    verifyPortalRole();
  }, [session]);

  useEffect(() => {
    if (!session || !supabase) return;

    async function loadClubs() {
      setIsLoadingClubs(true);
      setClubsError('');

      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, category, venue, short_description, full_description, contact_email')
        .order('name');

      if (error) {
        setClubsError(`We could not load clubs from Supabase: ${error.message}`);
      } else {
        setClubs(data.map((club) => ({
          id: club.id,
          name: club.name,
          category: club.category,
          venue: club.venue,
          shortDesc: club.short_description,
          fullDesc: club.full_description,
          contact: club.contact_email,
        })));
      }

      setIsLoadingClubs(false);
    }

    loadClubs();
  }, [session]);

  useEffect(() => {
    if (!session || !supabase) return;

    async function loadRequests() {
      const { data, error } = await supabase
        .from('membership_requests')
        .select('id, club_id, status, message, clubs(name)')
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setRequests(data.map((request) => ({
          id: request.id,
          clubId: request.club_id,
          clubName: request.clubs.name,
          status: request.status,
          message: request.message,
        })));
      }
    }

    loadRequests();
  }, [session]);

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

  const categories = ['All', ...new Set(clubs.map((club) => club.category))];
  const requestStatuses = Object.fromEntries(requests.map((request) => [request.clubId, request.status]));
  const approvedClubIds = requests
    .filter((request) => request.status === 'approved')
    .map((request) => request.clubId);
  const joinedClubIdsWithApprovals = [...new Set([...joinedClubIds, ...approvedClubIds])];
  const joinedClubs = clubs.filter((club) => joinedClubIdsWithApprovals.includes(club.id));

  function openRequestModal(club) {
    setRequestError('');
    setRequestClub(club);
    setActiveClub(null);
  }

  async function submitMembershipRequest(message) {
    if (!requestClub || !supabase) return;

    setIsSubmittingRequest(true);
    setRequestError('');
    const { data, error } = await supabase
      .from('membership_requests')
      .insert({
        club_id: requestClub.id,
        student_id: session.user.id,
        message,
      })
      .select('id, club_id, status, message, clubs(name)')
      .single();

    if (error) {
      setRequestError(error.code === '23505' ? 'You already have a request for this club.' : error.message);
    } else {
      setRequests((currentRequests) => [{
        id: data.id,
        clubId: data.club_id,
        clubName: data.clubs.name,
        status: data.status,
        message: data.message,
      }, ...currentRequests]);
      setRequestClub(null);
    }
    setIsSubmittingRequest(false);
  }

  if (isLoadingSession) return <main className="loading-page">Loading your campus community...</main>;
  if (roleError && session) return (
    <main className="loading-page">
      <p>{roleError}</p>
      <button className="details-button" type="button" onClick={() => supabase.auth.signOut()}>Back to sign in</button>
    </main>
  );
  if (!session) return <LoginPage />;
  if (userRole === 'admin') return <AdminDashboard session={session} onSignOut={() => supabase.auth.signOut()} />;
  if (userRole === 'club_lead') return <ClubLeadDashboard session={session} onSignOut={() => supabase.auth.signOut()} />;
  if (isProfileOpen) return <ProfilePage session={session} userRole={userRole} onBack={() => setIsProfileOpen(false)} onSignOut={() => supabase.auth.signOut()} />;
  if (isEventsOpen) return <><Navbar joinedCount={joinedClubIds.length} requestCount={requests.length} onOpenJoined={() => setIsJoinedDrawerOpen(true)} onOpenRequests={() => setIsRequestsDrawerOpen(true)} onOpenEvents={() => setIsEventsOpen(false)} onOpenHelpDesk={() => setIsHelpDeskOpen(true)} onOpenProfile={() => setIsProfileOpen(true)} onSignOut={() => supabase.auth.signOut()} /><EventsPage session={session} userRole={userRole} onClose={() => setIsEventsOpen(false)} />{isHelpDeskOpen && <HelpDeskModal clubs={clubs} onClose={() => setIsHelpDeskOpen(false)} />}</>;

  return (
    <>
      <Navbar joinedCount={joinedClubs.length} requestCount={requests.length} onOpenJoined={() => setIsJoinedDrawerOpen(true)} onOpenRequests={() => setIsRequestsDrawerOpen(true)} onOpenEvents={() => setIsEventsOpen(true)} onOpenHelpDesk={() => setIsHelpDeskOpen(true)} onOpenProfile={() => setIsProfileOpen(true)} onSignOut={() => supabase.auth.signOut()} />
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
          <CategoryFilter categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          {isLoadingClubs && <p className="loading-state">Loading clubs...</p>}
          {clubsError && <p className="form-message error-message" role="alert">{clubsError}</p>}
          {!isLoadingClubs && !clubsError && (
            <ClubGrid clubs={filteredClubs} requestStatuses={requestStatuses} onRequest={openRequestModal} onViewDetails={setActiveClub} />
          )}
        </section>
      </main>

      {activeClub && <ClubDetailsModal club={activeClub} requestStatus={requestStatuses[activeClub.id]} onRequest={openRequestModal} onClose={() => setActiveClub(null)} />}

      {isJoinedDrawerOpen && <JoinedDrawer clubs={joinedClubs} onClose={() => setIsJoinedDrawerOpen(false)} />}
      {isRequestsDrawerOpen && <RequestsDrawer requests={requests} onClose={() => setIsRequestsDrawerOpen(false)} />}
      {requestClub && <MembershipRequestModal club={requestClub} onClose={() => setRequestClub(null)} onSubmit={submitMembershipRequest} isSubmitting={isSubmittingRequest} error={requestError} />}
      {isHelpDeskOpen && <HelpDeskModal clubs={clubs} onClose={() => setIsHelpDeskOpen(false)} />}
    </>
  );
}
