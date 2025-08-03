# Firebase Troubleshooting Guide

## Current Issue: "Missing or insufficient permissions"

This error occurs because either:
1. Firebase is not properly configured (missing environment variables)
2. Firestore security rules are too restrictive
3. Firebase project is not set up correctly

## Step-by-Step Fix:

### Step 1: Check if you have a `.env` file

Look in your project root directory. If you don't see a `.env` file, you need to create one.

### Step 2: Create Firebase Project (if not done)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it (e.g., "sports-buddy-app")
4. Follow the setup wizard

### Step 3: Get Your Firebase Configuration

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "sports-buddy-web")
6. Copy the configuration object

### Step 4: Create `.env` file

Create a file named `.env` in your project root with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Example:**
```env
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnop
VITE_FIREBASE_AUTH_DOMAIN=sports-buddy-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sports-buddy-app
VITE_FIREBASE_STORAGE_BUCKET=sports-buddy-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123DEF4
```

### Step 5: Enable Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select a location
5. Click "Done"

### Step 6: Update Firestore Security Rules

1. In your Firebase project, go to "Firestore Database"
2. Click the "Rules" tab
3. Replace the current rules with:

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

4. Click "Publish"

### Step 7: Restart Your Development Server

1. Stop your current development server (Ctrl+C)
2. Run `npm run dev` again
3. The app should now show "Firebase connected successfully!"

## Quick Test:

After completing the steps above, you should see:
- ✅ "Firebase connected successfully!" message on dashboard
- No more "Missing or insufficient permissions" errors
- Real-time data loading in Buddies and Messages sections

## If Still Getting Errors:

1. **Check browser console** for specific error messages
2. **Verify environment variables** are correct
3. **Ensure Firestore is enabled** in your Firebase project
4. **Check that security rules are published** (not just saved)
5. **Restart the development server** after making changes

## Common Issues:

- **"Project not found"**: Check your project ID in `.env`
- **"Invalid API key"**: Check your API key in `.env`
- **"Missing or insufficient permissions"**: Update security rules as shown above
- **"Firebase not configured"**: Create the `.env` file with correct values

Need more help? Check the Firebase documentation or create an issue in the project repository. 