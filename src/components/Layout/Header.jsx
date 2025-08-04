import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Bell, Search, Menu, X } from 'lucide-react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './Header.css';

const Header = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleNotifications = async () => {
    setShowNotifications(!showNotifications);

    // Mark notifications as read when opening
    if (!showNotifications) {
      notifications.forEach(async (notif) => {
        if (!notif.read) {
          await updateDoc(doc(db, 'notifications', notif.id), { read: true });
        }
      });
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <div className="logo-icon">🏆</div>
          <h1>Sports Buddy</h1>
        </div>

        {/* Search Bar */}
        <div className="header-search">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search sports, activities, or buddies..."
            className="search-input"
          />
        </div>

        {/* Navigation */}
        <nav className={`header-nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/activities" className="nav-link">Activities</a>
          <a href="/buddies" className="nav-link">Buddies</a>
          <a href="/messages" className="nav-link">Messages</a>
        </nav>

        {/* User Actions */}
        <div className="header-actions">
          {/* Notifications */}
          <div className="notification-wrapper">
            <button className="action-btn" onClick={toggleNotifications}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-modal">
                <h4>Notifications</h4>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notification-item ${notif.read ? 'read' : ''}`}
                      >
                        <p>{notif.message}</p>
                        <span className="notif-time">
                          {new Date(notif.createdAt?.seconds * 1000).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="no-notifications">No new notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="profile-dropdown">
            <button 
              className="profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <User size={20} />
              <span className="profile-name">
                {userProfile?.firstName || currentUser?.displayName || 'User'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="profile-menu">
                <a href="/profile" className="profile-menu-item">
                  <User size={16} />
                  My Profile
                </a>
                <a href="/settings" className="profile-menu-item">
                  Settings
                </a>
                <button 
                  onClick={handleLogout}
                  className="profile-menu-item logout-btn"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
