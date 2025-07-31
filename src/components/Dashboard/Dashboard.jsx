import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Activity, 
  Users, 
  Calendar, 
  MapPin, 
  Clock, 
  Star,
  Plus,
  TrendingUp
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState({
    activitiesJoined: 0,
    buddiesFound: 0,
    hoursActive: 0,
    activitiesCreated: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's activities
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('participants', 'array-contains', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);
      setRecentActivities(activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));

      // Fetch upcoming events
      const eventsQuery = query(
        collection(db, 'activities'),
        where('participants', 'array-contains', currentUser.uid),
        where('date', '>=', new Date()),
        orderBy('date', 'asc'),
        limit(3)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      setUpcomingEvents(eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));

      // Update stats (mock data for now)
      setStats({
        activitiesJoined: activitiesSnapshot.docs.length,
        buddiesFound: 12,
        hoursActive: 45,
        activitiesCreated: 3
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, color, trend }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h4 className="stat-title">{title}</h4>
        <p className="stat-value">{value}</p>
        {trend && (
          <div className="stat-trend">
            <TrendingUp size={14} />
            <span>+{trend}% this week</span>
          </div>
        )}
      </div>
    </div>
  );

  const ActivityCard = ({ activity }) => (
    <div className="activity-card">
      <div className="activity-header">
        <div className="activity-sport">{activity.sport}</div>
        <div className="activity-date">
          {new Date(activity.date?.toDate()).toLocaleDateString()}
        </div>
      </div>
      <h4 className="activity-title">{activity.title}</h4>
      <div className="activity-details">
        <div className="activity-location">
          <MapPin size={14} />
          <span>{activity.location}</span>
        </div>
        <div className="activity-participants">
          <Users size={14} />
          <span>{activity.participants?.length || 0} / {activity.maxParticipants}</span>
        </div>
      </div>
      <div className="activity-tags">
        <span className="activity-tag">{activity.skillLevel}</span>
        <span className="activity-tag">{activity.type}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Welcome back, {userProfile?.firstName || currentUser?.displayName || 'Athlete'}! 🏃‍♂️
            </h1>
            <p className="welcome-subtitle">
              Ready to find your next sports buddy and stay active?
            </p>
          </div>
          <button className="create-activity-btn">
            <Plus size={20} />
            Create Activity
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            icon={<Activity size={24} />}
            title="Activities Joined"
            value={stats.activitiesJoined}
            color="#667eea"
            trend={12}
          />
          <StatCard
            icon={<Users size={24} />}
            title="Buddies Found"
            value={stats.buddiesFound}
            color="#764ba2"
            trend={8}
          />
          <StatCard
            icon={<Clock size={24} />}
            title="Hours Active"
            value={`${stats.hoursActive}h`}
            color="#f093fb"
            trend={15}
          />
          <StatCard
            icon={<Star size={24} />}
            title="Activities Created"
            value={stats.activitiesCreated}
            color="#4facfe"
            trend={5}
          />
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {/* Recent Activities */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Recent Activities</h2>
              <a href="/activities" className="section-link">View All</a>
            </div>
            <div className="activities-grid">
              {recentActivities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
              {recentActivities.length === 0 && (
                <div className="empty-state">
                  <Activity size={48} />
                  <h3>No activities yet</h3>
                  <p>Start by joining or creating your first activity!</p>
                  <button className="cta-btn">Find Activities</button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Upcoming Events</h2>
              <a href="/calendar" className="section-link">View Calendar</a>
            </div>
            <div className="events-list">
              {upcomingEvents.map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-date">
                    <div className="event-day">
                      {new Date(event.date?.toDate()).getDate()}
                    </div>
                    <div className="event-month">
                      {new Date(event.date?.toDate()).toLocaleDateString('en', { month: 'short' })}
                    </div>
                  </div>
                  <div className="event-details">
                    <h4 className="event-title">{event.title}</h4>
                    <div className="event-info">
                      <span className="event-time">
                        <Clock size={14} />
                        {new Date(event.date?.toDate()).toLocaleTimeString('en', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="event-location">
                        <MapPin size={14} />
                        {event.location}
                      </span>
                    </div>
                  </div>
                  <div className="event-sport">{event.sport}</div>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="empty-state-small">
                  <Calendar size={32} />
                  <p>No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3 className="section-title">Quick Actions</h3>
          <div className="actions-grid">
            <a href="/activities/create" className="action-card">
              <Plus size={24} />
              <span>Create Activity</span>
            </a>
            <a href="/buddies" className="action-card">
              <Users size={24} />
              <span>Find Buddies</span>
            </a>
            <a href="/activities" className="action-card">
              <Activity size={24} />
              <span>Browse Activities</span>
            </a>
            <a href="/profile" className="action-card">
              <Star size={24} />
              <span>Update Profile</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;