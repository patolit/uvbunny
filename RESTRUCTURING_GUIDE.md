# UVbunny Project Restructuring Guide

## 🏗️ New Project Structure

```
uvbunny/
├── client/                 # Angular app
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── functions/              # Firebase Cloud Functions
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── firebase.json           # Firebase config
├── .firebaserc            # Firebase project config
└── README.md
```

## 📋 Step-by-Step Restructuring

### Step 1: Create Directories
```bash
mkdir functions
```

### Step 2: Move Angular Files to Client
```bash
# Move Angular-specific files to client/
mv src/ client/
mv angular.json client/
mv tsconfig*.json client/
mv package.json client/
mv package-lock.json client/
mv public/ client/
```

### Step 3: Update Angular Configuration
Update `client/angular.json` to change the output path:
```json
{
  "projects": {
    "uvbunny": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/uvbunny/browser"
          }
        }
      }
    }
  }
}
```

### Step 4: Install Functions Dependencies
```bash
cd functions
npm install
```

### Step 5: Build and Deploy
```bash
# Build functions
cd functions
npm run build

# Deploy to Firebase
firebase deploy
```

## 🔧 Firebase Configuration

### firebase.json
- **Hosting**: Points to `client/dist/uvbunny/browser`
- **Functions**: Points to `functions` directory
- **Predeploy**: Builds functions before deployment

### .firebaserc
- Configures the Firebase project name

## 🚀 Cloud Functions

### processBunnyEvent
- **Trigger**: Firestore document creation in `bunnieEvent` collection
- **Action**: 
  1. Reads bunny data and configuration
  2. Calculates happiness increase based on event type
  3. Updates bunny happiness
  4. Marks event as processed

### processAllUnprocessedEvents
- **Trigger**: HTTP request
- **Action**: Processes all unprocessed events manually

## 📊 Event Structure

### Feed Events
```typescript
{
  bunnyId: "bunny123",
  eventType: "feed",
  eventData: {
    feedType: "carrot" // or "lettuce"
  },
  timestamp: new Date()
}
```

### Play Events
```typescript
{
  bunnyId: "bunny123",
  eventType: "play",
  eventData: {
    playedWithBunnyId: "bunny123"
  },
  timestamp: new Date()
}
```

## 🎯 Benefits

1. **Separation of Concerns**: Client and server code are clearly separated
2. **Scalability**: Cloud Functions can handle high load
3. **Real-time Processing**: Events are processed automatically
4. **Audit Trail**: All actions are logged with timestamps
5. **Flexibility**: Easy to modify business logic without client updates

## 🔄 Development Workflow

1. **Client Development**: Work in `client/` directory
2. **Functions Development**: Work in `functions/src/` directory
3. **Local Testing**: Use Firebase emulators
4. **Deployment**: Deploy both client and functions together

## 📝 Next Steps

1. Move your Angular files to the `client/` directory
2. Install functions dependencies
3. Test locally with Firebase emulators
4. Deploy to Firebase
5. Update your CI/CD pipeline if needed 
