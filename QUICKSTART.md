# Sonic Battle - Quick Start Guide

## 🚀 Running the Application

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   - The app will automatically open at `http://localhost:3000`
   - Or manually navigate to that URL

## 🎮 How to Use

### 1. Lobby Screen
- Select number of players (2, 3, or 4)
- Enter Codeforces handles for each player
- Click "Validate All Handles" to verify handles
- Configure match settings:
  - **Final Lap**: Toggle to enable 2x points in last 25% of match time
  - **Problem Categories**: Select one or more categories (or none for all problems)
  - **Max Rating**: Set maximum problem rating (800-3000)
  - **Match Duration**: Set match length (20-120 minutes)
- Click "START BATTLE ⚡" to begin

### 2. Match Screen
- View live leaderboard with animated progress bars
- See all available problems with their "Sonic Points"
- Problems link directly to Codeforces
- Watch real-time updates as players solve problems
- Timer shows remaining time
- "FINAL LAP" indicator appears when in final 25% of time

### 3. Results Screen
- View final standings
- Click "Reveal Mystery Problem" to see which problem awarded 2x points
- See all problems solved during the match
- Options to start a new match or go to spectator mode

### 4. Spectator Mode
- View live scoreboard
- Send emoji bursts (🎉, ⚡, 💎, 🔥, ⭐, 🚀) that animate across the screen
- Perfect for sharing the match URL with viewers

## 🎯 Key Features

- **Mystery Problem**: One random problem awards 2x points (hidden until results)
- **Point Formula**: `500 * (1.32^((Rating - 800)/200))`
- **First-to-Solve**: First player to get AC wins the points
- **Tie-Breaker**: If multiple solves in same minute, smaller submission ID wins
- **Final Lap**: All points doubled in last 25% of match time (if enabled)
- **Real-time Updates**: Automatic polling of Codeforces API every 5 seconds
- **Problem Filtering**: Only shows unsolved problems matching your criteria

## 📝 Notes

- All handles must be valid Codeforces handles
- Problems are pre-filtered to exclude any solved by players
- The app respects Codeforces API rate limits (2 seconds between requests)
- Match data is stored in sessionStorage (cleared when browser tab closes)

Enjoy the battle! ⚡
