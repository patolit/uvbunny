# Firebase Setup for UVbunny

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `uvbunny` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to you
5. Click "Done"

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ (Project settings)
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Enter app nickname: `uvbunny-web`
5. Click "Register app"
6. Copy the configuration object

## Step 4: Update Environment Files

Replace the placeholder values in these files with your Firebase config:

### `src/environments/environment.ts` (Development)
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'your-actual-api-key',
    authDomain: 'your-project-id.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project-id.appspot.com',
    messagingSenderId: 'your-messaging-sender-id',
    appId: 'your-app-id'
  }
};
```

### `src/environments/environment.prod.ts` (Production)
```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: 'your-actual-api-key',
    authDomain: 'your-project-id.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project-id.appspot.com',
    messagingSenderId: 'your-messaging-sender-id',
    appId: 'your-app-id'
  }
};
```

## Step 5: Security Rules (Optional)

In Firestore Database → Rules, you can set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bunnies/{document} {
      allow read, write: if true;  // Allow all access for development
    }
  }
}
```

## Step 6: Test Connection

1. Start the development server: `ng serve`
2. Navigate to the Configuration page
3. You should see "Connected to Firebase" with a green checkmark

## Data Structure

The app will create two collections in Firestore:

### 1. `configuration` Collection
Contains base scoring configuration:

```json
{
  "id": "base",
  "rewardScore": 1,
  "playScore": 2,
  "meals": {
    "lettuce": 1,
    "carrot": 3
  },
  "activities": {
    "play": 2,
    "petting": 1,
    "grooming": 1
  }
}
```

### 2. `bunnies` Collection
Contains individual bunny data:

```json
{
  "name": "Fluffy",
  "breed": "Holland Lop",
  "birthDate": "2023-01-15",
  "happiness": 8,
  "lastFed": "2024-01-20T10:30:00.000Z",
  "notes": "Loves carrots and hay"
}
```

## Scoring System

- **Lettuce**: +1 happiness point
- **Carrot**: +3 happiness points  
- **Play Activity**: +2 happiness points
- **General Rewards**: +1 happiness point
- **Petting/Grooming**: +1 happiness point each

## Troubleshooting

- **Connection errors**: Check your Firebase config values
- **Permission errors**: Ensure Firestore is in test mode
- **Build errors**: Make sure Firebase is installed: `npm install firebase`

## Next Steps

Once Firebase is connected, you can:
1. Add bunnies through the Details page
2. Update happiness levels
3. View all bunny data in Firebase Console
4. Deploy to production with the same Firebase project 
