import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Check,
  X,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import './BuddyRequests.css';

const BuddyRequests = () => {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = fetchIncomingRequests();
      return () => unsubscribe && unsubscribe();
    }
  }, [currentUser]);

  const fetchIncomingRequests = () => {
    try {
      setLoading(true);
      setError(null);

      if (!isFirebaseConfigured) {
        console.log('Firebase not configured - showing demo message');
        setIncomingRequests([]);
        setLoading(false);
        return () => {}; // Return empty function for cleanup
      }

      const requestsQuery = query(
        collection(db, 'buddyRequests'),
        where('to', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(
        requestsQuery,
        async (snapshot) => {
          try {
            const requestsData = await Promise.all(
              snapshot.docs.map(async (docSnapshot) => {
                const request = { id: docSnapshot.id, ...docSnapshot.data() };
                
                // Fetch sender's user data
                const senderDoc = await getDoc(doc(db, 'users', request.from));
                if (senderDoc.exists()) {
                  request.sender = { id: request.from, ...senderDoc.data() };
                }
                
                return request;
              })
            );

            setIncomingRequests(requestsData);
            setLoading(false);
          } catch (error) {
            console.error('Error processing requests:', error);
            setError('Failed to load requests. Please try again.');
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error fetching requests:', error);
          setError('Failed to load requests. Please check your connection.');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up requests listener:', error);
      setError('Failed to load requests. Please check your connection.');
      setLoading(false);
      return () => {}; // Return empty function for cleanup
    }
  };

  const acceptRequest = async (requestId, senderId) => {
    try {
      if (!isFirebaseConfigured) {
        alert('Please configure Firebase to use this feature. Check SETUP.md for instructions.');
        return;
      }

      if (!currentUser) {
        alert('You must be logged in to accept requests.');
        return;
      }

      // Update the request status to accepted
      await updateDoc(doc(db, 'buddyRequests', requestId), {
        status: 'accepted',
        acceptedAt: new Date(),
      });

      // Get current user's buddies array or create empty array if it doesn't exist
      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const currentUserBuddies = currentUserDoc.data()?.buddies || [];
      
      // Get sender's buddies array or create empty array if it doesn't exist
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      const senderBuddies = senderDoc.data()?.buddies || [];

      // Add each user to the other's buddies list (avoid duplicates)
      const updatedCurrentUserBuddies = currentUserBuddies.includes(senderId) 
        ? currentUserBuddies 
        : [...currentUserBuddies, senderId];
      
      const updatedSenderBuddies = senderBuddies.includes(currentUser.uid) 
        ? senderBuddies 
        : [...senderBuddies, currentUser.uid];

      await updateDoc(doc(db, 'users', currentUser.uid), {
        buddies: updatedCurrentUserBuddies,
      });

      await updateDoc(doc(db, 'users', senderId), {
        buddies: updatedSenderBuddies,
      });

      // Refresh user profile to reflect the new buddy
      await fetchUserProfile(currentUser.uid);

      alert('Buddy request accepted! You can now message each other.');
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      if (!isFirebaseConfigured) {
        alert('Please configure Firebase to use this feature. Check SETUP.md for instructions.');
        return;
      }

      if (!currentUser) {
        alert('You must be logged in to reject requests.');
        return;
      }

      // Update the request status to rejected
      await updateDoc(doc(db, 'buddyRequests', requestId), {
        status: 'rejected',
        rejectedAt: new Date(),
      });

      alert('Request rejected.');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const RequestCard = ({ request }) => (
    <div className="request-card">
      <div className="request-avatar">
        {request.sender?.profileImage ? (
          <img
            src={request.sender.profileImage}
            alt={`${request.sender.firstName} ${request.sender.lastName}`}
          />
        ) : (
          <div className="avatar-placeholder">
            {request.sender?.firstName?.[0]}
            {request.sender?.lastName?.[0]}
          </div>
        )}
      </div>

      <div className="request-info">
        <div className="request-header">
          <h3 className="request-name">
            {request.sender?.firstName} {request.sender?.lastName}
          </h3>
          <span className="request-time">
            {formatTime(request.createdAt)}
          </span>
        </div>

        {request.sender?.location && (
          <p className="request-location">
            📍 {request.sender.location}
          </p>
        )}

        {request.sender?.favoriteSports && request.sender.favoriteSports.length > 0 && (
          <div className="request-sports">
            <span className="sports-label">Sports:</span>
            <div className="sports-tags">
              {request.sender.favoriteSports.slice(0, 3).map((sport) => (
                <span key={sport} className="sport-tag">
                  {sport}
                </span>
              ))}
              {request.sender.favoriteSports.length > 3 && (
                <span className="more-sports">
                  +{request.sender.favoriteSports.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="request-actions">
          <button
            className="request-btn accept-btn"
            onClick={() => acceptRequest(request.id, request.from)}
          >
            <Check size={16} />
            Accept
          </button>
          <button
            className="request-btn reject-btn"
            onClick={() => rejectRequest(request.id)}
          >
            <X size={16} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="requests-page">
      <div className="requests-container">
        <div className="requests-header">
          <h1>Buddy Requests</h1>
          <p>Manage incoming connection requests from other sports enthusiasts</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="demo-notice">
            <p>
              ⚠️ Running in demo mode. Configure Firebase to see real buddy requests.
            </p>
            <a href="/SETUP.md" className="setup-link">
              View Setup Guide
            </a>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchIncomingRequests} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading buddy requests...</p>
          </div>
        ) : (
          <div className="requests-list">
            {incomingRequests.length > 0 ? (
              incomingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            ) : (
              <div className="empty-state">
                <UserPlus size={48} />
                <h3>No pending requests</h3>
                <p>When other users send you buddy requests, they'll appear here!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuddyRequests; 