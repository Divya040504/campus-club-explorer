function ClubGrid({ clubs, joinedClubIds, onJoin, onViewDetails }) {
  if (clubs.length === 0) {
    return <p className="empty-state">No clubs match your search. Try another name or vertical.</p>;
  }

  return (
    <div className="club-grid">
      {clubs.map((club) => (
        <ClubCard
          key={club.id}
          club={club}
          isJoined={joinedClubIds.includes(club.id)}
          onJoin={onJoin}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

