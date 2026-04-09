import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Search,
  Filter,
  MapPin,
  Users,
  Calendar,
  Clock,
  Plus,
  Star
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  addDoc,
  updateDoc,
  doc,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import './ActivitiesList.css';

const SPORTS = [
  'Football', 'Basketball', 'Tennis', 'Running', 'Cycling',
  'Swimming', 'Volleyball', 'Badminton', 'Cricket', 'Golf'
];

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

// ✅ FIX 1: Moved outside parent component so it's not re-created on every render.
// Previously defined inside ActivitiesList, causing a new component reference each render
// which breaks React's reconciliation and resets all internal state.
const ActivityCard = ({ activity, currentUserId, onJoin }) => {
  // ✅ FIX 2: Added null guard — if currentUserId is undefined (e.g. logged-out mid-session),
  // these checks won't crash.
  const isJoined = currentUserId
    ? activity.participants?.includes(currentUserId)
    : false;
  const isFull =
    (activity.participants?.length ?? 0) >= activity.maxParticipants;
  const isOwner = currentUserId
    ? activity.createdBy === currentUserId
    : false;

  return (
    <div className="activity-card">
      <div className="activity-header">
        <div className="activity-sport-badge">{activity.sport}</div>
        <div className="activity-rating">
          <Star size={16} />
          <span>{activity.rating || '4.5'}</span>
        </div>
      </div>

      <h3 className="activity-title">{activity.title}</h3>
      <p className="activity-description">{activity.description}</p>

      <div className="activity-details">
        <div className="activity-detail">
          <Calendar size={16} />
          <span>
            {activity.date?.toDate
              ? new Date(activity.date.toDate()).toLocaleDateString()
              : 'TBD'}
          </span>
        </div>
        <div className="activity-detail">
          <Clock size={16} />
          <span>{activity.time}</span>
        </div>
        <div className="activity-detail">
          <MapPin size={16} />
          <span>{activity.location}</span>
        </div>
        <div className="activity-detail">
          <Users size={16} />
          <span>
            {activity.participants?.length ?? 0} / {activity.maxParticipants}
          </span>
        </div>
      </div>

      <div className="activity-tags">
        <span className="activity-tag skill-level">{activity.skillLevel}</span>
        <span className="activity-tag activity-type">{activity.type}</span>
        {activity.price ? (
          <span className="activity-tag price">${activity.price}</span>
        ) : null}
      </div>

      <div className="activity-footer">
        {isOwner ? (
          <button className="activity-btn owner-btn" disabled>
            Your Activity
          </button>
        ) : isJoined ? (
          <button className="activity-btn joined-btn" disabled>
            Joined ✓
          </button>
        ) : isFull ? (
          <button className="activity-btn full-btn" disabled>
            Activity Full
          </button>
        ) : (
          <button
            className="activity-btn join-btn"
            onClick={() => onJoin(activity.id)}
          >
            Join Activity
          </button>
        )}
      </div>
    </div>
  );
};

// ✅ FIX 1 (continued): CreateActivityModal also moved outside to avoid
// remounting on every parent render, which was resetting its local form state.
const CreateActivityModal = ({ onClose, onCreated, currentUserId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: '',
    skillLevel: '',
    type: 'Casual',
    location: '',
    date: '',
    time: '',
    maxParticipants: 10,
    price: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'activities'), {
        ...formData,
        createdBy: currentUserId,
        createdAt: new Date(),
        participants: [currentUserId],
        date: new Date(formData.date + 'T' + formData.time),
        maxParticipants: parseInt(formData.maxParticipants, 10),
        price: formData.price ? parseFloat(formData.price) : 0
      });
      onClose();
      onCreated();
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create New Activity</h2>
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Sport</label>
              <select
                value={formData.sport}
                onChange={(e) =>
                  setFormData({ ...formData, sport: e.target.value })
                }
                required
              >
                <option value="">Select Sport</option>
                {SPORTS.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Skill Level</label>
              <select
                value={formData.skillLevel}
                onChange={(e) =>
                  setFormData({ ...formData, skillLevel: e.target.value })
                }
                required
              >
                <option value="">Select Level</option>
                {SKILL_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="Casual">Casual</option>
                <option value="Competitive">Competitive</option>
                <option value="Training">Training</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Max Participants</label>
              <input
                type="number"
                min="2"
                max="50"
                value={formData.maxParticipants}
                onChange={(e) =>
                  setFormData({ ...formData, maxParticipants: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Price (optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-btn">
              Create Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ActivitiesList = () => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    sport: '',
    skillLevel: '',
    location: '',
    date: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sportQuery = queryParams.get('search') || '';
    setSearchTerm(sportQuery);
  }, [location.search]);

  // ✅ FIX 3: Wrapped fetchActivities in useCallback so it has a stable reference
  // and can be safely included in dependency arrays without causing infinite loops.
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const activitiesQuery = query(
        collection(db, 'activities'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(activitiesQuery);
      const activitiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter((activity) =>
        activity.sport?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.sport) {
      filtered = filtered.filter(
        (activity) => activity.sport === filters.sport
      );
    }
    if (filters.skillLevel) {
      filtered = filtered.filter(
        (activity) => activity.skillLevel === filters.skillLevel
      );
    }
    if (filters.location) {
      filtered = filtered.filter((activity) =>
        activity.location
          ?.toLowerCase()
          .includes(filters.location.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, filters]);

  // ✅ FIX 3 (continued): joinActivity also wrapped in useCallback.
  const joinActivity = useCallback(
    async (activityId) => {
      if (!currentUser) return;
      try {
        const activityRef = doc(db, 'activities', activityId);
        await updateDoc(activityRef, {
          participants: arrayUnion(currentUser.uid)
        });
        fetchActivities();
      } catch (error) {
        console.error('Error joining activity:', error);
      }
    },
    [currentUser, fetchActivities]
  );

  return (
    <div className="activities-page">
      <div className="activities-container">
        {/* Header */}
        <div className="activities-header">
          <div className="header-content">
            <h1>Find Activities</h1>
            <p>Discover and join sports activities in your area</p>
          </div>
          <button
            className="create-activity-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
            Create Activity
          </button>
        </div>

        {/* Filters */}
        <div className="activities-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search activities, sports, or locations..."
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

        {/* Activities Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading activities...</p>
          </div>
        ) : (
          <div className="activities-grid">
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                // ✅ FIX 2: Pass currentUserId as a prop instead of closing over
                // currentUser inside the component definition, which previously
                // caused stale closure bugs when the user state changed.
                currentUserId={currentUser?.uid}
                onJoin={joinActivity}
              />
            ))}
            {filteredActivities.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🏈</div>
                <h3>No activities found</h3>
                <p>Try adjusting your filters or create a new activity!</p>
                <button
                  className="create-first-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create First Activity
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ FIX 1 (continued): Modal now receives callbacks as props instead of
          closing over parent state directly, making it a proper standalone component. */}
      {showCreateModal && (
        <CreateActivityModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchActivities}
          currentUserId={currentUser?.uid}
        />
      )}
    </div>
  );
};

export default ActivitiesList;