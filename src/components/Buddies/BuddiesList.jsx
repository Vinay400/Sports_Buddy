import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
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

const BuddiesList = () => {
  const { currentUser, userProfile } = useAuth();
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

  const sports = [
    'Football',
    'Basketball',
    'Tennis',
    'Running',
    'Cycling',
    'Swimming',
    'Volleyball',
    'Badminton',
    'Cricket',
    'Golf',
  ];

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = fetchBuddies();
      const requestsUnsubscribe = fetchBuddyRequests();
      return () => {
        unsubscribe && unsubscribe();
        requestsUnsubscribe && requestsUnsubscribe();
      };
    }
  }, [currentUser]);

  useEffect(() => {
    filterBuddies();
  }, [buddies, searchTerm, filters]);

  const fetchBuddies = () => {
    try {
      setLoading(true);
      setError(null);

      if (!isFirebaseConfigured) {
        console.log('Firebase not configured - showing demo message');
        setBuddies([]);
        setLoading(false);
        return;
      }

      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        usersQuery,
        (snapshot) => {
          const usersData = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((user) => user.id !== currentUser?.uid);

          setBuddies(usersData);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching buddies:', error);
          setError('Failed to load buddies. Please check your connection.');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up buddies listener:', error);
      setError('Failed to load buddies. Please check your connection.');
      setLoading(false);
    }
  };

  const fetchBuddyRequests = () => {
    try {
      if (!isFirebaseConfigured) {
        setPendingRequests(new Set());
        setIncomingRequests([]);
        return () => {}; // Return empty function for cleanup
      }

      // Fetch outgoing requests (sent by current user)
      const outgoingRequestsQuery = query(
        collection(db, 'buddyRequests'),
        where('from', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      const outgoingUnsubscribe = onSnapshot(outgoingRequestsQuery, (snapshot) => {
        const pendingIds = new Set();
        snapshot.docs.forEach(doc => {
          pendingIds.add(doc.data().to);
        });
        setPendingRequests(pendingIds);
      });

      // Fetch incoming requests (sent to current user)
      const incomingRequestsQuery = query(
        collection(db, 'buddyRequests'),
        where('to', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      const incomingUnsubscribe = onSnapshot(incomingRequestsQuery, (snapshot) => {
        setIncomingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        outgoingUnsubscribe();
        incomingUnsubscribe();
      };
    } catch (error) {
      console.error('Error setting up buddy requests listener:', error);
      return () => {}; // Return empty function for cleanup
    }
  };

  const filterBuddies = () => {
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
  };

  const sendBuddyRequest = async (buddyId) => {
    try {
      if (!isFirebaseConfigured) {
        alert(
          'Please configure Firebase to use this feature. Check SETUP.md for instructions.'
        );
        return;
      }

      if (!currentUser) {
        alert('You must be logged in to send buddy requests.');
        return;
      }

      // Check if request already exists
      const existingRequestQuery = query(
        collection(db, 'buddyRequests'),
        where('from', '==', currentUser.uid),
        where('to', '==', buddyId)
      );

      const existingRequestSnapshot = await getDocs(existingRequestQuery);
      if (!existingRequestSnapshot.empty) {
        alert('You have already sent a request to this user.');
        return;
      }

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
  };

  const startConversation = (buddyId) => {
    try {
      if (!isFirebaseConfigured) {
        alert(
          'Please configure Firebase to use this feature. Check SETUP.md for instructions.'
        );
        return;
      }

      if (!currentUser) {
        alert('You must be logged in to start conversations.');
        return;
      }

      // Navigate to messages page
      window.location.href = `/messages`;
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const navigateToRequests = () => {
    window.location.href = '/requests';
  };

  const BuddyCard = ({ buddy }) => {
    const isConnected = userProfile?.buddies?.includes(buddy.id);
    const requestSent = pendingRequests.has(buddy.id);

    return (
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
              onClick={() => startConversation(buddy.id)}
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
              onClick={() => sendBuddyRequest(buddy.id)}
            >
              <UserPlus size={20} />
              Connect
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="buddies-page">
      <div className="buddies-container">
        <div className="buddies-header">
          <div className="header-content">
            <h1>Find Sports Buddies</h1>
            <p>Connect with like-minded sports enthusiasts in your area</p>
          </div>
          {incomingRequests.length > 0 && (
            <button className="requests-notification-btn" onClick={navigateToRequests}>
              <Bell size={20} />
              <span className="notification-badge">{incomingRequests.length}</span>
              View Requests
            </button>
          )}
        </div>

        {!isFirebaseConfigured && (
          <div className="demo-notice">
            <p>
              ⚠️ Running in demo mode. Configure Firebase to see real buddies and
              connect with users.
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
              onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
            >
              <option value="">All Sports</option>
              {sports.map((sport) => (
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
              {skillLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
        </div>

        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchBuddies} className="retry-btn">
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
              <BuddyCard key={buddy.id} buddy={buddy} />
            ))}
            {filteredBuddies.length === 0 && !error && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No buddies found</h3>
                <p>Try adjusting your filters or check back later for new members!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuddiesList;
