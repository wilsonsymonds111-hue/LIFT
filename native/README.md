# LIFT - Native Mobile App

A React Native + Expo-powered gym workout logger for iOS and Android.

## 🚀 Features

- **Workout Logging**: Track sets, reps, and weight for every exercise
- **Progress Charts**: Visualize your strength gains over time
- **Exercise Goals**: Set and monitor goals for each exercise
- **Bodyweight Tracking**: Log daily bodyweight with history and trends
- **Instagram Story Sharing**: Share PRs directly to Instagram Stories
- **Split Management**: Create and manage workout splits
- **Dark Mode**: Native dark mode support with system preference sync
- **Offline Support**: Full offline functionality with local storage
- **Native Performance**: Smooth 60fps animations and haptic feedback
- **Cross-platform**: Single codebase for iOS and Android

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Xcode 14+ (for iOS)
- Android Studio (for Android)

## 🔧 Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd native
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Base44 API credentials
   ```

4. **Start the development server**
   ```bash
   npm run start
   ```

5. **Run on simulator/device**
   - **iOS**: Press `i` or run `npm run ios`
   - **Android**: Press `a` or run `npm run android`

## 📁 Project Structure

```
native/
├── src/
│   ├── app/
│   │   ├── (tabs)/              # Main tab navigation
│   │   │   ├── _layout.tsx      # Tab router
│   │   │   ├── index.tsx        # Home screen
│   │   │   ├── splits.tsx       # Splits/Templates
│   │   │   ├── progress.tsx     # Progress charts
│   │   │   └── profile.tsx      # Profile & settings
│   │   └── _layout.tsx          # Root router
│   ├── components/               # Reusable components
│   │   ├── WorkoutLogger.tsx    # Set tracking UI
│   │   ├── ProgressChart.tsx    # Chart visualization
│   │   └── ...
│   ├── lib/
│   │   ├── api/
│   │   │   └── base44Client.ts  # Base44 API client
│   │   ├── hooks/
│   │   │   └── useTheme.ts      # Theme management
│   │   └── store/
│   │       └── workoutStore.ts  # Zustand state
│   └── utils/
│       └── shareInstagram.ts    # Instagram sharing
├── app.json                      # Expo configuration
├── package.json
└── tsconfig.json
```

## 🎯 Architecture

### State Management
- **Zustand**: Global state for workouts and exercises
- **React Query**: Server state and API caching
- **AsyncStorage**: Local persistence

### Navigation
- **Expo Router**: File-based routing
- **Tab Navigation**: Main app tabs
- **Stack Navigation**: Sub-screens and modals

### Styling
- **NativeWind**: Tailwind CSS for React Native
- **StyleSheet**: Platform-optimized styles

### API Integration
- **Axios**: HTTP client with interceptors
- **Base44 SDK**: Backend integration
- **Authentication**: Token-based with automatic refresh

## 🚢 Building for Production

### iOS
```bash
npm run build:ios
```

### Android
```bash
npm run build:android
```

## 📱 Key Components

### WorkoutLogger
Tracks sets with weight, reps, and optional notes.

```tsx
<WorkoutLogger
  exerciseId="bench-press"
  exerciseName="Bench Press"
  sets={sets}
/>
```

### ProgressChart
Displays progress over time with configurable metrics.

```tsx
<ProgressChart
  sets={sets}
  exerciseName="Squat"
  showType="weight"
/>
```

## 🎨 Customization

### Theme
Edit colors in `useTheme.ts`:
```ts
const colors = {
  bg: isDark ? '#000000' : '#FFFFFF',
  accent: '#FF6B35',
  // ...
};
```

### API
Configure Base44 in `.env`:
```
EXPO_PUBLIC_BASE44_APP_ID=your_app_id
EXPO_PUBLIC_BASE44_BASE_URL=https://api.base44.com
```

## 🔐 Security

- Tokens stored securely in AsyncStorage
- API requests use HTTPS
- Automatic token refresh on expiry
- No sensitive data in logs

## 📦 Dependencies

- `expo-router` - File-based routing
- `react-native-reanimated` - Smooth animations
- `zustand` - State management
- `@tanstack/react-query` - Data fetching
- `react-native-svg-charts` - Progress visualization
- `react-native-share` - Instagram integration
- `nativewind` - Styling

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 🐛 Troubleshooting

### Build Issues
- Clear cache: `expo prebuild --clean`
- Reinstall: `rm -rf node_modules && npm install`

### Performance
- Enable Hermes engine in `app.json`
- Profile with React Profiler in dev tools

### Android Build
- Ensure `ANDROID_HOME` is set
- Update Android SDK to latest

## 📚 Documentation

- [Expo Docs](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [React Query Docs](https://tanstack.com/query/latest)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a PR

## 📄 License

MIT

---

Built with ❤️ for fitness enthusiasts
