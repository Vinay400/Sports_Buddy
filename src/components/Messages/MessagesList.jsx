import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Search, 
  MessageCircle, 
  Send,
  ArrowLeft,
  MoreVertical,
  Phone,
  Video,
  UserPlus
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  where, 
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import './MessagesList.css';

const ActivityParticipantsModal = ({ participantEmail, onClose, startNewConversation }) => {
  const { currentUser } = useAuth();

  const getUserByEmail = async (email) => {
    if (!isFirebaseConfigured) {
      alert('Please configure Firebase to use this feature. Check SETUP.md for instructions.');
      return null;
    }

    try {
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const userSnapshot = await getDocs(usersQuery);

      if (userSnapshot.empty) {
        alert('User not found');
        return null;
      }
      return userSnapshot.docs[0].id;
    } catch (error) {
      console.error('Error finding user by email:', error);
      alert('Failed to find user. Please try again.');
      return null;
    }
  };

  const handleMessageClick = async () => {
    if (!currentUser) return alert('You must be logged in');

    const buddyId = await getUserByEmail(participantEmail);
    if (!buddyId) return;

    startNewConversation(buddyId);
    onClose();
  };

  const handleAddBuddyClick = async () => {
    if (!currentUser) return alert('You must be logged in');

    const buddyId = await getUserByEmail(participantEmail);
    if (!buddyId) return;

    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'buddies'), {
        buddyId,
        addedAt: serverTimestamp(),
      });
      alert('Buddy added successfully!');
      onClose();
    } catch (error) {
      console.error('Error adding buddy:', error);
      alert('Failed to add buddy. Please try again.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>&times;</button>

        <h2>Activity Participants</h2>

        <div className="participant-card">
          <h3>User</h3>
          <p>{participantEmail}</p>

          <div className="participant-actions">
            <button className="btn btn-message" onClick={handleMessageClick}>
              Message
            </button>
            <button className="btn btn-add-buddy" onClick={handleAddBuddyClick}>
              Add Buddy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessagesList = () => {
  const { currentUser, userProfile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participantEmail, setParticipantEmail] = useState('');
  const [buddies, setBuddies] = useState([]);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = fetchConversations();
      const buddiesUnsubscribe = fetchBuddies();
      return () => {
        unsubscribe && unsubscribe();
        buddiesUnsubscribe && buddiesUnsubscribe();
      };
    }
  }, [currentUser]);

  useEffect(() => {
    let unsubscribe;
    if (selectedConversation) {
      unsubscribe = loadMessages(selectedConversation.id);
    }
    return () => unsubscribe && unsubscribe();
  }, [selectedConversation]);

  const fetchBuddies = () => {
    try {
      if (!isFirebaseConfigured) {
        setBuddies([]);
        return () => {}; // Return empty function for cleanup
      }

      const buddiesQuery = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(buddiesQuery, (snapshot) => {
        const buddiesData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => 
            user.id !== currentUser?.uid && 
            userProfile?.buddies?.includes(user.id)
          );

        setBuddies(buddiesData);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching buddies:', error);
      return () => {}; // Return empty function for cleanup
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isFirebaseConfigured) {
        console.log('Firebase not configured - showing demo message');
        setConversations([]);
        setLoading(false);
        return () => {}; // Return empty function for cleanup
      }

      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUser.uid),
        orderBy('lastMessageAt', 'desc')
      );

      const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
        try {
          const conversationsData = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
              const conversation = { id: docSnapshot.id, ...docSnapshot.data() };

              const otherParticipantId = conversation.participants.find(
                id => id !== currentUser.uid
              );

              if (otherParticipantId) {
                const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
                if (userDoc.exists()) {
                  conversation.otherUser = { id: otherParticipantId, ...userDoc.data() };
                }
              }

              return conversation;
            })
          );

          setConversations(conversationsData);
          setLoading(false);
        } catch (error) {
          console.error('Error processing conversations:', error);
          setError('Failed to load conversations. Please try again.');
          setLoading(false);
        }
      }, (error) => {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations. Please check your connection.');
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up conversations listener:', error);
      setError('Failed to load conversations. Please check your connection.');
      setLoading(false);
      return () => {}; // Return empty function for cleanup
    }
  };

  const loadMessages = (conversationId) => {
    try {
      if (!isFirebaseConfigured) {
        setMessages([]);
        return () => {}; // Return empty function for cleanup
      }

      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messagesData);
      }, (error) => {
        console.error('Error loading messages:', error);
        setMessages([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up messages listener:', error);
      setMessages([]);
      return () => {}; // Return empty function for cleanup
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    try {
      if (!isFirebaseConfigured) {
        alert('Please configure Firebase to use this feature. Check SETUP.md for instructions.');
        return;
      }

      setSendingMessage(true);

      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        createdAt: serverTimestamp()
      };

      await addDoc(
        collection(db, 'conversations', selectedConversation.id, 'messages'),
        messageData
      );

      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp(),
        lastMessageBy: currentUser.uid
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const startNewConversation = async (buddyId) => {
    try {
      if (!isFirebaseConfigured) {
        alert('Please configure Firebase to use this feature. Check SETUP.md for instructions.');
        return;
      }

      if (!currentUser) {
        alert('You must be logged in to start conversations.');
        return;
      }

      // Check if users are buddies
      const isBuddy = userProfile?.buddies?.includes(buddyId);
      if (!isBuddy) {
        alert('You can only message users who are your buddies. Send them a buddy request first!');
        return;
      }

      // Create a unique conversation ID
      const conversationId = [currentUser.uid, buddyId].sort().join('_');
      
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => conv.id === conversationId);

      if (existingConversation) {
        setSelectedConversation(existingConversation);
        return;
      }

      // Create new conversation document
      const newConversation = {
        participants: [currentUser.uid, buddyId],
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageAt: serverTimestamp()
      };

      await setDoc(doc(db, 'conversations', conversationId), newConversation);
      
      // Refresh conversations to include the new one
      fetchConversations();
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
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

  const filteredConversations = conversations.filter(conversation =>
    conversation.otherUser?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.otherUser?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ConversationItem = ({ conversation, isSelected, onClick }) => (
    <div 
      className={`conversation-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="conversation-avatar">
        {conversation.otherUser?.profileImage ? (
          <img 
            src={conversation.otherUser.profileImage} 
            alt={`${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`} 
          />
        ) : (
          <div className="avatar-placeholder">
            {conversation.otherUser?.firstName?.[0]}{conversation.otherUser?.lastName?.[0]}
          </div>
        )}
      </div>

      <div className="conversation-info">
        <div className="conversation-header">
          <h4 className="conversation-name">
            {conversation.otherUser?.firstName} {conversation.otherUser?.lastName}
          </h4>
          <span className="conversation-time">
            {formatTime(conversation.lastMessageAt)}
          </span>
        </div>

        <p className="conversation-preview">
          {conversation.lastMessage || 'Start a conversation...'}
        </p>
      </div>
    </div>
  );

  const MessageBubble = ({ message, isOwn }) => (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        <p>{message.text}</p>
        <span className="message-time">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );

  const BuddyItem = ({ buddy }) => (
    <div 
      className="conversation-item buddy-item"
      onClick={() => startNewConversation(buddy.id)}
    >
      <div className="conversation-avatar">
        {buddy.profileImage ? (
          <img 
            src={buddy.profileImage} 
            alt={`${buddy.firstName} ${buddy.lastName}`} 
          />
        ) : (
          <div className="avatar-placeholder">
            {buddy.firstName?.[0]}{buddy.lastName?.[0]}
          </div>
        )}
      </div>

      <div className="conversation-info">
        <div className="conversation-header">
          <h4 className="conversation-name">
            {buddy.firstName} {buddy.lastName}
          </h4>
          <UserPlus size={16} className="buddy-icon" />
        </div>

        <p className="conversation-preview">
          Click to start a conversation
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="messages-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  // Example: open modal with a participant email (replace with actual participant data)
  const openModalWithEmail = (email) => {
    setParticipantEmail(email);
    setShowParticipantsModal(true);
  };

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Conversations Sidebar */}
        <div className={`conversations-sidebar ${selectedConversation ? 'hidden-mobile' : ''}`}>
          <div className="sidebar-header">
            <h2>Messages</h2>
          </div>

          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {!isFirebaseConfigured && (
            <div className="demo-notice">
              <p>
                ⚠️ Running in demo mode. Configure Firebase to see real conversations and
                send messages.
              </p>
              <a href="/SETUP.md" className="setup-link">
                View Setup Guide
              </a>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={fetchConversations} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          <div className="conversations-list">
            {filteredConversations.length > 0 ? (
              filteredConversations.map(conversation => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                />
              ))
            ) : buddies.length > 0 ? (
              <div className="buddies-section">
                <h3 className="buddies-section-title">Your Buddies</h3>
                <p className="buddies-section-subtitle">Click on a buddy to start a conversation</p>
                {buddies.map(buddy => (
                  <BuddyItem key={buddy.id} buddy={buddy} />
                ))}
              </div>
            ) : (
              <div className="empty-conversations">
                <MessageCircle size={48} />
                <h3>No conversations yet</h3>
                <p>Start connecting with sports buddies to begin messaging!</p>
              </div>
            )}
          </div>

          {/* Example button to open participant modal (replace with your logic) */}
          <button
            style={{ marginTop: 20, padding: '8px 12px' }}
            onClick={() => openModalWithEmail('vinayguleria617@gmail.com')}
          >
            Show Participant Modal (Example)
          </button>
        </div>

        {/* Chat Area */}
        <div className={`chat-area ${!selectedConversation ? 'hidden-mobile' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <button 
                  className="back-btn mobile-only"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="chat-user-info">
                  <div className="chat-avatar">
                    {selectedConversation.otherUser?.profileImage ? (
                      <img 
                        src={selectedConversation.otherUser.profileImage} 
                        alt={`${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`} 
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {selectedConversation.otherUser?.firstName?.[0]}{selectedConversation.otherUser?.lastName?.[0]}
                      </div>
                    )}
                  </div>

                  <div className="user-details">
                    <h3>
                      {selectedConversation.otherUser?.firstName} {selectedConversation.otherUser?.lastName}
                    </h3>
                    <span className="user-status">Active now</span>
                  </div>
                </div>

                <div className="chat-actions">
                  <button className="action-btn">
                    <Phone size={20} />
                  </button>
                  <button className="action-btn">
                    <Video size={20} />
                  </button>
                  <button className="action-btn">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-area">
                {messages.length > 0 ? (
                  messages.map(message => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.senderId === currentUser.uid}
                    />
                  ))
                ) : (
                  <div className="empty-messages">
                    <MessageCircle size={48} />
                    <h3>Start the conversation</h3>
                    <p>Send your first message to say hello!</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form className="message-input-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sendingMessage}
                />
                <button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <h3>Select a conversation to start chatting</h3>
            </div>
          )}
        </div>
      </div>

      {showParticipantsModal && (
        <ActivityParticipantsModal
          participantEmail={participantEmail}
          onClose={() => setShowParticipantsModal(false)}
          startNewConversation={startNewConversation}
        />
      )}
    </div>
  );
};

export default MessagesList;
