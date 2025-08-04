import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  MessageCircle,
  Trophy,
  MapPin,
  Clock,
  Plus
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import ParticipantsModal from '../Participants/ParticipantsModal';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activities: 0,
    buddies: 0,
    messages: 0,
    achievements: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [firebaseStatus, setFirebaseStatus] = useState('checking');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    testFirebaseConnection();
  }, [currentUser]);

  const testFirebaseConnection = async () => {
    try {
      if (!isFirebaseConfigured) {
        setFirebaseStatus('not-configured');
        return;
      }

      const testQuery = collection(db, 'users');
      const snapshot = await getDocs(testQuery);
      setFirebaseStatus('connected');
    } catch (error) {
      console.error('Firebase connection failed:', error);
      setFirebaseStatus('failed');
    }
  };

  const fetchDashboardData = async () => {
    try {
      if (!currentUser) return;
      const uid = currentUser.uid;

      const activitiesSnapshot = await getDocs(collection(db, 'activities'));
      const usersSnapshot = await getDocs(collection(db, 'users'));

      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', uid)
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);

      setStats({
        activities: activitiesSnapshot.size,
        buddies: usersSnapshot.docs.filter(doc => doc.id !== uid).length,
        messages: conversationsSnapshot.size,
        achievements: userProfile?.achievements?.length || 0
      });

      const recentActivitiesData = activitiesSnapshot.docs
        .slice(0, 3)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      setRecentActivities(recentActivitiesData);
    } catch (error) {
      console.error('🔥 Unexpected error:', error);
    }
  };

  // Fetch full user details for participant IDs
  const fetchParticipantsData = async (participantIds) => {
    if (!participantIds || participantIds.length === 0) {
      setSelectedParticipants([]);
      return;
    }
    try {
      // Firestore allows max 10 for 'in' queries, split if needed
      // but here assuming small arrays for simplicity
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('__name__', 'in', participantIds));
      const querySnapshot = await getDocs(q);
      const participants = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSelectedParticipants(participants);
    } catch (error) {
      console.error('Error fetching participants data:', error);
      setSelectedParticipants([]);
    }
  };

  const handleParticipantsClick = (participantIds) => {
    fetchParticipantsData(participantIds);
    setIsModalOpen(true);
  };

  // Navigation handlers for quick actions
  const handleCreateActivity = () => {
    navigate('/activities');
  };

  const handleFindBuddies = () => {
    navigate('/buddies');
  };

  const handleViewMessages = () => {
    navigate('/messages');
  };

  const handleViewAchievements = () => {
    navigate('/profile');
  };

  const handleViewAllActivities = () => {
    navigate('/activities');
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  const ActivityCard = ({ activity }) => (
    <div className="activity-card">
      <div className="activity-header">
        <h4>{activity.title}</h4>
        <span className="activity-sport">{activity.sport}</span>
      </div>
      <div className="activity-details">
        <div className="activity-info">
          <MapPin size={16} />
          <span>{activity.location}</span>
        </div>
        <div className="activity-info">
          <Clock size={16} />
          <span>
            {activity.date
              ? new Date(activity.date).toLocaleDateString()
              : 'Invalid Date'}
          </span>
        </div>
      </div>
      <div className="activity-participants">
        <Users size={16} />
        <span
          style={{ color: '#667eea', cursor: 'pointer' }}
          onClick={() => handleParticipantsClick(activity.participants || [])}
        >
          {activity.participants?.length || 0} participants
        </span>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Welcome back, {userProfile?.firstName || 'Sports Buddy'}!</h1>
            <p>Ready for your next sports adventure?</p>
          </div>
        </div>

        {/* Firebase Status */}
        {firebaseStatus === 'checking' && (
          <div className="status-card checking">
            <p>Checking Firebase connection...</p>
          </div>
        )}
        {firebaseStatus === 'connected' && (
          <div className="status-card connected">
            <p>✅ Firebase connected successfully!</p>
          </div>
        )}
        {firebaseStatus === 'not-configured' && (
          <div className="status-card not-configured">
            <p>⚠️ Firebase not configured - Running in demo mode</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#666' }}>
              To enable full functionality, please set up your Firebase project and environment variables.
            </p>
          </div>
        )}
        {firebaseStatus === 'failed' && (
          <div className="status-card failed">
            <p>❌ Firebase connection failed</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#666' }}>
              Please check your environment variables and Firebase project configuration.
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard icon={Calendar} title="Activities" value={stats.activities} color="#667eea" />
          <StatCard icon={Users} title="Buddies" value={stats.buddies} color="#764ba2" />
          <StatCard icon={MessageCircle} title="Messages" value={stats.messages} color="#f093fb" />
          <StatCard icon={Trophy} title="Achievements" value={stats.achievements} color="#f5576c" />
        </div>

        {/* Recent Activities */}
        <div className="recent-activities">
          <div className="section-header">
            <h2>Recent Activities</h2>
            <button className="view-all-btn" onClick={handleViewAllActivities}>View All</button>
          </div>
          <div className="activities-grid">
            {recentActivities.length > 0 ? (
              recentActivities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="empty-activities">
                <Calendar size={48} />
                <h3>No activities yet</h3>
                <p>Join or create your first sports activity!</p>
                <button className="create-activity-btn" onClick={handleCreateActivity}>
                  <Plus size={20} />
                  Create Activity
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-btn" onClick={handleCreateActivity}>
              <Plus size={20} />
              Create Activity
            </button>
            <button className="action-btn" onClick={handleFindBuddies}>
              <Users size={20} />
              Find Buddies
            </button>
            <button className="action-btn" onClick={handleViewMessages}>
              <MessageCircle size={20} />
              View Messages
            </button>
            <button className="action-btn" onClick={handleViewAchievements}>
              <Trophy size={20} />
              View Achievements
            </button>
          </div>
        </div>

        {/* Participants Modal */}
        <ParticipantsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          participants={selectedParticipants}
        />
      </div>
    </div>
  );
};

export default Dashboard;
