import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Bell, Search, Menu, X } from 'lucide-react';
import './Header.css';

const Header = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
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
          <button className="action-btn">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>

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