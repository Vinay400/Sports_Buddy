# Firebase Setup Guide

## Current Status
Your app is currently running in **demo mode** because Firebase is not properly configured. Here's how to set it up:

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "sports-buddy-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Enable "Google" authentication (optional)
6. Save your changes

## Step 3: Enable Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll update security rules later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## Step 4: Get Your Firebase Configuration

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "sports-buddy-web")
6. Copy the configuration object

## Step 5: Create Environment Variables

Create a `.env` file in your project root with your Firebase configuration:

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

## Step 6: Set Up Firestore Security Rules

1. In your Firebase project, go to "Firestore Database"
2. Click the "Rules" tab
3. Replace the default rules with:

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

## Step 7: Restart Your Development Server

1. Stop your current development server (Ctrl+C)
2. Run `npm run dev` again
3. The app should now show "Firebase connected successfully!"

## Troubleshooting

### If you still see "Firebase connection failed":

1. **Check your environment variables**: Make sure all variables in `.env` are correct
2. **Restart the dev server**: Environment variables require a restart
3. **Check Firebase console**: Ensure your project is active and services are enabled
4. **Check browser console**: Look for specific error messages

### Common Issues:

- **"Missing or insufficient permissions"**: Your Firestore security rules are too restrictive
- **"Project not found"**: Check your project ID in the environment variables
- **"Invalid API key"**: Check your API key in the environment variables

## Testing the Setup

Once configured, you should see:
- ✅ "Firebase connected successfully!" message
- Real-time data loading in Buddies and Messages sections
- Ability to create accounts and log in
- Real-time messaging functionality

## Next Steps

After Firebase is configured:
1. Create a test account to verify authentication works
2. Test the buddies and messages functionality
3. Add some test data to see real-time updates
4. Customize the security rules based on your needs

Need help? Check the Firebase documentation or create an issue in the project repository. 