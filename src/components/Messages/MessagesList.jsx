import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Search, 
  MessageCircle, 
  Send,
  ArrowLeft,
  MoreVertical,
  Phone,
  Video
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import './MessagesList.css';

const MessagesList = () => {
  const { currentUser, userProfile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      // Load messages for selected conversation
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Try Firebase first, fallback to sample data
      try {
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', currentUser.uid),
          orderBy('lastMessageAt', 'desc')
        );
        
        const snapshot = await getDocs(conversationsQuery);
        const conversationsData = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const conversation = { id: docSnapshot.id, ...docSnapshot.data() };
            
            // Get other participant's info
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
        
        if (conversationsData.length > 0) {
          setConversations(conversationsData);
        } else {
          setConversations(getSampleConversations());
        }
      } catch (firebaseError) {
        // Firebase not configured, using sample data
        setConversations(getSampleConversations());
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations(getSampleConversations());
    } finally {
      setLoading(false);
    }
  };

  const getSampleConversations = () => {
    return [
      {
        id: 'conv1',
        participants: [currentUser.uid, 'buddy1'],
        lastMessage: 'Hey! Are you up for tennis this weekend?',
        lastMessageAt: new Date(),
        lastMessageBy: 'buddy1',
        otherUser: {
          id: 'buddy1',
          firstName: 'Alex',
          lastName: 'Johnson',
          profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
        }
      },
      {
        id: 'conv2',
        participants: [currentUser.uid, 'buddy2'],
        lastMessage: 'Thanks for the cycling tips!',
        lastMessageAt: new Date(Date.now() - 3600000), // 1 hour ago
        lastMessageBy: currentUser.uid,
        otherUser: {
          id: 'buddy2',
          firstName: 'Sarah',
          lastName: 'Williams',
          profileImage: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150'
        }
      },
      {
        id: 'conv3',
        participants: [currentUser.uid, 'buddy3'],
        lastMessage: 'Great game today! Same time next week?',
        lastMessageAt: new Date(Date.now() - 86400000), // 1 day ago
        lastMessageBy: 'buddy3',
        otherUser: {
          id: 'buddy3',
          firstName: 'Mike',
          lastName: 'Chen',
          profileImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150'
        }
      }
    ];
  };

  const getSampleMessages = (conversationId) => {
    const messagesByConversation = {
      'conv1': [
        {
          id: 'msg1',
          text: 'Hey! Are you up for tennis this weekend?',
          senderId: 'buddy1',
          createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
        },
        {
          id: 'msg2',
          text: 'Absolutely! What time works for you?',
          senderId: currentUser.uid,
          createdAt: new Date(Date.now() - 1200000) // 20 minutes ago
        },
        {
          id: 'msg3',
          text: 'How about 10 AM at Central Park courts?',
          senderId: 'buddy1',
          createdAt: new Date(Date.now() - 600000) // 10 minutes ago
        }
      ],
      'conv2': [
        {
          id: 'msg4',
          text: 'Thanks for the cycling tips!',
          senderId: currentUser.uid,
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          id: 'msg5',
          text: 'You\'re welcome! Let me know if you need any gear recommendations.',
          senderId: 'buddy2',
          createdAt: new Date(Date.now() - 3000000) // 50 minutes ago
        }
      ],
      'conv3': [
        {
          id: 'msg6',
          text: 'Great game today! Same time next week?',
          senderId: 'buddy3',
          createdAt: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          id: 'msg7',
          text: 'Definitely! I\'ll bring my A-game next time 😄',
          senderId: currentUser.uid,
          createdAt: new Date(Date.now() - 86000000) // 23 hours ago
        }
      ]
    };
    
    return messagesByConversation[conversationId] || [];
  };

  const loadMessages = (conversationId) => {
    try {
      // Try Firebase first
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messagesData);
      }, (error) => {
        // Firebase not configured, using sample messages
        setMessages(getSampleMessages(conversationId));
      });
    } catch (error) {
              // Using sample messages
      setMessages(getSampleMessages(conversationId));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        createdAt: new Date()
      };

      // Try Firebase first
      try {
        await addDoc(
          collection(db, 'conversations', selectedConversation.id, 'messages'),
          {
            ...messageData,
            createdAt: serverTimestamp()
          }
        );

        // Update conversation's last message
        await updateDoc(doc(db, 'conversations', selectedConversation.id), {
          lastMessage: newMessage.trim(),
          lastMessageAt: serverTimestamp(),
          lastMessageBy: currentUser.uid
        });
      } catch (firebaseError) {
        // Firebase not configured, updating local state
        
        // Update local messages
        const newMsg = {
          id: `msg_${Date.now()}`,
          ...messageData
        };
        setMessages(prev => [...prev, newMsg]);
        
        // Update conversation last message
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { 
                ...conv, 
                lastMessage: newMessage.trim(),
                lastMessageAt: new Date(),
                lastMessageBy: currentUser.uid
              }
            : conv
        ));
      }


      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const startNewConversation = async (buddyId) => {
    try {
      // Check if conversation already exists
      const conversationId = [currentUser.uid, buddyId].sort().join('_');
      const existingConversation = conversations.find(conv => conv.id === conversationId);
      
      if (existingConversation) {
        setSelectedConversation(existingConversation);
        return;
      }

      // Try to create new conversation
      try {
        const newConversation = {
          id: conversationId,
          participants: [currentUser.uid, buddyId],
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageAt: serverTimestamp()
        };

        await addDoc(collection(db, 'conversations'), newConversation);
        fetchConversations();
      } catch (firebaseError) {
        // Firebase not configured, creating local conversation
        // Create a sample conversation locally
        const newConv = {
          id: conversationId,
          participants: [currentUser.uid, buddyId],
          lastMessage: '',
          lastMessageAt: new Date(),
          otherUser: {
            id: buddyId,
            firstName: 'New',
            lastName: 'Buddy',
            profileImage: null
          }
        };
        setConversations(prev => [newConv, ...prev]);
        setSelectedConversation(newConv);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
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
    } else if (diffInHours < 168) { // 7 days
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
            ) : (
              <div className="empty-conversations">
                <MessageCircle size={48} />
                <h3>No conversations yet</h3>
                <p>Start connecting with sports buddies to begin messaging!</p>
              </div>
            )}
          </div>
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
                    <p>Send a message to {selectedConversation.otherUser?.firstName}!</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form className="message-input-form" onSubmit={sendMessage}>
                <div className="message-input-container">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendingMessage}
                  />
                  <button 
                    type="submit" 
                    className="send-btn"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <MessageCircle size={64} />
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesList;