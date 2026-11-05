import { ClubCard } from './ClubCard';

export function ClubGrid({ clubs, requestStatuses, onRequest, onViewDetails }) {
  if (clubs.length === 0) {
    return <p className="empty-state">No clubs match your search. Try another name or vertical.</p>;
  }

  return (
    <div className="club-grid">
      {clubs.map((club) => (
        <ClubCard
          key={club.id}
          club={club}
          requestStatus={requestStatuses[club.id]}
          onRequest={onRequest}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
