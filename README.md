# UVbunny 🐰 - Bunny Happiness Manager

A delightful Angular application for managing and monitoring bunny happiness with real-time updates and intelligent event processing.

## ✨ What is UVbunny?

UVbunny is a modern web application that helps you:
- **Track your bunnies' happiness** in real-time
- **Feed and play** with your bunnies to increase their happiness
- **Monitor overall happiness** across all your bunnies
- **View detailed statistics** and manage bunny profiles
- **Get instant updates** when happiness levels change

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Firebase CLI (`npm install -g firebase-tools`)
- Angular CLI (`npm install -g @angular/cli`)

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd uvbunny
npm run install:all
```

### 2. Set Up Firebase
1. Copy environment templates:
   ```bash
   cd client/src/environments
   cp environment.template.ts environment.ts
   cp environment.prod.template.ts environment.prod.ts
   ```

2. Add your Firebase configuration to both files (get from Firebase Console)

### 3. Start Development
```bash
# Start Angular app
npm run serve:client

# Start Firebase emulators (in another terminal)
npm run emulators
```

Visit `http://localhost:4200` to see your bunnies! 🐰

## 🎯 Key Features

### 🏠 **Home Dashboard**
- **Real-time happiness meter** showing overall bunny happiness
- **Multiple view modes**: Chart, Table, and Pen views
- **Progressive loading** with smart pagination
- **Live updates** when bunnies are added or happiness changes
- **Add new bunnies** with custom names and colors

### 🐰 **Bunny Management**
- **Individual bunny profiles** with detailed information
- **Happiness tracking** with visual indicators
- **Activity history** showing feed and play events
- **Color-coded happiness levels** (Red → Orange → Yellow → Green)

### 🎮 **Interactive Activities**
- **Feed bunnies** with carrots or lettuce (different happiness boosts)
- **Play with bunnies** by pairing them with other bunnies
- **Real-time scoring** based on activities
- **Automatic happiness calculations** via Cloud Functions

### ⚙️ **Configuration**
- **Customizable scoring system** for different activities
- **Meal happiness values** (carrots vs lettuce)
- **Activity multipliers** for play, petting, and grooming

## 🏗️ Technical Architecture

### Frontend (Angular 18)
- **Modern Angular** with standalone components
- **Bootstrap 5** for responsive, beautiful UI
- **Real-time subscriptions** to Firestore data
- **Progressive loading** with infinite scroll
- **Smart pagination** using summary data

### Backend (Firebase)
- **Cloud Functions** for event processing
- **Firestore** for real-time data storage
- **Event-driven architecture** for happiness calculations
- **Automatic summary updates** for performance

### Data Flow
1. **User Action** → Feed/Play with bunny
2. **Event Creation** → Stored in Firestore
3. **Cloud Function** → Processes event and updates happiness
4. **Real-time Update** → UI reflects changes instantly

## 📊 Data Structure

### Bunnies Collection
```typescript
{
  id: string,
  name: string,
  happiness: number, // 0-10 scale
  color: string,
  birthDate: string,
  playMates: string[] // Array of bunny IDs
}
```

### Summary Data
```typescript
{
  totalBunnies: number,
  totalHappiness: number,
  averageHappiness: number, // 0-10 scale
  lastUpdated: Timestamp,
  lastEventId: string
}
```

## 🎨 UI Components

### Views
- **Chart View**: Visual bar chart of bunny happiness
- **Table View**: Sortable table with search functionality
- **Pen View**: Interactive bunny pen with hover effects

### Features
- **Responsive design** works on all devices
- **Loading states** with spinners and progress indicators
- **Error handling** with retry mechanisms
- **Notifications** for new bunnies and updates

## 🚀 Deployment

### Deploy Everything
```bash
npm run deploy:all
```

### Deploy Individual Parts
```bash
npm run deploy:client    # Deploy Angular app
npm run deploy:functions # Deploy Cloud Functions
```

## 🔧 Development

### Available Scripts
```bash
npm run serve:client     # Start Angular dev server
npm run serve:functions  # Start Functions emulator
npm run emulators        # Start all Firebase emulators
npm run build:all        # Build for production
npm run test:client      # Run Angular tests
```

### Project Structure
```
uvbunny/
├── client/                 # Angular application
│   ├── src/app/
│   │   ├── pages/         # Main pages (home, bunny-detail, config)
│   │   ├── services/      # Data services and Firebase integration
│   │   └── utils/         # Utility functions
│   └── environments/      # Firebase configuration
├── functions/             # Firebase Cloud Functions
│   └── src/              # Event processing and summary calculations
└── firebase.json         # Firebase configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues
- **Environment not set up**: Make sure you've copied and configured the environment files
- **Firebase not connected**: Check your Firebase configuration in environment files
- **Functions not working**: Ensure Firebase emulators are running locally

### Getting Help
- Check the console for error messages
- Verify Firebase configuration
- Ensure all dependencies are installed

---

**Made with ❤️ for happy bunnies everywhere! 🐰**
