import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  User, 
  Edit3, 
  MapPin, 
  Calendar, 
  Trophy, 
  Star,
  Camera,
  Save,
  X
} from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import './Profile.css';

const Profile = () => {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    dateOfBirth: '',
    phoneNumber: '',
    favoriteSports: [],
    skillLevels: {},
    profileImage: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    activitiesJoined: 0,
    activitiesCreated: 0,
    rating: 4.5,
    joinDate: ''
  });

  const availableSports = [
    'Football', 'Basketball', 'Tennis', 'Running', 'Cycling',
    'Swimming', 'Volleyball', 'Badminton', 'Cricket', 'Golf'
  ];

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        phoneNumber: userProfile.phoneNumber || '',
        favoriteSports: userProfile.favoriteSports || [],
        skillLevels: userProfile.skillLevels || {},
        profileImage: userProfile.profileImage || ''
      });

      setStats({
        activitiesJoined: userProfile.activitiesJoined || 0,
        activitiesCreated: userProfile.activitiesCreated || 0,
        rating: userProfile.rating || 4.5,
        joinDate: userProfile.createdAt?.toDate().toLocaleDateString() || 'Recently'
      });
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'favoriteSports') {
      const updatedSports = checked
        ? [...profileData.favoriteSports, value]
        : profileData.favoriteSports.filter(sport => sport !== value);
      
      setProfileData(prev => ({
        ...prev,
        favoriteSports: updatedSports
      }));
    } else if (name.startsWith('skillLevel-')) {
      const sport = name.replace('skillLevel-', '');
      setProfileData(prev => ({
        ...prev,
        skillLevels: {
          ...prev.skillLevels,
          [sport]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          profileImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return profileData.profileImage;

    try {
      const imageRef = ref(storage, `profiles/${currentUser.uid}/profile-image`);
      await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return profileData.profileImage;
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Upload image if there's a new one
      const profileImageURL = await uploadImage();
      
      const updatedData = {
        ...profileData,
        profileImage: profileImageURL,
        profileComplete: true,
        updatedAt: new Date()
      };

      // Update Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updatedData);
      
      // Refresh user profile
      await fetchUserProfile(currentUser.uid);
      
      setIsEditing(false);
      setImageFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userProfile) {
      setProfileData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        phoneNumber: userProfile.phoneNumber || '',
        favoriteSports: userProfile.favoriteSports || [],
        skillLevels: userProfile.skillLevels || {},
        profileImage: userProfile.profileImage || ''
      });
    }
    setIsEditing(false);
    setImageFile(null);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profileData.profileImage ? (
                <img src={profileData.profileImage} alt="Profile" />
              ) : (
                <User size={60} />
              )}
              {isEditing && (
                <label className="avatar-upload">
                  <Camera size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>
          
          <div className="profile-info">
            <h1 className="profile-name">
              {profileData.firstName} {profileData.lastName}
            </h1>
            <div className="profile-meta">
              {profileData.location && (
                <div className="profile-meta-item">
                  <MapPin size={16} />
                  <span>{profileData.location}</span>
                </div>
              )}
              <div className="profile-meta-item">
                <Calendar size={16} />
                <span>Joined {stats.joinDate}</span>
              </div>
              <div className="profile-meta-item">
                <Star size={16} />
                <span>{stats.rating}/5.0 Rating</span>
              </div>
            </div>
            {profileData.bio && (
              <p className="profile-bio">{profileData.bio}</p>
            )}
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <div className="edit-actions">
                <button 
                  className="save-btn"
                  onClick={handleSave}
                  disabled={loading}
                >
                  <Save size={20} />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  <X size={20} />
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={20} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.activitiesJoined}</div>
            <div className="stat-label">Activities Joined</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.activitiesCreated}</div>
            <div className="stat-label">Activities Created</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.rating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          <div className="details-section">
            <h3 className="section-title">Personal Information</h3>
            
            {isEditing ? (
              <div className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Tell us about yourself and your sports interests..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={profileData.location}
                      onChange={handleInputChange}
                      placeholder="City, State"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={profileData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            ) : (
              <div className="info-display">
                <div className="info-item">
                  <label>Email</label>
                  <span>{currentUser?.email}</span>
                </div>
                {profileData.location && (
                  <div className="info-item">
                    <label>Location</label>
                    <span>{profileData.location}</span>
                  </div>
                )}
                {profileData.dateOfBirth && (
                  <div className="info-item">
                    <label>Date of Birth</label>
                    <span>{new Date(profileData.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                )}
                {profileData.phoneNumber && (
                  <div className="info-item">
                    <label>Phone</label>
                    <span>{profileData.phoneNumber}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="details-section">
            <h3 className="section-title">Sports & Skills</h3>
            
            {isEditing ? (
              <div className="sports-edit">
                <div className="form-group">
                  <label>Favorite Sports</label>
                  <div className="sports-checkboxes">
                    {availableSports.map(sport => (
                      <label key={sport} className="checkbox-label">
                        <input
                          type="checkbox"
                          name="favoriteSports"
                          value={sport}
                          checked={profileData.favoriteSports.includes(sport)}
                          onChange={handleInputChange}
                        />
                        <span>{sport}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {profileData.favoriteSports.map(sport => (
                  <div key={sport} className="form-group">
                    <label>Skill Level - {sport}</label>
                    <select
                      name={`skillLevel-${sport}`}
                      value={profileData.skillLevels[sport] || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Level</option>
                      {skillLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sports-display">
                {profileData.favoriteSports.length > 0 ? (
                  <div className="sports-list">
                    {profileData.favoriteSports.map(sport => (
                      <div key={sport} className="sport-item">
                        <span className="sport-name">{sport}</span>
                        {profileData.skillLevels[sport] && (
                          <span className="skill-level">
                            {profileData.skillLevels[sport]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-sports">No favorite sports selected yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;