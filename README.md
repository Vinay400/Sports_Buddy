# Sports Buddy App

A React application for connecting sports enthusiasts and managing activities.

## Features

- **Authentication**: Sign up/login with email or Google
- **Dashboard**: Overview of activities and buddies
- **Activities**: Create and join sports activities
- **Buddies**: Find and connect with sports buddies
- **Messages**: Real-time messaging between buddies
- **Profile**: Manage your sports profile

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google)
3. Enable Firestore Database
4. Get your Firebase configuration

### 3. Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Firestore Security Rules

Set up your Firestore security rules to allow read/write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    match /conversations/{conversationId}/messages/{messageId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    }
    match /buddyRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Deployment

### Netlify Deployment

1. **Push your code to GitHub**
2. **Connect to Netlify**:
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

3. **Set Environment Variables**:
   - Go to Site settings > Environment variables
   - Add all Firebase environment variables:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID`

4. **Deploy**: Netlify will automatically build and deploy your site

**Note**: Never commit your actual Firebase configuration values to version control. Always use environment variables for sensitive data.

## Features Status

### ✅ Working Features
- User authentication (email/password and Google)
- User profile management
- Real-time buddies listing
- Real-time messaging system
- Activity management
- Responsive design

### 🔧 Recent Improvements
- Removed all hardcoded sample data
- Added proper error handling
- Implemented real-time listeners
- Added retry functionality for failed operations
- Improved user experience with loading states

## Project Structure

```
src/
├── components/
│   ├── Activities/     # Activity management
│   ├── Auth/          # Authentication components
│   ├── Buddies/       # Buddy connection features
│   ├── Dashboard/     # Main dashboard
│   ├── Layout/        # Header and navigation
│   ├── Messages/      # Messaging system
│   └── Profile/       # User profile management
├── config/
│   └── firebase.js    # Firebase configuration
├── hooks/
│   └── useAuth.jsx    # Authentication hook
└── App.jsx           # Main application component
```

## Technologies Used

- **React 18** - Frontend framework
- **Firebase** - Backend services (Auth, Firestore)
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License 