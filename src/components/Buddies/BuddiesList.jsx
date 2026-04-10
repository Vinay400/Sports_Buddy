import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  MessageCircle,
  UserPlus,
  UserCheck,
  Bell,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  addDoc,
  onSnapshot,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import './BuddiesList.css';

const SPORTS = [
  'Football', 'Basketball', 'Tennis', 'Running', 'Cycling',
  'Swimming', 'Volleyball', 'Badminton', 'Cricket', 'Golf',
];

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

const BuddyCard = ({ buddy, isConnected, requestSent, onConnect, onMessage }) => (
  <div className="buddy-card">
    <div className="buddy-avatar">
      {buddy.profileImage ? (
        <img
          src={buddy.profileImage}
          alt={`${buddy.firstName} ${buddy.lastName}`}
        />
      ) : (
        <div className="avatar-placeholder">
          {buddy.firstName?.[0]}
          {buddy.lastName?.[0]}
        </div>
      )}
    </div>

    <div className="buddy-info">
      <h3 className="buddy-name">
        {buddy.firstName} {buddy.lastName}
      </h3>

      {buddy.location && (
        <div className="buddy-location">
          <MapPin size={14} />
          <span>{buddy.location}</span>
        </div>
      )}

      <div className="buddy-rating">
        <Star size={16} />
        <span>{buddy.rating || '4.5'}/5.0</span>
      </div>

      {buddy.bio && <p className="buddy-bio">{buddy.bio}</p>}

      {buddy.favoriteSports && buddy.favoriteSports.length > 0 && (
        <div className="buddy-sports">
          <h4>Favorite Sports:</h4>
          <div className="sports-tags">
            {buddy.favoriteSports.slice(0, 3).map((sport) => (
              <span key={sport} className="sport-tag">
                {sport}
                {buddy.skillLevels?.[sport] && (
                  <span className="skill-level">
                    {buddy.skillLevels[sport]}
                  </span>
                )}
              </span>
            ))}
            {buddy.favoriteSports.length > 3 && (
              <span className="more-sports">
                +{buddy.favoriteSports.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="buddy-stats">
        <div className="stat">
          <span className="stat-value">{buddy.activitiesJoined || 0}</span>
          <span className="stat-label">Activities</span>
        </div>
        <div className="stat">
          <span className="stat-value">{buddy.buddies?.length || 0}</span>
          <span className="stat-label">Buddies</span>
        </div>
      </div>
    </div>

    <div className="buddy-actions">
      {isConnected ? (
        <button
          className="buddy-btn connected-btn"
          onClick={() => onMessage(buddy.id)}
        >
          <MessageCircle size={20} />
          Message
        </button>
      ) : requestSent ? (
        <button className="buddy-btn request-sent-btn" disabled>
          <UserCheck size={20} />
          Request Sent
        </button>
      ) : (
        <button
          className="buddy-btn connect-btn"
          onClick={() => onConnect(buddy.id)}
        >
          <UserPlus size={20} />
          Connect
        </button>
      )}
    </div>
  </div>
);

const BuddiesList = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [buddies, setBuddies] = useState([]);
  const [filteredBuddies, setFilteredBuddies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    sport: '',
    skillLevel: '',
    location: '',
  });
  const [error, setError] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [incomingRequests, setIncomingRequests] = useState([]);

  const retryFetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
    } finally {
      setError(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribers = [];

    if (!isFirebaseConfigured) {
      setBuddies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => user.id !== currentUser.uid);
        setBuddies(usersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching buddies:', err);
        setError('Failed to load buddies. Please check your connection.');
        setLoading(false);
      }
    );
    unsubscribers.push(unsubUsers);

    // Outgoing requests
    const outgoingQuery = query(
      collection(db, 'buddyRequests'),
      where('from', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsubOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
      const pendingIds = new Set(snapshot.docs.map((d) => d.data().to));
      setPendingRequests(pendingIds);
    });
    unsubscribers.push(unsubOutgoing);

    // Incoming requests
    const incomingQuery = query(
      collection(db, 'buddyRequests'),
      where('to', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsubIncoming = onSnapshot(incomingQuery, (snapshot) => {
      setIncomingRequests(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });
    unsubscribers.push(unsubIncoming);

    return () => unsubscribers.forEach((fn) => fn());
  }, [currentUser]);

  useEffect(() => {
    let filtered = buddies;

    if (searchTerm) {
      filtered = filtered.filter(
        (buddy) =>
          `${buddy.firstName || ''} ${buddy.lastName || ''}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          buddy.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          buddy.favoriteSports?.some((sport) =>
            sport.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }
    if (filters.sport) {
      filtered = filtered.filter((buddy) =>
        buddy.favoriteSports?.includes(filters.sport)
      );
    }
    if (filters.skillLevel) {
      filtered = filtered.filter((buddy) =>
        Object.values(buddy.skillLevels || {}).includes(filters.skillLevel)
      );
    }
    if (filters.location) {
      filtered = filtered.filter((buddy) =>
        buddy.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setFilteredBuddies(filtered);
  }, [buddies, searchTerm, filters]);

  const sendBuddyRequest = useCallback(
    async (buddyId) => {
      if (!isFirebaseConfigured) {
        alert('Please configure Firebase to use this feature.');
        return;
      }
      if (!currentUser) {
        alert('You must be logged in to send buddy requests.');
        return;
      }

      const existingQuery = query(
        collection(db, 'buddyRequests'),
        where('from', '==', currentUser.uid),
        where('to', '==', buddyId)
      );
      const existing = await getDocs(existingQuery);
      if (!existing.empty) {
        alert('You have already sent a request to this user.');
        return;
      }

      try {
        await addDoc(collection(db, 'buddyRequests'), {
          from: currentUser.uid,
          to: buddyId,
          status: 'pending',
          createdAt: new Date(),
        });
        alert('Buddy request sent successfully!');
      } catch (error) {
        console.error('Error sending buddy request:', error);
        alert('Failed to send buddy request. Please try again.');
      }
    },
    [currentUser]
  );

  const startConversation = useCallback(
    (buddyId) => {
      if (!isFirebaseConfigured) {
        alert('Please configure Firebase to use this feature.');
        return;
      }
      if (!currentUser) {
        alert('You must be logged in to start conversations.');
        return;
      }
      navigate('/messages');
    },
    [currentUser, navigate]
  );

  const navigateToRequests = useCallback(() => {
    navigate('/requests');
  }, [navigate]);

  return (
    <div className="buddies-page">
      <div className="buddies-container">
        <div className="buddies-header">
          <div className="header-content">
            <h1>Find Sports Buddies</h1>
            <p>Connect with like-minded sports enthusiasts in your area</p>
          </div>
          {incomingRequests.length > 0 && (
            <button
              className="requests-notification-btn"
              onClick={navigateToRequests}
            >
              <Bell size={20} />
              <span className="notification-badge">
                {incomingRequests.length}
              </span>
              View Requests
            </button>
          )}
        </div>

        {!isFirebaseConfigured && (
          <div className="demo-notice">
            <p>
              Discovering and connecting with buddies requires Firebase credentials in
              your environment. Follow the setup guide to use your own project.
            </p>
            <a href="/SETUP.md" className="setup-link">
              View Setup Guide
            </a>
          </div>
        )}

        <div className="buddies-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name, location, or sports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              value={filters.sport}
              onChange={(e) =>
                setFilters({ ...filters, sport: e.target.value })
              }
            >
              <option value="">All Sports</option>
              {SPORTS.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>

            <select
              value={filters.skillLevel}
              onChange={(e) =>
                setFilters({ ...filters, skillLevel: e.target.value })
              }
            >
              <option value="">All Levels</option>
              {SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
            />
          </div>
        </div>

        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={retryFetch} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Finding sports buddies...</p>
          </div>
        ) : (
          <div className="buddies-grid">
            {filteredBuddies.map((buddy) => (
              <BuddyCard
                key={buddy.id}
                buddy={buddy}
                isConnected={userProfile?.buddies?.includes(buddy.id) ?? false}
                requestSent={pendingRequests.has(buddy.id)}
                onConnect={sendBuddyRequest}
                onMessage={startConversation}
              />
            ))}
            {filteredBuddies.length === 0 && !error && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No buddies found</h3>
                <p>
                  Try adjusting your filters or check back later for new
                  members!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuddiesList;