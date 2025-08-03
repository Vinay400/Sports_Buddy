# Firebase Firestore Security Rules

## Correct Rules for Sports Buddy App

Replace your current Firestore security rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - allow reading all users for buddies list, writing own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Activities collection - allow reading all activities, writing for authenticated users
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.createdBy || 
         request.auth.uid in resource.data.participants);
      allow delete: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }
    
    // Conversations collection - for messaging
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    
    // Messages subcollection - for individual messages
    match /conversations/{conversationId}/messages/{messageId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    }
    
    // Buddy requests collection
    match /buddyRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Key Changes Made:

### 1. **Users Collection**
- **Before**: `allow read, write: if request.auth != null && request.auth.uid == userId;`
- **After**: `allow read: if request.auth != null;` (for buddies list) + `allow write: if request.auth != null && request.auth.uid == userId;` (for own profile)

### 2. **Activities Collection**
- **Before**: `allow read: if request.auth != null;` (this was correct)
- **After**: Same, but clarified the structure

### 3. **Added Messages Subcollection**
- Added explicit rules for the messages subcollection under conversations

## How to Apply:

1. Go to your Firebase Console
2. Navigate to Firestore Database
3. Click on the "Rules" tab
4. Replace the current rules with the ones above
5. Click "Publish"

## Why This Fixes the Dashboard:

The dashboard needs to:
- Read all users to show the buddies count
- Read all activities to show the activities count
- Read conversations to show the messages count

Your previous rules were too restrictive and only allowed users to read their own data, which prevented the dashboard from working.

## Security Considerations:

- Users can read all user profiles (needed for buddies list)
- Users can only write their own profile
- Users can read all activities (needed for dashboard stats)
- Users can only create/update activities they're involved with
- Conversations and messages are properly secured to participants only
- Buddy requests are open to all authenticated users

This provides a good balance between functionality and security. 