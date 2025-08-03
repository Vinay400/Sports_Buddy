import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import ActivitiesList from './components/Activities/ActivitiesList';
import Profile from './components/Profile/Profile';
import SportsAuth from './components/Auth/SportsAuth';
import './App.css';
import BuddiesList from './components/Buddies/BuddiesList';
import MessagesList from './components/Messages/MessagesList';
import BuddyRequests from './components/Buddies/BuddyRequests';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/dashboard" />;
};

// Main App Content
const AppContent = () => {
  const { currentUser } = useAuth();

  return (
    <div className="app">
      {currentUser && <Header />}
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={
            <PublicRoute>
              <SportsAuth />
            </PublicRoute>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/activities" element={
            <ProtectedRoute>
              <ActivitiesList />
            </ProtectedRoute>
          } />

           <Route path="/buddies" element={
            <ProtectedRoute>
              <BuddiesList />
            </ProtectedRoute>
          } />

          <Route path="/requests" element={
            <ProtectedRoute>
              <BuddyRequests />
            </ProtectedRoute>
          } />

             <Route path="/messages" element={
            <ProtectedRoute>
              <MessagesList />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Redirect root to appropriate page */}
          <Route path="/" element={
            currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />
          } />

          {/* Catch all - redirect to dashboard or auth */}
          <Route path="*" element={
            currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />
          } />
        </Routes>
      </main>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;