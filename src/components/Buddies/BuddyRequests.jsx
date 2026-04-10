import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  UserPlus,
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
  getDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import './BuddyRequests.css';

const RequestCard = ({ request, onAccept, onReject }) => (
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
        <span className="request-time">{request.formattedTime}</span>
      </div>

      {request.sender?.location && (
        <p className="request-location">📍 {request.sender.location}</p>
      )}

      {request.sender?.favoriteSports &&
        request.sender.favoriteSports.length > 0 && (
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
          onClick={() => onAccept(request.id, request.from)}
        >
          <Check size={16} />
          Accept
        </button>
        <button
          className="request-btn reject-btn"
          onClick={() => onReject(request.id)}
        >
          <X size={16} />
          Reject
        </button>
      </div>
    </div>
  </div>
);

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 168) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const BuddyRequests = () => {
  const { currentUser, fetchUserProfile } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      setIncomingRequests([]);
      setLoading(false);
      return;
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
              const senderDoc = await getDoc(doc(db, 'users', request.from));
              if (senderDoc.exists()) {
                request.sender = { id: request.from, ...senderDoc.data() };
              }
              request.formattedTime = formatTime(request.createdAt);
              return request;
            })
          );
          setIncomingRequests(requestsData);
          setLoading(false);
        } catch (err) {
          console.error('Error processing requests:', err);
          setError('Failed to load requests. Please try again.');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching requests:', err);
        setError('Failed to load requests. Please check your connection.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  }, []);

  const acceptRequest = useCallback(
    async (requestId, senderId) => {
      if (!isFirebaseConfigured) {
        alert('Please configure Firebase to use this feature.');
        return;
      }
      if (!currentUser) {
        alert('You must be logged in to accept requests.');
        return;
      }

      try {
        await updateDoc(doc(db, 'buddyRequests', requestId), {
          status: 'accepted',
          acceptedAt: new Date(),
        });

        const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const currentUserBuddies = currentUserDoc.data()?.buddies || [];

        const senderDoc = await getDoc(doc(db, 'users', senderId));
        const senderBuddies = senderDoc.data()?.buddies || [];

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

        await fetchUserProfile(currentUser.uid);
        alert('Buddy request accepted! You can now message each other.');
      } catch (err) {
        console.error('Error accepting request:', err);
        alert('Failed to accept request. Please try again.');
      }
    },
    [currentUser, fetchUserProfile]
  );

  const rejectRequest = useCallback(
    async (requestId) => {
      if (!isFirebaseConfigured) {
        alert('Please configure Firebase to use this feature.');
        return;
      }
      if (!currentUser) {
        alert('You must be logged in to reject requests.');
        return;
      }

      try {
        await updateDoc(doc(db, 'buddyRequests', requestId), {
          status: 'rejected',
          rejectedAt: new Date(),
        });
        alert('Request rejected.');
      } catch (err) {
        console.error('Error rejecting request:', err);
        alert('Failed to reject request. Please try again.');
      }
    },
    [currentUser]
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
              Buddy requests require Firebase credentials in your environment.
              Use the setup guide to connect your own project for full functionality.
            </p>
            <a href="/SETUP.md" className="setup-link">
              View Setup Guide
            </a>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={handleRetry} className="retry-btn">
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
                <RequestCard
                  key={request.id}
                  request={request}
                  onAccept={acceptRequest}
                  onReject={rejectRequest}
                />
              ))
            ) : (
              <div className="empty-state">
                <UserPlus size={48} />
                <h3>No pending requests</h3>
                <p>
                  When other users send you buddy requests, they'll appear
                  here!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuddyRequests;