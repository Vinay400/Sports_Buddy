import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Star,
  Plus,
  MessageCircle,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  where, 
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
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
    location: ''
  });

  const sports = [
    'Football', 'Basketball', 'Tennis', 'Running', 'Cycling', 
    'Swimming', 'Volleyball', 'Badminton', 'Cricket', 'Golf'
  ];

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  useEffect(() => {
    fetchBuddies();
  }, []);

  useEffect(() => {
    filterBuddies();
  }, [buddies, searchTerm, filters]);

  const fetchBuddies = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from Firebase first
      try {
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(usersQuery);
        const usersData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.id !== currentUser.uid);
        
        if (usersData.length > 0) {
          setBuddies(usersData);
        } else {
          // If no users in Firebase, use sample data
          setBuddies(getSampleBuddies());
        }
      } catch (firebaseError) {
        console.log('Firebase not configured, using sample data');
        setBuddies(getSampleBuddies());
      }
    } catch (error) {
      console.error('Error fetching buddies:', error);
      setBuddies(getSampleBuddies());
    } finally {
      setLoading(false);
    }
  };

  const getSampleBuddies = () => {
    return [
      {
        id: 'buddy1',
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex@example.com',
        bio: 'Passionate about tennis and running. Looking for workout partners!',
        location: 'New York, NY',
        rating: 4.8,
        activitiesJoined: 15,
        activitiesCreated: 3,
        favoriteSports: ['Tennis', 'Running', 'Basketball'],
        skillLevels: {
          'Tennis': 'Advanced',
          'Running': 'Intermediate',
          'Basketball': 'Beginner'
        },
        profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'buddy2',
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah@example.com',
        bio: 'Yoga instructor and cycling enthusiast. Love outdoor activities!',
        location: 'Los Angeles, CA',
        rating: 4.9,
        activitiesJoined: 22,
        activitiesCreated: 8,
        favoriteSports: ['Cycling', 'Swimming', 'Volleyball'],
        skillLevels: {
          'Cycling': 'Professional',
          'Swimming': 'Advanced',
          'Volleyball': 'Intermediate'
        },
        profileImage: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
        createdAt: new Date('2024-01-10')
      },
      {
        id: 'buddy3',
        firstName: 'Mike',
        lastName: 'Chen',
        email: 'mike@example.com',
        bio: 'Football coach and fitness trainer. Always up for a challenge!',
        location: 'Chicago, IL',
        rating: 4.7,
        activitiesJoined: 18,
        activitiesCreated: 12,
        favoriteSports: ['Football', 'Golf', 'Running'],
        skillLevels: {
          'Football': 'Professional',
          'Golf': 'Advanced',
          'Running': 'Advanced'
        },
        profileImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
        createdAt: new Date('2024-01-08')
      },
      {
        id: 'buddy4',
        firstName: 'Emma',
        lastName: 'Davis',
        email: 'emma@example.com',
        bio: 'Badminton player and swimming coach. Love competitive sports!',
        location: 'Miami, FL',
        rating: 4.6,
        activitiesJoined: 12,
        activitiesCreated: 5,
        favoriteSports: ['Badminton', 'Swimming', 'Tennis'],
        skillLevels: {
          'Badminton': 'Professional',
          'Swimming': 'Advanced',
          'Tennis': 'Intermediate'
        },
        profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
        createdAt: new Date('2024-01-05')
      },
      {
        id: 'buddy5',
        firstName: 'David',
        lastName: 'Rodriguez',
        email: 'david@example.com',
        bio: 'Basketball enthusiast and cricket player. Team sports are my passion!',
        location: 'Houston, TX',
        rating: 4.5,
        activitiesJoined: 20,
        activitiesCreated: 7,
        favoriteSports: ['Basketball', 'Cricket', 'Volleyball'],
        skillLevels: {
          'Basketball': 'Advanced',
          'Cricket': 'Intermediate',
          'Volleyball': 'Intermediate'
        },
        profileImage: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
        createdAt: new Date('2024-01-03')
      },
      {
        id: 'buddy6',
        firstName: 'Lisa',
        lastName: 'Thompson',
        email: 'lisa@example.com',
        bio: 'Marathon runner and gym enthusiast. Fitness is my lifestyle!',
        location: 'Seattle, WA',
        rating: 4.8,
        activitiesJoined: 25,
        activitiesCreated: 4,
        favoriteSports: ['Running', 'Cycling', 'Swimming'],
        skillLevels: {
          'Running': 'Professional',
          'Cycling': 'Advanced',
          'Swimming': 'Intermediate'
        },
        profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150',
        createdAt: new Date('2024-01-01')
      }
    ];
  };
  const filterBuddies = () => {
    let filtered = buddies;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(buddy =>
        `${buddy.firstName} ${buddy.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buddy.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buddy.favoriteSports?.some(sport => 
          sport.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sport filter
    if (filters.sport) {
      filtered = filtered.filter(buddy => 
        buddy.favoriteSports?.includes(filters.sport)
      );
    }

    // Skill level filter
    if (filters.skillLevel) {
      filtered = filtered.filter(buddy =>
        Object.values(buddy.skillLevels || {}).includes(filters.skillLevel)
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(buddy =>
        buddy.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setFilteredBuddies(filtered);
  };

  const sendBuddyRequest = async (buddyId) => {
    try {
      // Try Firebase first, fallback to local state
      try {
        await addDoc(collection(db, 'buddyRequests'), {
          from: currentUser.uid,
          to: buddyId,
          status: 'pending',
          createdAt: new Date()
        });
      } catch (firebaseError) {
        console.log('Firebase not configured, updating local state only');
      }

      // Update local state to show request sent
      setBuddies(prev => prev.map(buddy => 
        buddy.id === buddyId 
          ? { ...buddy, requestSent: true }
          : buddy
      ));
    } catch (error) {
      console.error('Error sending buddy request:', error);
    }
  };

  const startConversation = async (buddyId) => {
    try {
      // Create or find existing conversation
      const conversationId = [currentUser.uid, buddyId].sort().join('_');
      
      // Navigate to messages with this buddy
      window.location.href = `/messages`;
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const BuddyCard = ({ buddy }) => {
    const isConnected = userProfile?.buddies?.includes(buddy.id);
    const requestSent = buddy.requestSent;

    return (
      <div className="buddy-card">
        <div className="buddy-avatar">
          {buddy.profileImage ? (
            <img src={buddy.profileImage} alt={`${buddy.firstName} ${buddy.lastName}`} />
          ) : (
            <div className="avatar-placeholder">
              {buddy.firstName?.[0]}{buddy.lastName?.[0]}
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

          {buddy.bio && (
            <p className="buddy-bio">{buddy.bio}</p>
          )}

          {buddy.favoriteSports && buddy.favoriteSports.length > 0 && (
            <div className="buddy-sports">
              <h4>Favorite Sports:</h4>
              <div className="sports-tags">
                {buddy.favoriteSports.slice(0, 3).map(sport => (
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
        {/* Header */}
        <div className="buddies-header">
          <div className="header-content">
            <h1>Find Sports Buddies</h1>
            <p>Connect with like-minded sports enthusiasts in your area</p>
          </div>
        </div>

        {/* Filters */}
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
              onChange={(e) => setFilters({...filters, sport: e.target.value})}
            >
              <option value="">All Sports</option>
              {sports.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>

            <select
              value={filters.skillLevel}
              onChange={(e) => setFilters({...filters, skillLevel: e.target.value})}
            >
              <option value="">All Levels</option>
              {skillLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </div>
        </div>

        {/* Buddies Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Finding sports buddies...</p>
          </div>
        ) : (
          <div className="buddies-grid">
            {filteredBuddies.map(buddy => (
              <BuddyCard key={buddy.id} buddy={buddy} />
            ))}
            {filteredBuddies.length === 0 && (
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