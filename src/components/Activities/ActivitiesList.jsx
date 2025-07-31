import React, { useState, useEffect } from 'react';
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

  const sports = [
    'Football', 'Basketball', 'Tennis', 'Running', 'Cycling', 
    'Swimming', 'Volleyball', 'Badminton', 'Cricket', 'Golf'
  ];

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const activitiesQuery = query(
        collection(db, 'activities'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(activitiesQuery);
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sport filter
    if (filters.sport) {
      filtered = filtered.filter(activity => activity.sport === filters.sport);
    }

    // Skill level filter
    if (filters.skillLevel) {
      filtered = filtered.filter(activity => activity.skillLevel === filters.skillLevel);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(activity =>
        activity.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  };

  const joinActivity = async (activityId) => {
    try {
      const activityRef = doc(db, 'activities', activityId);
      await updateDoc(activityRef, {
        participants: arrayUnion(currentUser.uid)
      });
      
      // Refresh activities
      fetchActivities();
    } catch (error) {
      console.error('Error joining activity:', error);
    }
  };

  const ActivityCard = ({ activity }) => {
    const isJoined = activity.participants?.includes(currentUser.uid);
    const isFull = activity.participants?.length >= activity.maxParticipants;
    const isOwner = activity.createdBy === currentUser.uid;

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
            <span>{new Date(activity.date?.toDate()).toLocaleDateString()}</span>
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
            <span>{activity.participants?.length || 0} / {activity.maxParticipants}</span>
          </div>
        </div>

        <div className="activity-tags">
          <span className="activity-tag skill-level">{activity.skillLevel}</span>
          <span className="activity-tag activity-type">{activity.type}</span>
          {activity.price && (
            <span className="activity-tag price">${activity.price}</span>
          )}
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
              onClick={() => joinActivity(activity.id)}
            >
              Join Activity
            </button>
          )}
        </div>
      </div>
    );
  };

  const CreateActivityModal = () => {
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
          createdBy: currentUser.uid,
          createdAt: new Date(),
          participants: [currentUser.uid],
          date: new Date(formData.date + 'T' + formData.time),
          maxParticipants: parseInt(formData.maxParticipants),
          price: formData.price ? parseFloat(formData.price) : 0
        });

        setShowCreateModal(false);
        setFormData({
          title: '', description: '', sport: '', skillLevel: '', 
          type: 'Casual', location: '', date: '', time: '', 
          maxParticipants: 10, price: ''
        });
        fetchActivities();
      } catch (error) {
        console.error('Error creating activity:', error);
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>Create New Activity</h2>
          <form onSubmit={handleSubmit} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sport</label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({...formData, sport: e.target.value})}
                  required
                >
                  <option value="">Select Sport</option>
                  {sports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Skill Level</label>
                <select
                  value={formData.skillLevel}
                  onChange={(e) => setFormData({...formData, skillLevel: e.target.value})}
                  required
                >
                  <option value="">Select Level</option>
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
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
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowCreateModal(false)}>
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

        {/* Activities Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading activities...</p>
          </div>
        ) : (
          <div className="activities-grid">
            {filteredActivities.map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
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

      {/* Create Activity Modal */}
      {showCreateModal && <CreateActivityModal />}
    </div>
  );
};

export default ActivitiesList;