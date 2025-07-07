# UVbunny - Bunny Management App

A modern Angular application for managing bunny happiness with Firebase Cloud Functions backend.

## 🏗️ Project Structure

```
uvbunny/
├── client/                 # Angular application
│   ├── src/               # Angular source code
│   ├── angular.json       # Angular configuration
│   ├── package.json       # Client dependencies
│   └── tsconfig.json      # TypeScript configuration
├── functions/             # Firebase Cloud Functions
│   ├── src/               # Functions source code
│   ├── package.json       # Functions dependencies
│   └── tsconfig.json      # TypeScript configuration
├── firebase.json          # Firebase configuration
├── .firebaserc           # Firebase project settings
└── package.json          # Root project management
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI
- Angular CLI

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   # Start Angular dev server
   npm run serve:client
   
   # Start Firebase emulators
   npm run emulators
   ```

3. **Build for production:**
   ```bash
   npm run build:all
   ```

4. **Deploy to Firebase:**
   ```bash
   npm run deploy:all
   ```

## 📋 Available Scripts

### Root Level
- `npm run install:all` - Install dependencies for all projects
- `npm run build:all` - Build both client and functions
- `npm run deploy:all` - Deploy everything to Firebase
- `npm run emulators` - Start Firebase emulators

### Client (Angular)
- `npm run serve:client` - Start Angular development server
- `npm run build:client` - Build Angular app for production
- `npm run test:client` - Run Angular tests

### Functions (Firebase)
- `npm run serve:functions` - Start functions emulator
- `npm run build:functions` - Build TypeScript functions
- `npm run test:functions` - Run function tests

## 🔧 Development

### Client Development
```bash
cd client
npm start
```

### Functions Development
```bash
cd functions
npm run serve
```

### Firebase Emulators
```bash
firebase emulators:start
```

## 🎯 Features

- **Bunny Management**: Add, view, and manage bunny profiles
- **Happiness Tracking**: Real-time happiness monitoring
- **Event-Driven Architecture**: Actions trigger events processed by Cloud Functions
- **Real-time Updates**: Live data synchronization with Firestore
- **Responsive Design**: Modern UI with Bootstrap

## 📊 Event System

The app uses an event-driven architecture:

1. **Frontend Actions**: User clicks feed/play buttons
2. **Event Creation**: Events are stored in `bunnieEvent` collection
3. **Cloud Function Processing**: Automatic happiness calculation and updates
4. **Real-time Updates**: UI reflects changes immediately

### Event Types
- **Feed Events**: `{ eventType: 'feed', eventData: { feedType: 'carrot' | 'lettuce' } }`
- **Play Events**: `{ eventType: 'play', eventData: { playedWithBunnyId: string } }`

## 🚀 Deployment

### Deploy Everything
```bash
npm run deploy:all
```

### Deploy Client Only
```bash
npm run deploy:client
```

### Deploy Functions Only
```bash
npm run deploy:functions
```

## 📝 Configuration

### Firebase Configuration
- `firebase.json` - Hosting and functions configuration
- `.firebaserc` - Project settings

### Environment Variables
Create `client/src/environments/environment.ts` for Firebase config.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
